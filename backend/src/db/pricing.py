"""
Pricing Reference Database & NPPA/DPCO Ceiling Lookup Service.
Loads data directly from processed_data/sqlite/procurement_cases.db (pricing_references table)
with fallback to processed_data/sqlite/pricing_ceiling_catalog.json.
"""

import os
import json
import sqlite3
from typing import Optional, Dict, Any, List

backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SQLITE_DB_PATH = os.path.join(backend_root, "processed_data", "sqlite", "procurement_cases.db")
PRICING_CANDIDATE_FILES = [
    os.path.join(backend_root, "processed_data", "sqlite", "pricing_ceiling_catalog.json"),
    os.path.join(backend_root, "processed_data", "pricing_ceiling_catalog.json"),
    os.path.join(backend_root, "ingestion", "sql", "pricing_ceiling_catalog.json"),
]

def get_pricing_from_sqlite() -> List[Dict[str, Any]]:
    """Fetches DPCO 2013 price ceiling benchmarks directly from the SQLite database."""
    if not os.path.exists(SQLITE_DB_PATH):
        return []
    try:
        with sqlite3.connect(SQLITE_DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM pricing_references")
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
    except Exception as e:
        print(f"[PricingDB] SQLite query note: {e}")
        return []

def get_pricing_database() -> Dict[str, Any]:
    """Loads NPPA/DPCO ceiling prices from SQLite database, with JSON file fallback."""
    # 1. Try SQLite pricing_references table
    sqlite_items = get_pricing_from_sqlite()
    if sqlite_items:
        return {"items": sqlite_items}

    # 2. Fallback to candidate JSON files
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
    Looks up the statutory NPPA ceiling price or threshold for a pharmaceutical category in INR.
    Returns None if category is not recognized (yielding INDETERMINATE risk).
    """
    if not category:
        return None

    db = get_pricing_database()
    items = db.get("items", [])
    cat_lower = category.lower().strip()

    for item in items:
        item_cat = item.get("category", "").lower()
        if item_cat in cat_lower or cat_lower in item_cat:
            # Return deal_ceiling_threshold or ceiling_price in INR
            threshold = item.get("deal_ceiling_threshold")
            if threshold is not None:
                return float(threshold)
            price = item.get("ceiling_price")
            if price is not None:
                return float(price)

    return None

