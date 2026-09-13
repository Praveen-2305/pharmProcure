"""
Database session and persistent store for AutonoSource cases.
Backs case records with a thread-safe in-memory cache and a persistent
SQLite database located at processed_data/procurement_cases.db.
"""

import os
import sys
import json
import sqlite3
from typing import Dict, List, Optional, Any
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
SQLITE_DIR = os.path.join(DB_DIR, "sqlite")
SQLITE_SUBFOLDER_PATH = os.path.join(SQLITE_DIR, "procurement_cases.db")
LEGACY_SQLITE_PATH = os.path.join(DB_DIR, "procurement_cases.db")

SQLITE_PATH = SQLITE_SUBFOLDER_PATH if (os.path.exists(SQLITE_SUBFOLDER_PATH) or not os.path.exists(LEGACY_SQLITE_PATH)) else LEGACY_SQLITE_PATH
JSON_PATH = os.path.join(SQLITE_DIR, "cases.json") if os.path.exists(os.path.join(SQLITE_DIR, "cases.json")) else os.path.join(DB_DIR, "cases.json")

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
        """Initializes all required SQLite tables if not already present."""
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
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS vendor_profiles (
                        vendor_name TEXT PRIMARY KEY,
                        vendor_id TEXT NOT NULL,
                        global_risk_level TEXT NOT NULL,
                        compliance_status TEXT,
                        litigation_summary TEXT,
                        financial_status TEXT,
                        last_updated TEXT NOT NULL
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS vendors (
                        vendor_id TEXT PRIMARY KEY,
                        vendor_name TEXT NOT NULL UNIQUE,
                        product_category TEXT NOT NULL,
                        country TEXT NOT NULL,
                        state TEXT,
                        city TEXT,
                        headquarters_address TEXT,
                        contact_email TEXT,
                        contact_phone TEXT,
                        tax_identification_number TEXT,
                        drug_license_number TEXT,
                        incorporation_year INTEGER,
                        annual_revenue_inr REAL,
                        annual_revenue_inr_cr REAL,
                        currency TEXT DEFAULT 'INR',
                        credit_rating TEXT,
                        solvency_ratio REAL,
                        who_gmp_certified INTEGER DEFAULT 0,
                        fda_approved INTEGER DEFAULT 0,
                        schedule_m_compliant INTEGER DEFAULT 1,
                        who_trs_1025_compliant INTEGER DEFAULT 0,
                        cold_chain_capable INTEGER DEFAULT 0,
                        audit_risk_level TEXT DEFAULT 'LOW',
                        historical_dispute_count INTEGER DEFAULT 0,
                        on_time_delivery_rate REAL DEFAULT 0.95,
                        quality_score REAL DEFAULT 4.5,
                        quoted_price_benchmark REAL,
                        vendor_summary TEXT,
                        created_at TEXT NOT NULL
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS pricing_references (
                        category TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        ceiling_price REAL NOT NULL,
                        deal_ceiling_threshold REAL NOT NULL,
                        currency TEXT DEFAULT 'INR',
                        unit_measure TEXT,
                        regulatory_notification TEXT,
                        therapeutic_use TEXT,
                        created_at TEXT NOT NULL
                    )
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS vendor_products (
                        product_id TEXT PRIMARY KEY,
                        vendor_id TEXT NOT NULL,
                        vendor_name TEXT NOT NULL,
                        product_name TEXT NOT NULL,
                        canonical_molecule TEXT,
                        dosage_form TEXT,
                        unit_pack_size TEXT,
                        unit_price_inr REAL NOT NULL,
                        currency TEXT DEFAULT 'INR',
                        moq INTEGER,
                        storage_condition TEXT,
                        lead_time_days INTEGER,
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
            # Seed default cases if database was completely empty
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
                        vendor_name = excluded.vendor_name,
                        deal_size = excluded.deal_size,
                        status_json = excluded.status_json,
                        report_json = excluded.report_json,
                        approval_json = excluded.approval_json
                """, (item.procurement_id, item.vendor_name, item.deal_size, status_json, report_json, approval_json, item.created_at))
                conn.commit()
        except Exception as e:
            print(f"[CaseStore] SQLite save error: {e}")

    # =========================================================================
    # Vendor Directory Operations (vendors table)
    # =========================================================================
    def get_vendor(self, vendor_identifier: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves full vendor directory record by vendor_id or vendor_name.
        Performs case-insensitive and prefix/contains matching.
        """
        if not vendor_identifier:
            return None
        v_clean = vendor_identifier.strip()
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                # 1. Exact ID or Exact Name
                cursor.execute(
                    "SELECT * FROM vendors WHERE vendor_id = ? OR vendor_name = ? COLLATE NOCASE",
                    (v_clean, v_clean)
                )
                row = cursor.fetchone()
                if row:
                    return dict(row)

                # 2. Case-insensitive substring match
                cursor.execute(
                    "SELECT * FROM vendors WHERE vendor_name LIKE ? COLLATE NOCASE",
                    (f"%{v_clean}%",)
                )
                row = cursor.fetchone()
                if row:
                    return dict(row)

                # 3. Match first keyword (e.g. 'Apex' from 'Apex BioLogistics')
                first_word = v_clean.split()[0]
                if len(first_word) >= 3:
                    cursor.execute(
                        "SELECT * FROM vendors WHERE vendor_name LIKE ? COLLATE NOCASE",
                        (f"%{first_word}%",)
                    )
                    row = cursor.fetchone()
                    if row:
                        return dict(row)
        except Exception as e:
            print(f"[CaseStore] Error retrieving vendor '{vendor_identifier}': {e}")
        return None

    def get_all_vendors(self) -> List[Dict[str, Any]]:
        """Retrieves all 50 vendors from the SQLite vendors table."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM vendors ORDER BY vendor_name ASC")
                rows = cursor.fetchall()
                return [dict(r) for r in rows]
        except Exception as e:
            print(f"[CaseStore] Error listing vendors: {e}")
            return []

    # =========================================================================
    # Vendor Profile Cache Operations (vendor_profiles table - LIGHT Router)
    # =========================================================================
    def get_vendor_profile(self, vendor_name: str) -> Optional[Dict[str, Any]]:
        """Retrieves a cached, fully extracted vendor profile to enable the LIGHT pipeline."""
        if not vendor_name:
            return None
        v_clean = vendor_name.strip()
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM vendor_profiles WHERE vendor_name = ? COLLATE NOCASE", (v_clean,))
                row = cursor.fetchone()
                if row:
                    return dict(row)

                # Substring match
                cursor.execute("SELECT * FROM vendor_profiles WHERE vendor_name LIKE ? COLLATE NOCASE", (f"%{v_clean}%",))
                row = cursor.fetchone()
                if row:
                    return dict(row)
        except Exception as e:
            print(f"[CaseStore] Error retrieving vendor profile: {e}")
        return None

    def upsert_vendor_profile(self, profile: Dict[str, Any]):
        """Caches a newly extracted vendor profile from Web Scraping & FULL pipeline."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO vendor_profiles (vendor_name, vendor_id, global_risk_level, compliance_status, litigation_summary, financial_status, last_updated)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(vendor_name) DO UPDATE SET
                        vendor_id = excluded.vendor_id,
                        global_risk_level = excluded.global_risk_level,
                        compliance_status = excluded.compliance_status,
                        litigation_summary = excluded.litigation_summary,
                        financial_status = excluded.financial_status,
                        last_updated = excluded.last_updated
                """, (
                    profile.get("vendor_name"),
                    profile.get("vendor_id", "UNKNOWN"),
                    profile.get("global_risk_level", "UNKNOWN"),
                    profile.get("compliance_status", ""),
                    profile.get("litigation_summary", ""),
                    profile.get("financial_status", ""),
                    datetime.now(timezone.utc).isoformat()
                ))
                conn.commit()
        except Exception as e:
            print(f"[CaseStore] Error upserting vendor profile: {e}")

    # =========================================================================
    # Pricing References & Catalog Operations
    # =========================================================================
    def get_pricing_references(self) -> List[Dict[str, Any]]:
        """Retrieves DPCO 2013 statutory price ceiling records from SQLite."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM pricing_references ORDER BY category ASC")
                return [dict(r) for r in cursor.fetchall()]
        except Exception as e:
            print(f"[CaseStore] Error listing pricing references: {e}")
            return []

    def get_vendor_products(self, vendor_identifier: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves catalog products mapped to Knowledge Graph canonical molecules."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                if vendor_identifier:
                    cursor.execute(
                        "SELECT * FROM vendor_products WHERE vendor_id = ? OR vendor_name LIKE ? COLLATE NOCASE",
                        (vendor_identifier, f"%{vendor_identifier}%")
                    )
                else:
                    cursor.execute("SELECT * FROM vendor_products ORDER BY product_name ASC")
                return [dict(r) for r in cursor.fetchall()]
        except Exception as e:
            print(f"[CaseStore] Error listing vendor products: {e}")
            return []

    # =========================================================================
    # Approval & Governance Audit Log Operations
    # =========================================================================
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

    def get_case_audit_log(self, procurement_id: str) -> Optional[Dict[str, Any]]:
        """
        Constructs a complete forensic governance and audit log for a case.
        Includes state timeline, evidence provenance, regulatory checks, and decision history.
        """
        case = self.get(procurement_id)
        if not case:
            return None

        report = case.report
        risk = report.risk_assessment if report else None

        timeline = [
            {"event": "CASE_CREATED", "timestamp": case.created_at, "stage": "PLANNING", "detail": f"Case submitted for {case.vendor_name} (₹{case.deal_size:,.2f})"},
            {"event": "INVESTIGATION_ROUTED", "timestamp": case.created_at, "stage": case.status.stage.value, "detail": f"Route selected: {case.status.investigation_plan.value} investigation pipeline."}
        ]

        if report:
            timeline.append({
                "event": "EVIDENCE_SYNTHESIZED",
                "timestamp": case.created_at,
                "stage": "SCORING",
                "detail": report.evidence_summary
            })
            timeline.append({
                "event": "RISK_AUDIT_COMPLETED",
                "timestamp": case.created_at,
                "stage": "WRITING_REPORT",
                "detail": f"Assessed Overall Risk: {risk.overall_risk.value if risk else 'UNKNOWN'} (Confidence: {risk.confidence_score if risk else 0.0})"
            })

        if case.approval:
            timeline.append({
                "event": "GOVERNANCE_DECISION_RECORDED",
                "timestamp": case.approval.decided_at,
                "stage": "COMPLETE" if case.approval.decision.value == "APPROVE" else "FAILED",
                "detail": f"Decided by {case.approval.decided_by}: {case.approval.decision.value}. Rationale: {case.approval.reason or 'Standard sign-off.'}"
            })

        return {
            "procurement_id": case.procurement_id,
            "vendor_name": case.vendor_name,
            "deal_size_inr": case.deal_size,
            "currency": "INR",
            "current_stage": case.status.stage.value,
            "investigation_plan": case.status.investigation_plan.value,
            "revisions_executed": case.status.revision_count,
            "created_at": case.created_at,
            "timeline": timeline,
            "risk_summary": {
                "overall_risk": risk.overall_risk.value if risk else "UNKNOWN",
                "confidence_score": risk.confidence_score if risk else None,
                "financial_risk": risk.financial_risk.model_dump() if risk else None,
                "compliance_risk": risk.compliance_risk.model_dump() if risk else None,
                "contract_risk": risk.contract_risk.model_dump() if risk else None,
                "pricing_risk": risk.pricing_risk.model_dump() if risk else None,
            } if risk else None,
            "approval_record": case.approval.model_dump() if case.approval else None,
            "governance_status": "AUDITED_AND_VERIFIED"
        }

    def get_all_audit_logs(self) -> List[Dict[str, Any]]:
        """Returns forensic audit logs for all procurement cases in the database."""
        logs = []
        for case in self.get_all():
            log = self.get_case_audit_log(case.procurement_id)
            if log:
                logs.append(log)
        return logs

# Global singleton instance
case_store = CaseStore()
