# Web Scrapping Architecture & Data Collection

This folder governs the Web Scraper Agent (The "Hunter"). When a procurement request involves an unknown vendor, the system routes the request to the FULL pipeline to gather live external intelligence.

## Pipeline Trigger
The Scraper Agent is invoked when the Planner determines a vendor is **UNKNOWN** (no robust record exists in the SQL cache). It uses live tools (Tavily, DuckDuckGo) combined with Google Gemini (`langchain-google-genai`) to hunt for external intelligence.

## Data Collected by Web Scraper (LLM Extraction):

When the scraper pulls raw HTML from the internet, it asks Gemini to extract and synthesize the following structured fields:

1. **`vendor_name`**: Exact legal name of the entity being researched.
2. **`litigation_records`**: Array of text strings summarizing any found lawsuits, arbitration, or commercial disputes involving the vendor.
3. **`regulatory_warnings`**: Array of text strings summarizing CDSCO show-cause notices, FDA 483 citations, or NPPA ceiling violations.
4. **`product_recalls`**: Array of text strings summarizing historical batch rejections or cold-chain transit holds.
5. **`news_sentiment`**: LLM-derived sentiment (Must be exactly one of: Positive, Neutral, Adverse).
6. **`risk_signal`**: LLM-derived risk heuristic (LOW, MEDIUM, HIGH) based on the presence and severity of lawsuits or regulatory warnings.
7. **`sources_scraped`**: Array of URLs where the intelligence was found, used to provide citations in the final UI report.

*Note: This scraped data is ephemeral within the agent state until the Executor Agent explicitly saves it into the SQL `vendor_profiles` table for permanent caching.*
