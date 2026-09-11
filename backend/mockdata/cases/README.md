# Mock Case Ledger Database (`cases/`)

This directory stores the pre-seeded procurement cases that simulate real-world vendor evaluations for AutonoSource.

---

## 📋 Case Inventory

| Procurement ID | Vendor Name | Deal Size | Overall Risk | Confidence | Stage | Key Scenario |
|---|---|---|---|---|---|---|
| **`PR-2026-8801-BIO`** | BioGen Diagnostics Inc. | $450,000 | `LOW` | 0.89 | `COMPLETE` | Fully compliant baseline; verified CDSCO license & Schedule M. |
| **`PR-2026-9042-GLO`** | Global Pharma Logistics Ltd. | $580,000 | `HIGH` | 0.74 | `AWAITING_APPROVAL` | Quoted price exceeds statutory NPPA ceiling by $80k; cold chain discrepancy. |
| **`PR-2026-7731-APX`** | Apex BioLogistics Pvt. Ltd. | $350,000 | `MEDIUM` | 0.71 | `AWAITING_APPROVAL` | Clause 2.2.4 contradicts WHO TRS 1025 cold chain rules (15°C vs 2°C). |
| **`PR-2026-6102-NOV`** | Nova Biologics & Vaccines | $750,000 | `LOW` | 0.92 | `COMPLETE` | High-value pediatric vaccines; 100% active IoT logging; approved. |
| **`PR-2026-5540-MED`** | MediSynth Specialty Formulations | $220,000 | `MEDIUM` | 0.68 | `AWAITING_APPROVAL` | Proprietary custom API not in DPCO schedule (`INDETERMINATE` pricing). |

---

## 📄 File: `cases.json`

The file [`cases.json`](./cases.json) contains the raw, serialized JSON array matching `ProcurementItemSummary` with exact **camelCase** serialization.

### Example Case JSON Snippet:
```json
{
  "procurementId": "PR-2026-7731-APX",
  "vendorName": "Apex BioLogistics & Diagnostic Supplies Pvt. Ltd.",
  "dealSize": 350000.0,
  "status": {
    "procurementId": "PR-2026-7731-APX",
    "stage": "AWAITING_APPROVAL",
    "investigationPlan": "FULL",
    "revisionCount": 2,
    "maxRevisions": 3,
    "failureReason": null
  },
  "report": {
    "vendorSummary": "Apex BioLogistics supplies RT-PCR molecular reagent packs.",
    "financialAssessment": "Moderate liquidity ratio (Credit score: 680).",
    "complianceFindings": "Schedule M certified facility. Secondary transit clause permits ambient 15°C to 25°C.",
    "riskAssessment": {
      "financialRisk": { "level": "MEDIUM", "rationale": "Credit score 680." },
      "complianceRisk": { "level": "MEDIUM", "rationale": "Clause 2.2.4 contradicts WHO TRS 1025." },
      "contractRisk": { "level": "MEDIUM", "rationale": "Liability capped at 1.0x." },
      "pricingRisk": { "status": "WITHIN_CEILING", "ceilingPrice": 350000.0, "quotedPrice": 350000.0, "excessAmount": 0.0 },
      "overallRisk": "MEDIUM",
      "confidenceScore": 0.71
    }
  },
  "approval": null,
  "createdAt": "2026-09-11T09:15:00Z"
}
```

---

## 🔗 Related Frontend Endpoints

- `GET /procurement/all` ➔ Returns the entire list from `cases.json`.
- `GET /approval/pending` ➔ Filters items where `status.stage == "AWAITING_APPROVAL"` and `approval == null`.
- `GET /procurement/{id}/report` ➔ Returns the `report` object for the matching ID.
