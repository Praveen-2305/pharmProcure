"""
Regulatory & Cold-Chain Live Alerts Center API for AutonoSource (pharmProcure).
Maintains live operational & regulatory signals (CDSCO notices, NPPA ceiling revisions,
temperature excursion telemetry, tender debarments) with simulation capabilities.
"""

import os
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from src.models.schemas import CamelBaseModel

router = APIRouter(tags=["Alerts Center"])

backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SQLITE_DB_PATH = os.path.join(backend_root, "processed_data", "sqlite", "procurement_cases.db")


class RegulatoryAlert(CamelBaseModel):
    alert_id: str
    alert_type: str  # "CDSCO_NSQ_ALERT" | "PRICE_CEILING_REVISED" | "COLD_CHAIN_EXCURSION" | "DEBARMENT_NOTICE"
    vendor_id: Optional[str] = None
    vendor_name: str
    severity: str    # "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
    headline: str
    description: str
    statute_reference: str
    suggested_remedy: str
    is_acknowledged: bool
    created_at: str


class AlertsListResponse(CamelBaseModel):
    total: int
    unacknowledged_count: int
    alerts: List[RegulatoryAlert]


class SimulateEventRequest(CamelBaseModel):
    alert_type: str
    vendor_name: str
    severity: str
    headline: str
    description: str
    statute_reference: str
    suggested_remedy: str
    vendor_id: Optional[str] = None


def _init_alerts_db():
    try:
        with sqlite3.connect(SQLITE_DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS regulatory_alerts (
                    alert_id TEXT PRIMARY KEY,
                    alert_type TEXT NOT NULL,
                    vendor_id TEXT,
                    vendor_name TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    headline TEXT NOT NULL,
                    description TEXT NOT NULL,
                    statute_reference TEXT NOT NULL,
                    suggested_remedy TEXT NOT NULL,
                    is_acknowledged INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL
                )
            """)
            
            # Check if seeded
            cursor.execute("SELECT COUNT(*) FROM regulatory_alerts")
            count = cursor.fetchone()[0]
            if count == 0:
                now = datetime.now(timezone.utc).isoformat()
                initial_alerts = [
                    (
                        "ALT-2026-001",
                        "COLD_CHAIN_EXCURSION",
                        "VND-001",
                        "Apex BioLogistics Pvt. Ltd.",
                        "CRITICAL",
                        "IoT Logger Alert: 14.2°C Temperature Spike in Transit",
                        "Real-time sensor telemetry from Consignment #TR-8820 registered an ambient excursion of 14.2°C for 52 consecutive minutes exceeding WHO TRS 1025 tolerance limits.",
                        "WHO Technical Report Series No. 1025 Annex 7 & Schedule M 2024",
                        "Hold consignment at receiving dock; quarantine batch pending stability testing before PO invoice authorization.",
                        0,
                        now,
                    ),
                    (
                        "ALT-2026-002",
                        "CDSCO_NSQ_ALERT",
                        "VND-023",
                        "DeshPharma Bulk Trading Co.",
                        "HIGH",
                        "CDSCO Monthly Drug Alert: Sub-Potency Impurity Notice",
                        "State Drug Testing Laboratory marked Batch DP-904 as 'Not of Standard Quality' (NSQ) due to assay failure in dissolution rate tests.",
                        "Drugs and Cosmetics Act, 1940 Section 18(a)(i)",
                        "Halt all pending disbursements and require certificate of re-analysis from CDSCO accredited laboratory.",
                        0,
                        now,
                    ),
                    (
                        "ALT-2026-003",
                        "PRICE_CEILING_REVISED",
                        "VND-002",
                        "Bharat Biotherapeutics Labs",
                        "MEDIUM",
                        "NPPA Statutory Notification: Trastuzumab Ceiling Lowered by 4.5%",
                        "NPPA published Gazette S.O. 1142(E) revising statutory ceiling for Trastuzumab 440mg downwards to ₹23,780.00 effective immediately.",
                        "DPCO 2013 Paragraph 4 & Paragraph 11",
                        "Issue contract price adjustment addendum to align active purchase orders with newly notified ceiling rate.",
                        0,
                        now,
                    ),
                    (
                        "ALT-2026-004",
                        "DEBARMENT_NOTICE",
                        "VND-044",
                        "Rhein-Main Sterile Injectables GmbH",
                        "HIGH",
                        "State Procurement Debarment Advisory Issued",
                        "Maharashtra State Medical Supplies Corporation issued a 12-month tender participation suspension citing repeated delivery defaults.",
                        "Public Procurement (Preference to Make in India) Order 2017 & GFR Rule 151",
                        "Flag vendor in multi-vendor comparisons; require bank guarantee prior to contract award.",
                        1,
                        now,
                    ),
                ]
                cursor.executemany("""
                    INSERT INTO regulatory_alerts (
                        alert_id, alert_type, vendor_id, vendor_name, severity,
                        headline, description, statute_reference, suggested_remedy,
                        is_acknowledged, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, initial_alerts)
                conn.commit()
    except Exception as e:
        print(f"[Alerts] SQLite init notice: {e}")


_init_alerts_db()


@router.get("/alerts", response_model=AlertsListResponse)
def list_alerts(
    unacknowledged_only: bool = Query(False, description="Filter only pending unacknowledged alerts"),
    severity: Optional[str] = Query(None, description="Filter by severity: CRITICAL, HIGH, MEDIUM, LOW"),
):
    """
    Returns list of regulatory alerts, cold-chain telemetry events, and CDSCO compliance notices.
    """
    try:
        with sqlite3.connect(SQLITE_DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            query = "SELECT * FROM regulatory_alerts"
            conditions = []
            params = []
            
            if unacknowledged_only:
                conditions.append("is_acknowledged = 0")
            if severity:
                conditions.append("severity = ? COLLATE NOCASE")
                params.append(severity)
                
            if conditions:
                query += " WHERE " + " AND ".join(conditions)
                
            query += " ORDER BY created_at DESC"
            cursor.execute(query, params)
            rows = cursor.fetchall()

            # Count unacknowledged
            cursor.execute("SELECT COUNT(*) FROM regulatory_alerts WHERE is_acknowledged = 0")
            unack_count = cursor.fetchone()[0]

            alerts = [
                RegulatoryAlert(
                    alert_id=r["alert_id"],
                    alert_type=r["alert_type"],
                    vendor_id=r["vendor_id"],
                    vendor_name=r["vendor_name"],
                    severity=r["severity"],
                    headline=r["headline"],
                    description=r["description"],
                    statute_reference=r["statute_reference"],
                    suggested_remedy=r["suggested_remedy"],
                    is_acknowledged=bool(r["is_acknowledged"]),
                    created_at=r["created_at"],
                )
                for r in rows
            ]

            return AlertsListResponse(
                total=len(alerts),
                unacknowledged_count=unack_count,
                alerts=alerts,
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error reading alerts: {e}")


@router.post("/alerts/{alert_id}/ack", response_model=RegulatoryAlert)
def acknowledge_alert(alert_id: str):
    """
    Marks an alert as acknowledged by the procurement or compliance officer.
    """
    try:
        with sqlite3.connect(SQLITE_DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE regulatory_alerts SET is_acknowledged = 1 WHERE alert_id = ?",
                (alert_id,)
            )
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Alert not found")
            conn.commit()

            cursor.execute("SELECT * FROM regulatory_alerts WHERE alert_id = ?", (alert_id,))
            r = cursor.fetchone()
            return RegulatoryAlert(
                alert_id=r["alert_id"],
                alert_type=r["alert_type"],
                vendor_id=r["vendor_id"],
                vendor_name=r["vendor_name"],
                severity=r["severity"],
                headline=r["headline"],
                description=r["description"],
                statute_reference=r["statute_reference"],
                suggested_remedy=r["suggested_remedy"],
                is_acknowledged=bool(r["is_acknowledged"]),
                created_at=r["created_at"],
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error updating alert: {e}")


@router.post("/admin/simulate-event", response_model=RegulatoryAlert)
def simulate_regulatory_event(req: SimulateEventRequest):
    """
    Simulates a live incoming regulatory event for HackForge interactive judge demonstration.
    Inserts directly into the live alert pipeline.
    """
    new_id = f"ALT-{datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    
    try:
        with sqlite3.connect(SQLITE_DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO regulatory_alerts (
                    alert_id, alert_type, vendor_id, vendor_name, severity,
                    headline, description, statute_reference, suggested_remedy,
                    is_acknowledged, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                new_id,
                req.alert_type,
                req.vendor_id or "VND-GENERIC",
                req.vendor_name,
                req.severity.upper(),
                req.headline,
                req.description,
                req.statute_reference,
                req.suggested_remedy,
                0,
                now,
            ))
            conn.commit()

        return RegulatoryAlert(
            alert_id=new_id,
            alert_type=req.alert_type,
            vendor_id=req.vendor_id or "VND-GENERIC",
            vendor_name=req.vendor_name,
            severity=req.severity.upper(),
            headline=req.headline,
            description=req.description,
            statute_reference=req.statute_reference,
            suggested_remedy=req.suggested_remedy,
            is_acknowledged=False,
            created_at=now,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error simulating event: {e}")
