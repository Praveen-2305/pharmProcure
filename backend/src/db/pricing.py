"""
Pricing Reference Database & NPPA/DPCO Ceiling Lookup Service.
Loads data from ingestion/sql/pricing_ceiling_catalog.json.
"""

import os
import json
from typing import Optional, Dict, Any

backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PRICING_CANDIDATE_FILES = [
    os.path.join(backend_root, "processed_data", "pricing_ceiling_catalog.json"),
    os.path.join(backend_root, "ingestion", "sql", "pricing_ceiling_catalog.json"),
]

def get_pricing_database() -> Dict[str, Any]:
    """Loads NPPA/DPCO ceiling prices from persistent database or storage fallback."""
    for path in PRICING_CANDIDATE_FILES:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[PricingDB] Error loading pricing JSON from {path}: {e}")
    return {"items": []}

def lookup_ceiling_price(category: str) -> Optional[float]:
    """
    Looks up the statutory NPPA ceiling price or threshold for a pharmaceutical category.
    Returns None if category is not recognized (yielding INDETERMINATE risk).
    """
    db = get_pricing_database()
    items = db.get("items", [])
    cat_lower = category.lower()

    for item in items:
        item_cat = item.get("category", "").lower()
        if item_cat in cat_lower or cat_lower in item_cat:
            # Return deal_ceiling_threshold or ceiling_price
            return item.get("deal_ceiling_threshold") or item.get("ceiling_price")

    return None
