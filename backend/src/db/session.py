"""
Database session and persistent store for AutonoSource cases.
Backs case records with a thread-safe in-memory cache and a persistent
SQLite database located at processed_data/procurement_cases.db.
"""

import os
import sys
import json
import sqlite3
from typing import Dict, List, Optional
from datetime import datetime, timezone

from src.models.schemas import (
    ProcurementItemSummary,
    PendingApprovalItem,
    WorkflowStatus,
    ProcurementReport,
    ApprovalRecord
)
from src.db.seed import get_initial_seed_cases

backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_DIR = os.path.join(backend_root, "processed_data")
SQLITE_PATH = os.path.join(DB_DIR, "procurement_cases.db")
JSON_PATH = os.path.join(DB_DIR, "cases.json")

class CaseStore:
    """
    Unified procurement case store with SQLite persistence and fast in-memory indexing.
    """
    def __init__(self, db_path: str = SQLITE_PATH):
        self.db_path = db_path
        self._cases: Dict[str, ProcurementItemSummary] = {}
        self._init_sqlite()
        self._load_or_seed()

    def _init_sqlite(self):
        """Initializes the SQLite schema if not present."""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS procurement_cases (
                        procurement_id TEXT PRIMARY KEY,
                        vendor_name TEXT NOT NULL,
                        deal_size REAL NOT NULL,
                        status_json TEXT NOT NULL,
                        report_json TEXT,
                        approval_json TEXT,
                        created_at TEXT NOT NULL
                    )
                """)
                conn.commit()
        except Exception as e:
            print(f"[CaseStore] SQLite init note: {e}")

    def _load_or_seed(self):
        """Loads cases from SQLite, or seeds initial dataset if table is empty."""
        loaded_count = 0
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT procurement_id, vendor_name, deal_size, status_json, report_json, approval_json, created_at FROM procurement_cases")
                rows = cursor.fetchall()
                for row in rows:
                    p_id, v_name, d_size, st_json, rep_json, app_json, c_at = row
                    status = WorkflowStatus(**json.loads(st_json))
                    report = ProcurementReport(**json.loads(rep_json)) if rep_json else None
                    approval = ApprovalRecord(**json.loads(app_json)) if app_json else None
                    summary = ProcurementItemSummary(
                        procurement_id=p_id,
                        vendor_name=v_name,
                        deal_size=d_size,
                        status=status,
                        report=report,
                        approval=approval,
                        created_at=c_at
                    )
                    self._cases[p_id] = summary
                    loaded_count += 1
        except Exception as e:
            print(f"[CaseStore] SQLite read note: {e}")

        if loaded_count == 0:
            # Seed default cases
            for case in get_initial_seed_cases():
                self.save(case)

    def get_all(self) -> List[ProcurementItemSummary]:
        return sorted(self._cases.values(), key=lambda c: c.created_at, reverse=True)

    def get(self, procurement_id: str) -> Optional[ProcurementItemSummary]:
        return self._cases.get(procurement_id)

    def save(self, item: ProcurementItemSummary):
        self._cases[item.procurement_id] = item
        # Persist to SQLite
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                status_json = json.dumps(item.status.model_dump(by_alias=True))
                report_json = json.dumps(item.report.model_dump(by_alias=True)) if item.report else None
                approval_json = json.dumps(item.approval.model_dump(by_alias=True)) if item.approval else None
                
                cursor.execute("""
                    INSERT INTO procurement_cases (procurement_id, vendor_name, deal_size, status_json, report_json, approval_json, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(procurement_id) DO UPDATE SET
                        status_json = excluded.status_json,
                        report_json = excluded.report_json,
                        approval_json = excluded.approval_json
                """, (item.procurement_id, item.vendor_name, item.deal_size, status_json, report_json, approval_json, item.created_at))
                conn.commit()
        except Exception as e:
            # In memory remains consistent even if disk write has issues
            pass

    def get_pending_approvals(self) -> List[PendingApprovalItem]:
        pending = []
        for case in self._cases.values():
            if case.status.stage == "AWAITING_APPROVAL" and case.approval is None:
                risk = case.report.risk_assessment if case.report else None
                pending.append(
                    PendingApprovalItem(
                        procurement_id=case.procurement_id,
                        vendor_name=case.vendor_name,
                        deal_size=case.deal_size,
                        submitted_at=case.created_at,
                        overall_risk=risk.overall_risk if risk else "MEDIUM",
                        confidence_score=risk.confidence_score if risk else 0.75,
                        investigation_plan=case.status.investigation_plan,
                        summary=case.report.vendor_summary if case.report else "Awaiting decision."
                    )
                )
        return pending

# Global singleton instance
case_store = CaseStore()
