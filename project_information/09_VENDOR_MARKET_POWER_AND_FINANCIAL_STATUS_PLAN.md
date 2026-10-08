# Feature Implementation Plan: 5-Pillar Vendor Transparency & Due Diligence Matrix

**Document Version:** 2.0.0  
**Feature Name:** 5-Pillar Vendor Transparency, Financial Health & Market Power Intelligence in Multi-Agent Loop  
**Target Subsystems:** Backend Agents (`web_scraper`, `scraper_agent`, `scorer`, `critic`, `writer`, `schemas`), Database (`session.py`), and Frontend Review Cockpit (`types.ts`, `RiskBreakdown.tsx`).

---

## 1. Feature Overview & Objectives

In pharmaceutical procurement, evaluating a vendor requires rigorous 360° transparency across both commercial viability and statutory integrity. We are implementing a comprehensive **5-Pillar Vendor Transparency Matrix** into the LangGraph autonomous multi-agent pipeline:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 5-PILLAR VENDOR TRANSPARENCY MATRIX                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. 💰 Financial Condition & Solvency (Revenue, Liquidity, Credit Rating)   │
│ 2. 🏛️ Market Power & Industry Standing (Market Share, Bargaining Leverage) │
│ 3. 🚚 Operational Reliability & Delivery Resiliency (Capacity, OTIF, Lead) │
│ 4. 🔬 Regulatory Compliance & Quality Integrity (CDSCO, NSQ, GMP Audits)    │
│ 5. ⚖️ Corporate Governance, Legal & ESG Integrity (Litigation, Blacklisting)│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The 5 Transparency Pillars in Detail

### Pillar 1: Financial Condition & Solvency 💰
* **Annual Revenue Scale:** In ₹ INR / Crores (e.g., ₹697.2 Cr).
* **Solvency & Liquidity Ratio:** Ability to withstand payment cycles or large batch rejections.
* **Credit Rating & Credit Score:** CRISIL / ICRA / CARE credit ratings (AAA down to B) and 300–850 score.
* **Working Capital Health:** Narrative on liquidity stability and debt exposure.

### Pillar 2: Market Power & Bargaining Standing 🏛️
* **Market Standing Tier:** *Tier-1 Market Leader*, *Established Category Competitor*, *Mid-Market Specialist*, *Niche Biosimilar Producer*.
* **Market Power Level:** `DOMINANT` | `STRONG` | `MODERATE` | `COMPETITIVE`.
* **Bargaining Leverage:** `Supplier-Dominated` (high pricing power, single-source dependency risk) vs `Balanced` vs `Buyer-Advantaged`.
* **Substitutability & Dependency Risk:** Availability of alternative qualified generic suppliers.

### Pillar 3: Operational Reliability & Supply Chain Resiliency 🚚 *(NEW)*
* **Historical On-Time Delivery Rate (OTIF):** Benchmark percentage (e.g. 98.2% on-time fulfillment).
* **Manufacturing Capacity & Facilities:** Certified production plant count and monthly capacity.
* **Cold-Chain Transit Integrity Record:** Historical adherence to WHO TRS 1025 (2°C–8°C) temperature parameters.
* **Supply Buffer & Continuity Readiness:** Secondary plant capability and raw material (API) stock reserves.

### Pillar 4: Regulatory Compliance & Quality Integrity Track Record 🔬 *(NEW)*
* **Licensing Transparency:** CDSCO Manufacturing Drug License validation & State Licensing Authority status.
* **Quality Certifications:** Schedule M GMP, WHO-GMP, US-FDA approval verification.
* **NSQ (Not of Standard Quality) Zero-Tolerance Audit:** Automated scan of CDSCO monthly drug alert bulletins for recalled or sub-standard batches.
* **Inspection Deficiencies (Form 483 / Warning Notices):** Zero-observation track record vs pending show-cause notices.

### Pillar 5: Corporate Governance, Legal & ESG Integrity ⚖️ *(NEW)*
* **Blacklisting & Debarment Clearance:** Central/State Govt tenders, GeM portal, and Jan Aushadhi debarment registry checks.
* **Commercial Litigation & Insolvency:** e-Courts search, NCLT insolvency proceedings, and arbitration history.
* **Director & Ownership Transparency:** Clean corporate registry standing (MCA21 filings).
* **Environmental & ETP Compliance:** State Pollution Control Board clearance for chemical/API effluent treatment.

---

## 3. Multi-Agent Pipeline Integration Flow

```
[PLANNER AGENT]
      │
      ▼
[SCRAPER & CONTEXT AGENT]  ◄── (PARALLEL) ──►  [RAG AGENT (Vector + Graph)]
   • Query SQLite `vendors` table for 5-pillar baseline data
   • Live Web Crawl:
       - Query 1: "{vendor} revenue market share financial health India" (Pillars 1 & 2)
       - Query 2: "{vendor} manufacturing capacity delivery delay plants" (Pillar 3)
       - Query 3: "{vendor} CDSCO notice NSQ recall license violation" (Pillar 4)
       - Query 4: "{vendor} court lawsuit NCLT blacklisted debarred" (Pillar 5)
   • Synthesize unified `vendor_transparency_matrix`
      │
      ▼
[RISK SCORER AGENT]
   • 4D Risk Scoring calibrated with 5-pillar findings:
       - Financial Risk: Solvency, Credit Rating, Liquidity
       - Compliance Risk: CDSCO licenses, NSQ alerts, Schedule M
       - Contract Risk: Supplier leverage, liability caps, delivery SLA
       - Pricing Risk: NPPA DPCO 2013 ceiling benchmark
   • Assign 5-Pillar Scores (1–100) and Transparency Badges
      │
      ▼
[CRITIC AGENT (Loop)]
   • Cross-examine multi-source evidence completeness across all 5 pillars
      │
      ▼
[REPORT WRITER AGENT]
   • Synthesize comprehensive 5-Pillar Transparency Report
   • Persist enriched profile into SQLite `vendor_profiles` cache
      │
      ▼
[FRONTEND COCKPIT (VendorReview & Queue)]
   • Render 5-Pillar Transparency Cards & Interactive Score Badges
```

---

## 4. Data Schema Specifications

### 4.1 Backend Pydantic Schemas (`backend/src/models/schemas.py`)

```python
class MarketPowerLevel(str, Enum):
    DOMINANT = "DOMINANT"          # Monopolistic or dominant market share (>40%)
    STRONG = "STRONG"              # Top-3 tier producer, high pricing power
    MODERATE = "MODERATE"          # Established competitive producer, balanced power
    COMPETITIVE = "COMPETITIVE"    # Multiple market substitutes, low supplier leverage

class OperationalResilience(CamelBaseModel):
    on_time_delivery_rate: float   # e.g. 0.98
    manufacturing_capacity_score: float # 0.0 - 1.0
    cold_chain_reliability: str    # "High" | "Moderate" | "Unverified"
    fulfillment_risk_summary: str

class RegulatoryQualityRecord(CamelBaseModel):
    cdsco_license_valid: bool
    schedule_m_status: str
    nsq_batch_alerts_count: int    # 0 = clean
    regulatory_track_record: str

class GovernanceIntegrity(CamelBaseModel):
    blacklisting_status: str       # "Clean - Not Debarred" | "Flagged"
    litigation_count: int
    nclt_insolvency_flag: bool
    governance_summary: str

class VendorTransparencyMatrix(CamelBaseModel):
    # Pillar 1 & 2
    annual_revenue_cr: float
    solvency_ratio: float
    credit_rating: str
    financial_health_summary: str
    market_standing: str
    market_power_level: MarketPowerLevel
    bargaining_leverage: str
    
    # Pillar 3, 4, 5
    operational_resilience: OperationalResilience
    regulatory_quality: RegulatoryQualityRecord
    governance_integrity: GovernanceIntegrity
    overall_transparency_score: int  # 0-100
```

### 4.2 Update `ProcurementReport` Schema

Add optional `vendor_transparency: Optional[VendorTransparencyMatrix] = None` to `ProcurementReport`.

---

## 5. Execution Steps

- [x] **Step 1: Define 5-Pillar Data Models** in [`backend/src/models/schemas.py`](file:///d:/AI_NAVIGATE_LAB/PROJECTS/Month-5/pharmProcure/backend/src/models/schemas.py) and [`frontend/src/api/types.ts`](file:///d:/AI_NAVIGATE_LAB/PROJECTS/Month-5/pharmProcure/frontend/src/api/types.ts).
- [x] **Step 2: Update Web Scraper Engine (`web_scraper.py`)** to crawl financial health, market standing, NSQ alerts, debarment registries, and operational capacity.
- [x] **Step 3: Enrich Scraper Context Agent (`scraper_agent.py`)** to merge SQLite vendor records with live scraped intelligence into `vendor_transparency_matrix`.
- [x] **Step 4: Update Risk Scorer (`scorer.py`)** to evaluate all 5 pillars into financial, compliance, contract, and pricing dimensions.
- [x] **Step 5: Enhance Report Writer (`writer.py`)** to synthesize the 5-pillar findings into `ProcurementReport` and update SQLite cache.
- [x] **Step 6: Update Frontend UI Components** in [`frontend/src/pages/VendorReview/RiskBreakdown.tsx`](file:///d:/AI_NAVIGATE_LAB/PROJECTS/Month-5/pharmProcure/frontend/src/pages/VendorReview/RiskBreakdown.tsx) to render the 5-Pillar Transparency Grid.
- [x] **Step 7: Automated End-to-End Verification** of live pipeline runs and UI verification.
