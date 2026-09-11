# Mock Regulatory Knowledge Graph (`graph/`)

This directory documents the **NetworkX MultiDiGraph Property Graph** that powers AutonoSource's Graph RAG subsystem.

---

## 🌐 Topology & Entities

The knowledge graph models non-Euclidean relationships between pharmaceutical suppliers, licensing authorities, drug schedules, and storage standards:

### 1. Node Types (Entities)
- **`Vendor`**: Supplier organizations (`biogen_diagnostics`, `global_pharma`, `apex_biologistics`, `nova_biologics`).
- **`RegulatoryStandard`**: Statutory manufacturing standards (`schedule_m_gmp`).
- **`StorageStandard`**: Temperature-sensitive handling guidelines (`who_trs1025_annex7`).
- **`PrimaryLegislation`**: Governing legal acts (`drugs_cosmetics_act`).
- **`PriceRegulation`**: Price control orders (`nppa_dpco_ceiling`).
- **`License`**: Statutory drug manufacturing approvals (`form_28d_license`).

### 2. Edge Relations (Relationships)
Edges are constrained to a canonical vocabulary:
- `COMPLIES_WITH`
- `HOLDS_LICENSE`
- `CERTIFIED_FOR`
- `GOVERNED_BY`
- `DISPUTED_COMPLIANCE`
- `MANDATES`
- `CITED_IN`

---

## 🧮 Path Traversal & Scoring Formula

When an agent queries the graph for a target vendor entity:
1. Start at the vendor node (e.g. `apex_biologistics`).
2. Traverse outbound and inbound paths up to `max_depth = 2`.
3. Compute the normalized graph retrieval score:
   $$\text{graph\_score} = \frac{1}{1 + \text{shortest\_path\_length}}$$
4. Weight by source priority:
   $$\text{final\_score} = \text{graph\_score} \times \text{source\_priority}$$

---

## 📄 File: `entities_and_relations.json`

Contains the complete raw graph structure exported as a list of `nodes` and `edges`.
