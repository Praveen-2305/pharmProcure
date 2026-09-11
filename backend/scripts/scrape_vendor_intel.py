"""
Vendor Intelligence & Web Scraping CLI Script.
Queries adverse media, regulatory alerts, and judicial dockets for a vendor.
Usage: python scripts/scrape_vendor_intel.py [VendorName]
"""

import sys
import os
import json

backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from src.agents.web_scraper import vendor_scraper

import argparse

def run_scraper():
    parser = argparse.ArgumentParser(description="Vendor Intelligence & Regulatory Web Scraper")
    parser.add_argument("vendor_pos", nargs="?", default=None, help="Vendor name (positional)")
    parser.add_argument("--vendor", "-v", default=None, help="Vendor name")
    parser.add_argument("--category", "-c", default="Pharmaceuticals", help="Product category")
    args = parser.parse_args()

    vendor_name = args.vendor or args.vendor_pos or "Apex BioLogistics"
    category = args.category

    print("=" * 60)
    print(f"Vendor Web Intelligence Scraper")
    print(f"Target: {vendor_name} | Category: {category}")
    print("=" * 60)

    intel = vendor_scraper.scrape_vendor_intelligence(vendor_name, category)
    print(json.dumps(intel, indent=2))
    print("=" * 60)

if __name__ == "__main__":
    run_scraper()

