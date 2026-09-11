# Mock Statutory Pricing Database (`pricing/`)

This directory stores the official pharmaceutical price ceiling benchmarks from the **National Pharmaceutical Pricing Authority (NPPA)** under the **Drugs (Prices Control) Order (DPCO)**.

---

## 🏛️ Regulation & Authority

- **Authority:** National Pharmaceutical Pricing Authority (NPPA), Ministry of Chemicals and Fertilizers, Government of India.
- **Enabling Law:** Section 3 of Essential Commodities Act, 1955 & DPCO 2013 as amended.
- **Currency:** Indian Rupee (INR).

---

## 📊 Catalog Overview (`pricing_ceiling_catalog.json`)

The dataset contains 16 regulated pharmaceutical formulations across critical therapeutic classes:

| Therapeutic Category | Example Formulation | Dosage | Unit | Statutory Ceiling Price | Deal Threshold |
|---|---|---|---|---|---|
| **Analgesics / Antipyretics** | Paracetamol Tablets | 500 mg | tablet | ₹1.05 | ₹250,000 |
| **Antibiotics** | Amoxicillin Capsules | 500 mg | capsule | ₹7.30 | ₹350,000 |
| **Antidiabetics** | Metformin Hydrochloride | 500 mg | tablet | ₹1.95 | ₹200,000 |
| **Cardiovascular** | Atorvastatin Tablets | 10 mg | tablet | ₹7.42 | ₹400,000 |
| **Biologics / Cold-Chain** | Insulin Glargine | 100 IU/ml (3 ml pen) | vial/cartridge | ₹540.00 | ₹600,000 |
| **Vaccines** | Pentavalent Vaccine | 0.5 ml vial | vial | ₹380.00 | ₹750,000 |
| **Blood Products** | Human Albumin Infusion | 20% (100 ml) | bottle | ₹3,850.00 | ₹800,000 |
| **Anticoagulants** | Enoxaparin Injection | 40 mg / 0.4 ml | syringe | ₹410.00 | ₹500,000 |

---

## 🧮 Mathematical Evaluation Formula

The `RiskScorer` evaluates Pricing Risk deterministically without LLM hallucination:

1. **Category Match:** Lookup category in catalog.
2. **Ceiling Comparison:**
   $$\text{excess\_amount} = \max(0.0, \text{quoted\_price} - \text{ceiling\_price})$$
3. **Classification:**
   - If `category` not in catalog: `status = "INDETERMINATE"` (Confidence penalty: $-0.15$).
   - If `quoted_price <= ceiling_price`: `status = "WITHIN_CEILING"` (Risk: `LOW`).
   - If `quoted_price > ceiling_price`: `status = "EXCEEDS_CEILING"` (Risk: `HIGH`, flags `excess_amount`).
