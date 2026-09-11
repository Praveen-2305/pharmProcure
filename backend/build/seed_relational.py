"""
Database Build Module for AutonoSource (pharmProcure).
Seeds the procurement case store with realistic baseline cases,
pricing benchmarks, and regulatory compliance records.
"""

import sys
import os

backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app.db.session import case_store
from app.db.seed import get_initial_seed_cases

def run_database_seed():
    print("-" * 55)
    print("▶ [Build: Database] Seeding Relational & Case Ledger Data")
    print("-" * 55)

    cases = get_initial_seed_cases()
    for case in cases:
        case_store.save(case)
        print(f"  ✓ Seeded Case [{case.procurement_id}]: {case.vendor_name} | Deal: ${case.deal_size:,.2f} | Stage: {case.status.stage}")

    all_cases = case_store.get_all()
    pending = case_store.get_pending_approvals()

    # Also dump serialized cases.json ledger into database/relational/
    import json
    db_rel_dir = os.path.join(backend_root, "database", "relational")
    os.makedirs(db_rel_dir, exist_ok=True)
    json_path = os.path.join(db_rel_dir, "cases.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump([c.model_dump(by_alias=True) for c in all_cases], f, indent=2)

    print(f"  ✓ Persisted Case Ledger: {json_path}")
    print(f"\n  [Database Ready] Total Cases: {len(all_cases)} | Pending Authorizations: {len(pending)}")
    return True

if __name__ == "__main__":
    run_database_seed()

