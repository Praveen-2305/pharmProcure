"""
Web Scraper & External Intelligence Engine for AutonoSource (pharmProcure).
Scrapes/queries public regulatory alerts, CDSCO notices, FDA 483 citations,
product recalls, and judicial litigation records for target pharmaceutical vendors.
Supports:
1. Live API querying via Tavily (if TAVILY_API_KEY is configured)
2. Live HTTP search fallback via DuckDuckGo / Public regulatory feeds
3. Curated pharmaceutical regulatory due diligence registry
"""

import os
import re
from typing import Dict, List, Any, Optional
import httpx
import json

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

# Ensure .env is loaded
backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(backend_root, '.env'))

class VendorWebScraper:
    """
    Automated web scraper and regulatory docket crawler for vendor due diligence.
    Uses LLM to extract structured intelligence from raw web search results.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("TAVILY_API_KEY", "")
        self.has_live_api = bool(self.api_key and self.api_key.strip())
        self.llm = ChatOpenAI(
            api_key=os.getenv("GROQ_API_KEY"),
            base_url="https://api.groq.com/openai/v1",
            model=os.getenv("GROQ_MODEL", "gpt-oss-120b"),
            temperature=0.1
        )

    def _search_live_http(self, query: str) -> List[Dict[str, str]]:
        """Performs a live HTTP search query against public search endpoints."""
        results = []
        try:
            with httpx.Client(timeout=3.5, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AutonoSource-Audit/2.0"}) as client:
                resp = client.post("https://html.duckduckgo.com/html/", data={"q": query})
                if resp.status_code == 200:
                    snippets = re.findall(r'<a class="result__snippet[^>]*>(.*?)</a>', resp.text, re.DOTALL)
                    urls = re.findall(r'<a class="result__url"[^>]*href="([^"]+)"', resp.text)
                    for s, u in zip(snippets[:5], urls[:5]):
                        clean_text = re.sub(r"<[^>]+>", "", s).strip()
                        results.append({"text": clean_text, "url": u.strip()})
        except Exception as e:
            pass
        return results

    def _extract_with_llm(self, vendor_name: str, raw_texts: List[str], urls: List[str]) -> Dict[str, Any]:
        """Uses LLM to extract structured vendor intelligence from raw web text."""
        from src.prompts.scraper_prompt import get_scraper_prompt, SCRAPER_SYSTEM_PROMPT
        
        snippets_text = "\n".join([f"- {t}" for t in raw_texts])
        formatted_prompt = get_scraper_prompt(vendor_name, snippets_text)
        
        try:
            response = self.llm.invoke([
                {"role": "system", "content": SCRAPER_SYSTEM_PROMPT},
                {"role": "user", "content": formatted_prompt}
            ])

            # Clean JSON formatting if LLM added markdown ticks
            clean_json = response.content.replace("```json", "").replace("```", "").strip()
            extracted = json.loads(clean_json)
            extracted["sources_scraped"] = urls
            extracted["source_type"] = "llm_web_extraction"
            return extracted
        except Exception as e:
            print(f"[WebScraper] LLM extraction note ({e}). Using rule-based regex parser.")
            
            # Rule-based fallback extraction from snippets
            lit_records = []
            reg_warnings = []
            recalls = []
            combined = " ".join(raw_texts).lower()

            for t in raw_texts:
                t_lower = t.lower()
                if any(w in t_lower for w in ["lawsuit", "litigation", "arbitration", "nclt", "commercial dispute", "court"]):
                    lit_records.append(t[:200])
                if any(w in t_lower for w in ["fda 483", "warning letter", "cdsco notice", "violation", "show-cause", "suspension", "form 483"]):
                    reg_warnings.append(t[:200])
                if any(w in t_lower for w in ["recall", "spoilage", "cold-chain failure", "temperature breach", "adulterated"]):
                    recalls.append(t[:200])

            is_adverse = bool(lit_records or reg_warnings or recalls)
            risk_signal = "HIGH" if (len(reg_warnings) > 1 or len(recalls) > 0) else ("MEDIUM" if is_adverse else "LOW")
            sentiment = "Adverse" if is_adverse else "Positive"

            return {
                "vendor_name": vendor_name,
                "litigation_records": lit_records,
                "regulatory_warnings": reg_warnings,
                "product_recalls": recalls,
                "news_sentiment": sentiment,
                "risk_signal": risk_signal,
                "sources_scraped": urls,
                "source_type": "rule_based_fallback"
            }


    def scrape_vendor_intelligence(self, vendor_name: str, category: str = "Pharmaceuticals") -> Dict[str, Any]:
        """
        Gathers live web intelligence regarding litigation, recall alerts, and sentiment,
        and uses Gemini to structure the response.
        """
        print(f"[WebScraper] Crawling external intelligence for: {vendor_name} ({category})")
        
        scraped_texts = []
        scraped_urls = []
        
        if self.has_live_api:
            try:
                from tavily import TavilyClient
                client = TavilyClient(api_key=self.api_key)
                query = f"{vendor_name} regulatory warning recall lawsuit CDSCO FDA"
                search_res = client.search(query=query, search_depth="basic", max_results=5)
                results = search_res.get("results", [])
                scraped_texts = [r.get("content", "") for r in results]
                scraped_urls = [r.get("url", "") for r in results]
            except Exception as e:
                print(f"[WebScraper] Live Tavily API scrape note: {e}. Falling back to HTTP search.")

        if not scraped_texts:
            http_results = self._search_live_http(f"{vendor_name} CDSCO FDA lawsuit recall")
            scraped_texts = [r["text"] for r in http_results]
            scraped_urls = [r["url"] for r in http_results]
            
        if not scraped_texts:
            print("[WebScraper] No web results found. Returning clean record.")
            return self._extract_with_llm(vendor_name, ["No news or litigation found."], [])
            
        return self._extract_with_llm(vendor_name, scraped_texts, scraped_urls)

# Global singleton instance
vendor_scraper = VendorWebScraper()
