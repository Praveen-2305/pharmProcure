# Mock Contracts & SLAs Database (`contracts/`)

This directory contains realistic pharmaceutical procurement contracts, service level agreements (SLAs), and master supply agreements used to test the Contract Risk and Contradiction Detection subsystems.

---

## 📜 Contract Manifest

### 1. `Apex_BioLogistics_SLA.md`
- **Vendor:** Apex BioLogistics & Diagnostic Supplies Pvt. Ltd.
- **Product:** Molecular RT-PCR reagent packs & Insulin delivery.
- **Intentional Contradiction Clause:**
  - *Clause 2.2.4:* Permits ambient transport at **15°C to 25°C** for regional delivery under 48 hours.
  - *Conflicts With:* WHO TRS 1025 Annex 7 & Schedule M, which mandate **2°C to 8°C** continuous cold chain.
- **Contract Risk Clause:**
  - *Clause 4.1:* Liability strictly capped at **1.0x invoiced value** (aggressive limitation).

### 2. `NovaVaccines_ColdChain_Agreement.md`
- **Vendor:** Nova Biologics & Vaccines India Ltd.
- **Product:** Pentavalent Pediatric Vaccine Formulations.
- **Characteristics:**
  - Mandatory 100% active IoT digital data loggers on all vehicles.
  - Automatic batch disposal if temperature exceeds 8.5°C for >15 minutes.
  - DPCO ceiling compliant (INR 380.00 / vial).
  - High buyer protection (2.0x liability cap).

### 3. `sample_pharma_msa.txt`
- **Vendor:** Global Pharma Logistics & Formulation Services Ltd.
- **Product:** General Bulk Supply.
- **Characteristics:**
  - 1.5x liability limitation cap.
  - 30-day cure period.
  - Dispute resolution under Indian Arbitration and Conciliation Act.
