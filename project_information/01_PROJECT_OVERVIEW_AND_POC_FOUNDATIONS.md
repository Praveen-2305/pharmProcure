# AutonoSource (pharmProcure) — Project Overview & Foundational POC Document

**Project Title:** AutonoSource — Multi-Agent Procurement Risk & Vendor Intelligence Platform  
**Target Domain:** Pharmaceutical Supply Chain Due Diligence, Regulatory Governance & Pricing Compliance  
**Author / Original Architect:** Krishnaprasath SK (B.Tech Computer Science and Business Systems)  
**Document Status:** Complete & Authoritative Reference (v3.0.0)  
**Audience:** System Architects, Compliance Officers, Software Engineers, Autonomous Agents  

---

## 1. Executive Summary & Purpose

Procurement in heavily regulated industries like pharmaceuticals is an investigative, high-stakes discipline. Selecting an unverified vendor, agreeing to a non-compliant contract clause, or procuring drugs above statutory price caps can lead to severe consequences:
- **Patient Safety Hazards:** Adulterated active pharmaceutical ingredients (APIs), degraded vaccines due to cold-chain breaches, or substandard reagents.
- **Regulatory Penalties & Criminal Liability:** Operating with expired or unauthorized manufacturing licenses violates the **Drugs and Cosmetics Act, 1940** and **Drugs and Cosmetics Rules, 1945**.
- **Price Gouging Sanctions:** Procuring scheduled formulations above published ceiling prices triggers statutory recovery and penalties under the **Drugs (Prices Control) Order (DPCO), 2013** enforced by the **National Pharmaceutical Pricing Authority (NPPA)** in Indian Rupees (INR / ₹).
- **Commercial Default:** Inadequate vendor liquidity leading to mid-contract supply failure.

The purpose of **AutonoSource** is to demonstrate that procurement evaluation can be transformed from a slow, manual checklist into a stateful, explainable, autonomous multi-agent pipeline powered by **LangGraph**, **FastAPI**, **Qdrant Vector Database**, **NetworkX Property Graph (5,757 nodes)**, **SQLite (6-table schema with 50 registered vendors)**, and **Google Gemini LLM**.

Rather than relying on a naive, single-prompt Large Language Model (LLM), AutonoSource coordinates specialized AI agents operating over a typed workflow state, featuring parallel hybrid retrieval, deterministic pricing checks in INR, autonomous self-critique, and mandatory Human-in-the-Loop governance.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               AUTONOSOURCE PLATFORM                                     │
│                                                                                        │
│                                 ┌───────────────┐                                      │
│                                 │ Planner Agent │                                      │
│                                 └───────┬───────┘                                      │
│                                         │                                              │
│                        ┌────────────────┴────────────────┐                             │
│                        ▼                                 ▼                             │
│               ┌─────────────────┐               ┌─────────────────┐                    │
│               │    RAG Agent    │               │  Scraper Agent  │                    │
│               │ - 768-dim Qdrant│               │ - 50-Vendor DB  │                    │
│               │ - 5,757-Node KG │               │ - DPCO 2013 INR │                    │
│               │ - 4-Step Fusion │               │ - Web Intel     │                    │
│               └────────┬────────┘               └────────┬────────┘                    │
│                        │                                 │                             │
│                        └────────────────┬────────────────┘                             │
│                                         ▼                                              │
│                                 ┌───────────────┐       Confidence < 0.80              │
│                                 │ Scorer Agent  │ ◄───────────────────────────┐        │
│                                 └───────┬───────┘                             │        │
│                                         ▼                                     │        │
│                                 ┌───────────────┐                             │        │
│                                 │  Critic Loop  │ ────────────────────────────┘        │
│                                 └───────┬───────┘   (Max 3 revision loops)             │
│                                         │                                              │
│                                         ▼ Confidence >= 0.80                           │
│                                 ┌───────────────┐                                      │
│                                 │ Report Writer │                                      │
│                                 └───────┬───────┘                                      │
│                                         ▼                                              │
│                                 ┌───────────────┐                                      │
│                                 │Human Approval │                                      │
│                                 └───────────────┘                                      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Problem Statement: Why Traditional AI & Linear RAG Fail

### 2.1 The Limits of Single-Prompt AI
Vendor risk analysis is fundamentally an iterative investigation, not a simple question-answering task:
- A procurement analyst rarely performs a fixed sequence of actions; each investigative decision depends on previous findings.
- When an analyst discovers a pending transit dispute, they must immediately pivot to inspect the vendor's cold-chain data loggers and contract liability caps.
- Single-prompt LLMs cannot execute this dynamic, branching reasoning path. They lack state persistence, cannot verify facts against external databases, and frequently hallucinate regulatory compliance.

### 2.2 The Limitations of Standard Vector-Only RAG
Standard Retrieval-Augmented Generation (RAG) retrieves text passages based on semantic similarity and generates a linear response. In pharmaceutical procurement, this fails because:
1. **No Relational Ontology:** Vector similarity cannot model statutory hierarchy—for example, that a statutory provision in Schedule M supersedes a private SLA clause.
2. **No Contradiction Detection:** If a vendor's RFP claims *"100% clean regulatory track record"* while a government inspection database reveals an active warning letter, standard RAG averages the embeddings or outputs contradictory text without resolving which source is legally authoritative.
3. **No Pricing Governance:** Standard RAG cannot perform deterministic arithmetic or statutory ceiling lookups against published regulatory tariffs under DPCO 2013.
4. **No Bounded Self-Critique:** Standard RAG cannot inspect its own confidence or autonomously loop back to retrieve additional evidence.

---

## 3. Statutory Regulatory Frameworks Addressed

AutonoSource is explicitly modeled around statutory pharmaceutical standards in India and international supply chains:

### 3.1 Drugs and Cosmetics Act, 1940 & Rules 1945
- **Legal Mandate:** Primary statute governing the import, manufacture, distribution, and sale of drugs, cosmetics, and medical devices in India.
- **Enforcement Body:** Central Drugs Standard Control Organization (CDSCO) and State Licensing Authorities (SLAs).
- **Core Check:** Requires all biologic and pharmaceutical manufacturers to hold active Form 28/28-D manufacturing authorizations.

### 3.2 Schedule M (Good Manufacturing Practices - GMP)
- **Legal Mandate:** CDSCO statutory requirements for pharmaceutical plant premises, quality management systems, environmental controls, sterile areas, water systems, sanitation, and batch documentation.
- **Audit Requirement:** Vendors must maintain active GMP certification. Any FDA 483 citation or state notice elevates compliance risk.

### 3.3 WHO TRS 1025 Annex 7 (Good Storage & Distribution Practices)
- **Technical Mandate:** Mandates strict continuous temperature logging (**2°C to 8°C**) for temperature-sensitive reagents, biologicals, and vaccines during transit and storage.
- **Contract Risk:** Any contract clause permitting ambient transit (e.g. 15°C to 25°C) directly contradicts WHO TRS 1025 and must be flagged as a critical contradiction.

### 3.4 Drugs (Prices Control) Order (DPCO), 2013 & NPPA
- **Statutory Authority:** Issued under Section 3 of the Essential Commodities Act, 1955 by the National Pharmaceutical Pricing Authority (NPPA).
- **Compliance Rule:** Enforces mandatory price ceilings in Indian Rupees (INR / ₹) on scheduled bulk drugs and formulations. Any procurement deal where the unit price exceeds the ceiling price constitutes an illegal statutory violation.

---

## 4. The 5 Canonical Test Case Scenarios (Denominated in INR)

AutonoSource is pre-seeded with 5 realistic, diverse vendor scenarios matching [`backend/ingestion/sql/cases.json`](../backend/ingestion/sql/cases.json) and SQLite database records:

| Case ID | Vendor ID & Name | Deal Size (INR) | Risk Profile | Key Findings & Scenario Nuance |
| :--- | :--- | :---: | :---: | :--- |
| **`PR-2026-8801-BIO`** | `VND-025` BioGen Diagnostics Inc. | ₹3,73,50,000 | **LOW** | **Clean Baseline:** Prime credit (AA), Schedule M certified, valid CDSCO Form MD-9 license, WHO cold chain adherence, price within DPCO ceiling (₹3.54 Cr < ₹3.73 Cr). Approved. |
| **`PR-2026-9042-GLO`** | `VND-012` Global Pharma Logistics Ltd. | ₹4,81,40,000 | **HIGH** | **Statutory Price Breach:** Quoted deal (₹4.81 Cr) exceeds DPCO ceiling (₹4.15 Cr) by ₹66.4 Lakhs. Manual logging clause conflicts with WHO TRS 1025 continuous logger rules. Awaiting Executive Escalation. |
| **`PR-2026-7731-APX`** | `VND-003` Apex BioLogistics Pvt. Ltd. | ₹2,90,50,000 | **MEDIUM** | **Cold-Chain Contradiction:** SLA Clause 2.2.4 permits ambient 15°C-25°C transit, contradicting WHO TRS 1025 (2°C-8°C). Critic triggers revision loops. Conditional Approval with clause amendment. |
| **`PR-2026-6102-NOV`** | `VND-041` Nova Biologics & Vaccines Ltd. | ₹6,22,50,000 | **LOW** | **Vaccine Prequalification:** WHO prequalified facility, 100% active IoT GPS tracking, balanced 2.0x indemnity liability cap. Quoted at statutory ceiling. Approved. |
| **`PR-2026-5540-MED`** | `VND-019` MediSynth Specialty Formulations | ₹1,82,60,000 | **MEDIUM** | **Indeterminate Pricing:** Custom intermediate not indexed in Schedule I DPCO. Confidence penalized due to missing market ceiling benchmark. |

---

## 5. Architectural Evaluation Metrics & Success Criteria

1. **Stateful Parallel Graph Execution:** 100% deterministic routing across LangGraph nodes (`PLANNING` -> `PARALLEL_RETRIEVAL` -> `SCORING` -> `CRITIQUING` -> `WRITING_REPORT` -> `AWAITING_APPROVAL`).
2. **Deterministic Pricing Auditing in INR:** 100% of quotes with DPCO catalog entries checked deterministically in Indian Rupees, tagging transactions as `WITHIN_CEILING`, `EXCEEDS_CEILING`, or `INDETERMINATE`.
3. **Contradiction Resolution:** Automatically resolves conflicting statements by prioritizing statutory legislation (weight = 1.20) and verified graph ontology (weight = 1.00) over vendor self-declarations (weight = 0.60).
