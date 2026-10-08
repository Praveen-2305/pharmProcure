# AutonoSource (pharmProcure) — REST API & Frontend Integration Guide

**Document Version:** 3.0.0  
**Stack:** React 18 + Vite + TypeScript + Tailwind CSS | FastAPI + Pydantic v2  
**Implementation Source:** `frontend/src/` & `backend/src/routers/`  

---

## 1. REST API Contract & Specifications

All API endpoints follow strict camelCase JSON serialization matching the frontend TypeScript interfaces in [`frontend/src/api/types.ts`](../frontend/src/api/types.ts). Financial quantities are denominated in Indian Rupees (INR / ₹).

### 1.1 Procurement & Workflow Endpoints (`/procurement`)

#### `POST /procurement/submit`
Initiates an autonomous procurement due diligence audit.
- **Request Body (JSON / Form):**
  ```json
  {
    "vendorName": "Apex BioLogistics Pvt. Ltd.",
    "dealSize": 29050000.0,
    "procurementDetails": "Cold-chain distribution agreement for RT-PCR test reagents.",
    "investigationPlan": "FULL"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "procurementId": "PR-2026-7731-APX",
    "status": {
      "procurementId": "PR-2026-7731-APX",
      "stage": "PLANNING",
      "investigationPlan": "FULL",
      "revisionCount": 0,
      "maxRevisions": 3,
      "failureReason": null
    }
  }
  ```

#### `GET /procurement/{procurement_id}/status`
Polled by frontend to track active agent stages (`PLANNING` ➔ `GATHERING_EVIDENCE` ➔ `SCORING_RISK` ➔ `CRITIQUING` ➔ `AWAITING_APPROVAL` / `COMPLETE`).

#### `GET /procurement/{procurement_id}/report`
Retrieves the finalized `ProcurementReport` with 4D risk scores, contradiction flags, and INR financials.

#### `GET /procurement/cases`
Lists all procurement cases stored in the SQLite database.

#### `GET /procurement/logs`
Retrieves system-wide governance audit logs across all procurement operations.
- **Response (200 OK):**
  ```json
  [
    {
      "logId": "log-001",
      "caseId": "PR-2026-7731-APX",
      "timestamp": "2026-09-13T14:22:19Z",
      "eventType": "PLANNING_COMPLETED",
      "actor": "planner_agent",
      "severity": "INFO",
      "payload": { "plan": "FULL", "dealSize": 29050000.0 }
    }
  ]
  ```

#### `GET /procurement/{procurement_id}/audit`
Retrieves forensic chronological audit trail for a specific case.

#### `GET /procurement/vendors`
Queries the 50 registered Indian pharmaceutical vendors directory.
- **Query Params:** `limit` (default: 50), `search` (optional substring query).

#### `GET /procurement/vendors/{vendor_identifier}`
Retrieves detailed records for a specific vendor, including active products and cached due diligence profiles.

#### `GET /procurement/pricing-catalog`
Lists statutory DPCO 2013 price ceiling references and unit formulations in INR.

---

### 1.2 Executive Governance Endpoints (`/approval`)

#### `GET /approval/pending`
Lists all procurement cases awaiting executive sign-off (`stage == "AWAITING_APPROVAL"`).

#### `POST /approval/{procurement_id}/decide`
Submits an executive decision with audit rationale:
```json
{
  "decision": "APPROVED",
  "reviewerNotes": "Approved following vendor confirmation of 2°C to 8°C cold chain SLA amendment."
}
```

---

## 2. Frontend UI Architecture (`frontend/src/`)

### 2.1 Core Screens
1. **Landing Page (`/`):** Executive overview and feature highlights.
2. **Dashboard (`/dashboard`):** Central command ledger displaying all cases, risk badges, and confidence metrics.
3. **Submit Request (`/submit`):** Intake form with vendor directory autocomplete and INR pricing inputs.
4. **Vendor Review (`/review/:id`):** Deep-dive dossier displaying:
   - 4-Dimension Risk Cards (Financial, Compliance, Contractual, Pricing in INR).
   - Contradiction Alert timeline.
   - Executive report summary and recommendations.
   - Forensic audit log trail.
5. **Approval Queue (`/approval`):** Executive decision gate for high-stakes evaluations.
