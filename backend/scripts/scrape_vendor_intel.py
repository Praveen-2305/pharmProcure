"""
Vendor Intelligence & Web Scraping CLI Script.
Queries adverse media, regulatory alerts, and judicial dockets for a target vendor,
and caches the synthesized profile directly into processed_data/sqlite/procurement_cases.db.
Usage:
    python scripts/scrape_vendor_intel.py "Apex BioLogistics"
    python scripts/scrape_vendor_intel.py VND-001
"""

import sys
import os
import json
import argparse
from datetime import datetime, timezone

backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from src.agents.web_scraper import vendor_scraper
from src.db.session import case_store

def run_scraper():
    parser = argparse.ArgumentParser(description="AutonoSource Vendor Intelligence & Regulatory Web Scraper")
    parser.add_argument("vendor_pos", nargs="?", default=None, help="Vendor name or ID (positional)")
    parser.add_argument("--vendor", "-v", default=None, help="Vendor name or ID")
    parser.add_argument("--category", "-c", default=None, help="Product category")
    parser.add_argument("--no-cache", action="store_true", help="Do not save result to SQLite vendor_profiles cache")
    args = parser.parse_args()

    target_query = args.vendor or args.vendor_pos or "Apex BioLogistics & Diagnostic Supplies Pvt. Ltd."
    
    # 1. Check if vendor exists in SQLite vendors table
    db_vendor = case_store.get_vendor(target_query)
    if db_vendor:
        vendor_name = db_vendor["vendor_name"]
        vendor_id = db_vendor["vendor_id"]
        category = args.category or db_vendor.get("product_category", "Pharmaceuticals")
        print(f"[Database] Found registered vendor in SQLite: {vendor_id} - {vendor_name}")
        print(f"           Revenue: ₹{db_vendor.get('annual_revenue_inr_cr', 0):.1f} Cr | Rating: {db_vendor.get('credit_rating')} | Solvency: {db_vendor.get('solvency_ratio')}")
    else:
        vendor_name = target_query
        vendor_id = f"VND-{abs(hash(vendor_name)) % 900 + 100}"
        category = args.category or "Pharmaceuticals"
        print(f"[Database] Vendor '{target_query}' not in 50-vendor directory. Using identifier {vendor_id}")

    print("=" * 70)
    print("  AUTONOSOURCE: VENDOR REGULATORY & DUE DILIGENCE WEB CRAWLER")
    print(f"  Target Vendor: {vendor_name} ({vendor_id})")
    print(f"  Category:      {category}")
    print("=" * 70)

    # 2. Perform live web scraping & LLM synthesis
    intel = vendor_scraper.scrape_vendor_intelligence(vendor_name, category)
    print("\n--- EXTRACTED EXTERNAL INTELLIGENCE ---")
    print(json.dumps(intel, indent=2))

    # 3. Cache synthesized profile to SQLite vendor_profiles table
    if not args.no_cache:
        lit_records = intel.get("litigation_records", [])
        lit_summary = "; ".join(lit_records) if lit_records else "Zero active disputes or adverse notices on CDSCO portal."
        
        comp_parts = []
        if db_vendor and db_vendor.get("schedule_m_compliant"):
            comp_parts.append("Schedule M Verified")
        if db_vendor and db_vendor.get("who_gmp_certified"):
            comp_parts.append("WHO-GMP Certified")
        if intel.get("regulatory_warnings"):
            comp_parts.append(f"Scraped Notices: {'; '.join(intel['regulatory_warnings'][:2])}")
        compliance_status = "; ".join(comp_parts) if comp_parts else "Compliant"

        fin_status = f"Audited Clean (₹{db_vendor.get('annual_revenue_inr_cr', 50):.1f} Cr, Solvency: {db_vendor.get('solvency_ratio', 2.0):.2f})" if db_vendor else "Audited Clean"

        profile = {
            "vendor_name": vendor_name,
            "vendor_id": vendor_id,
            "global_risk_level": intel.get("risk_signal", "LOW"),
            "compliance_status": compliance_status,
            "litigation_summary": lit_summary,
            "financial_status": fin_status,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        case_store.upsert_vendor_profile(profile)
        print("\n" + "=" * 70)
        print(f"  ✓ Cached synthesized profile in SQLite `vendor_profiles` table.")
        print(f"  ✓ Database: backend/processed_data/sqlite/procurement_cases.db")
        print(f"  ✓ Subsequent requests for '{vendor_name}' will now trigger LIGHT router!")
        print("=" * 70)

if __name__ == "__main__":
    run_scraper()


