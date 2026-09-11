# AutonoSource Historical Collected Data Archive (`backend/collected_data/`)

This directory serves as a standalone repository of all raw reference data, regulatory filings, government advisory alerts, pricing benchmarks, contract agreements, and knowledge graph exports that were previously collected and compiled for **AutonoSource (pharmProcure)**.

> **Note:** This folder is preserved **strictly for reference, inspection, and viewing**. The live application runtime actively reads and writes from `backend/database/`.

---

## 📁 Archive Structure & Contents

```
backend/collected_data/
├── regulatory_documents/       # Official Indian and WHO pharmaceutical regulations & alerts
│   ├── drugs_and_cosmetics_act_1940.pdf           # Primary statutory legislation governing pharma
│   ├── gdp_pharma_guidelines.pdf                  # Good Distribution Practices (GDP) guidelines
│   ├── schedule_m_gmp.pdf                         # Schedule M Good Manufacturing Practices (GMP)
│   ├── state_licensing_authorities_directory.pdf  # CDSCO State/UT drug controller directory
│   ├── who_trs1025_annex7_cold_chain.pdf          # WHO cold-chain & temperature control protocol
│   ├── Novo_Nordisk_alert.pdf                     # Regulatory advisory on falsified semaglutide products
│   └── CDSCO_alert_all_stakeholders.pdf           # CDSCO national advisory to pharma stakeholders
├── pricing/                    # Statutory Drug Price Control Orders
│   └── nppa_dpco_ceiling_prices.json              # NPPA DPCO 2013 ceiling price benchmarks
├── contracts/                  # Model pharmaceutical agreements & SLAs
│   ├── Apex_BioLogistics_SLA.md                   # Cold-chain distribution SLA (with clause 2.2.4)
│   ├── NovaVaccines_ColdChain_Agreement.md        # Stringent vaccine supply agreement
│   └── sample_pharma_msa.txt                      # Standard pharma Master Services Agreement
├── graph/                      # Legal & regulatory property graph exports
│   ├── knowledge_graph.graphml                    # Standard GraphML XML (for Gephi, Neo4j, Cytoscape)
│   └── knowledge_graph.json                       # Node-link adjacency list representation
└── cases/                      # Historical procurement due diligence casefiles
    └── cases.json                                 # Canonical procurement case runs with full audit reports
```

---

## 🔍 How to View and Inspect These Artifacts

1. **Viewing Regulatory PDFs:**
   Open any file in `regulatory_documents/` with standard PDF readers or browser viewer.
2. **Exploring the Knowledge Graph:**
   Import `graph/knowledge_graph.graphml` into [Gephi](https://gephi.org/) or [Cytoscape](https://cytoscape.org/) for interactive node-link visualization of statutory obligations, vendors, and licenses.
3. **Auditing Historical Cases:**
   Open `cases/cases.json` to inspect the complete multi-agent reasoning trace, 4D risk scores, confidence calculations, and approval records for the 5 benchmark vendor studies.
