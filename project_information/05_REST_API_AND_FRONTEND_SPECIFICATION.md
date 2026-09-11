# AutonoSource (pharmProcure) — REST API & Frontend Integration Guide

**Document Version:** 2.1.0  
**Stack:** React 18 + Vite + TypeScript + Tailwind CSS | FastAPI + Pydantic v2  
**Implementation Source:** `frontend/src/` & `backend/app/routers/`  

---

## 1. REST API Contract & Specifications

All API endpoints strictly follow camelCase serialization in JSON payloads matching the frontend TypeScript models in [`frontend/src/api/types.ts`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/frontend/src/api/types.ts).

### 1.1 Multi-Agent Procurement Endpoints

#### `POST /procurement/submit`
Initiates an autonomous procurement due diligence audit.
- **Content-Type:** `multipart/form-data` OR `application/json`.
- **Request Fields:**
  | Field | Type | Required | Description |
  | :--- | :--- | :---: | :--- |
  | `vendorName` | string | Yes | Name of vendor entity (min 3 chars). |
  | `dealSize` | float | Yes | Deal value in currency units (> 0). |
  | `procurementDetails` | string | Yes | Specifications of supplies or services. |
  | `investigationPlan` | string | No | `LIGHT` or `FULL` (default `FULL`). |
  | `contractDocument` | file | No | Optional PDF/TXT/MD contract agreement. |

- **Response (200 OK):**
  ```json
  {
    "procurementId": "PR-2026-8801-BIO",
    "status": {
      "procurementId": "PR-2026-8801-BIO",
      "stage": "PLANNING",
      "investigationPlan": "FULL",
      "revisionCount": 0,
      "maxRevisions": 3,
      "failureReason": null
    }
  }
  ```

#### `GET /procurement/{procurement_id}/status`
Lightweight status endpoint polled every 1.5s by the frontend hook [`useProcurementStatus.ts`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/frontend/src/hooks/useProcurementStatus.ts).
- **Response (200 OK):**
  ```json
  {
    "procurementId": "PR-2026-8801-BIO",
    "stage": "EXECUTING",
    "investigationPlan": "FULL",
    "revisionCount": 1,
    "maxRevisions": 3,
    "failureReason": null
  }
  ```

#### `GET /procurement/{procurement_id}/report`
Retrieves the finalized `ProcurementReport` when `stage` reaches `AWAITING_APPROVAL` or `COMPLETE`. Returns 404 while processing.
- **Response (200 OK):**
  ```json
  {
    "vendorSummary": "BioGen Diagnostics is an established supplier of molecular RT-PCR test kits...",
    "financialAssessment": "Audited clean with Altman Z-score 3.42 and healthy quick ratio (1.8x)...",
    "complianceFindings": "Schedule M GMP and ISO-9001 certified. Valid state license Form 28-D verified with CDSCO.",
    "flaggedContractClauses": [
      "Clause 4.1: 1.5x liability limitation cap; Clause 2.2: WHO TRS 1025 cold chain monitoring."
    ],
    "evidenceSummary": "Multi-source evidence synthesized across Vector RAG, Knowledge Graph ontology, and live web due diligence (cdsco.gov.in, e-courts.gov.in).",
    "fusedContext": {
      "overallConfidence": 0.89,
      "fallbackToVectorOnly": false,
      "facts": [
        {
          "factId": "fact_bg_1",
          "text": "Cold chain storage compliant with WHO TRS 1025 standards (2°C to 8°C continuous logging).",
          "source": "vector",
          "retrieverScore": 0.94,
          "sourceWeight": 0.85,
          "finalScore": 0.799,
          "isPrimary": true,
          "contradictionFlag": false,
          "conflictsWith": null
        }
      ]
    },
    "riskAssessment": {
      "financialRisk": { "level": "LOW", "rationale": "Strong balance sheet, credit score 780." },
      "complianceRisk": { "level": "LOW", "rationale": "Schedule M certified, zero FDA 483 citations." },
      "contractRisk": { "level": "LOW", "rationale": "Balanced indemnification and 30-day cure period." },
      "pricingRisk": {
        "status": "WITHIN_CEILING",
        "ceilingPrice": 450000.0,
        "quotedPrice": 420000.0,
        "excessAmount": 0.0
      },
      "overallRisk": "LOW",
      "confidenceScore": 0.89
    },
    "riskExplanation": "All 4 risk dimensions evaluated as LOW with 89% evidence completeness.",
    "recommendation": "APPROVE: Vendor meets all financial, compliance, and regulated pricing benchmarks."
  }
  ```

#### `GET /procurement/all`
Returns all historical and current procurement cases from the SQLite database, ordered by creation date descending. Populates the Executive Dashboard.
- **Response (200 OK):** `Array<ProcurementItemSummary>`

---

### 1.2 Governance & Approval Queue Endpoints

#### `GET /approval/pending`
Returns all cases currently waiting for executive officer sign-off (`stage === 'AWAITING_APPROVAL'` and `approval === null`).
- **Response (200 OK):** `Array<PendingApprovalItem>`

#### `POST /approval/{procurement_id}/decide`
Submits an auditable approval determination.
- **Request Body:**
  ```json
  {
    "decision": "APPROVE",
    "reason": "All statutory pricing and cold-chain standards verified.",
    "decidedBy": "Chief Procurement Officer"
  }
  ```
- **Allowed Decisions:** `APPROVE`, `REJECT`, `REQUEST_MORE_INFO`.
- **Validation Rule:** Rejections and requests for more info mandate a non-empty `reason` (HTTP 422 if omitted).

---

## 2. Frontend Screen Architecture & User Journeys

### 2.1 Executive Dashboard (`DashboardPage.tsx`)
- Renders 4 metrics summary cards: Total Audits, Completed Reviews, Awaiting Sign-off, Terminated/Failed.
- Real-time search bar filtering across vendor names and procurement IDs.
- Stage filter strip: `ALL`, `COMPLETE`, `AWAITING_APPROVAL`, `IN_PROGRESS`, `FAILED`.
- Complete audit trail table linking directly to the casefile view `/review/:procurementId`.

### 2.2 Investigation Intake (`SubmitRequestPage.tsx`)
- Form inputs with validation for vendor name, deal size, procurement specifications, and investigation plan.
- File attachment support for uploading draft agreements and RFPs.
- Submits to `POST /procurement/submit` and automatically routes user to `/review/:procurementId`.

### 2.3 Investigation & Audit Casefile (`VendorReviewPage.tsx`)
- Active visual stage tracker highlighting current agent node in the pipeline.
- Dynamic Critic Loop badge: `Critic Loop: Revision X of 3` with spinning refresh indicator.
- Executive Case Summary and Strategic Recommendation banners.
- 4D Risk Matrix breakdown ([`RiskBreakdown.tsx`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/frontend/src/pages/VendorReview/RiskBreakdown.tsx)).
- Hybrid Evidence Trail ([`EvidenceTrail.tsx`](file:///media/kamalesh/KAMALESH/PROJECTS/procurement-agent/frontend/src/pages/VendorReview/EvidenceTrail.tsx)) displaying facts, retriever scores, source weights, and contradiction flags.

### 2.4 Approval Queue (`ApprovalQueuePage.tsx`)
- Dedicated governance interface for compliance officers.
- Action dialogs to record `APPROVE`, `REJECT`, or `REQUEST_MORE_INFO` determinations.

---

## 3. CLI Runner Scripts

- **Run End-to-End Pipeline:**
  ```bash
  python backend/scripts/run_agent_pipeline.py --vendor "Apex BioLogistics" --deal 350000 --category "Diagnostic Test Kits"
  ```
- **Run External Web Due Diligence Scraper:**
  ```bash
  python backend/scripts/scrape_vendor_intel.py --vendor "Global Pharma Logistics"
  ```
- **Run Complete Build Pipeline:**
  ```bash
  python backend/build/build_all.py
  # or
  bash backend/scripts/run_all_setup.sh
  ```
