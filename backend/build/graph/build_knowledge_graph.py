"""
Knowledge Graph Construction Build Module for AutonoSource.
Builds the property graph connecting vendors, regulatory standards,
pricing acts, cold-chain specifications, and licenses.
Persists the graph to backend/data/knowledge_graph.graphml and JSON format.
"""

import os
import sys
import networkx as nx
import json

backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

DB_GRAPH_DIR = os.path.join(backend_root, "database", "graph")
GRAPH_FILE = os.path.join(DB_GRAPH_DIR, "knowledge_graph.graphml")
JSON_FILE = os.path.join(DB_GRAPH_DIR, "knowledge_graph.json")

def run_graph_build() -> nx.MultiDiGraph:
    os.makedirs(DB_GRAPH_DIR, exist_ok=True)
    g = nx.MultiDiGraph()

    print("-" * 55)

    print("▶ [Build: Graph] Constructing Regulatory & Vendor Knowledge Graph")
    print("-" * 55)

    # 1. Regulatory & Statutory Standard Nodes
    standards = [
        ("schedule_m_gmp", {"type": "RegulatoryStandard", "title": "Schedule M Good Manufacturing Practices", "authority": "CDSCO"}),
        ("who_trs1025_annex7", {"type": "StorageStandard", "title": "WHO Cold-Chain Storage Guidelines", "temp_range": "2C-8C"}),
        ("drugs_cosmetics_act", {"type": "PrimaryLegislation", "title": "Drugs and Cosmetics Act, 1940", "jurisdiction": "India"}),
        ("nppa_dpco_ceiling", {"type": "PriceRegulation", "title": "Drugs Prices Control Order, 2013", "authority": "NPPA"}),
        ("form_28d_license", {"type": "License", "category": "Biological Manufacturing"}),
        ("iot_temperature_logger", {"type": "MonitoringSpec", "frequency": "continuous"}),
        ("liability_cap_standard", {"type": "ContractNorm", "recommended_multiplier": "1.5x"}),
    ]
    for nid, attrs in standards:
        g.add_node(nid, **attrs)

    # 2. Vendor Entity Nodes
    vendors = [
        ("biogen_diagnostics", {"type": "Vendor", "name": "BioGen Diagnostics Inc.", "credit_score": 780, "tier": "Tier-1 Manufacturer"}),
        ("global_pharma", {"type": "Vendor", "name": "Global Pharma Logistics Ltd.", "credit_score": 720, "tier": "Logistics Provider"}),
        ("apex_biologistics", {"type": "Vendor", "name": "Apex BioLogistics Pvt. Ltd.", "credit_score": 680, "tier": "Regional Distributor"}),
        ("nova_biologics", {"type": "Vendor", "name": "Nova Biologics & Vaccines Ltd.", "credit_score": 810, "tier": "Prequalified Manufacturer"}),
        ("medisynth_specialty", {"type": "Vendor", "name": "MediSynth Specialty Formulations Ltd.", "credit_score": 710, "tier": "Specialty Formulations"}),
    ]
    for nid, attrs in vendors:
        g.add_node(nid, **attrs)

    # 3. Directed Relationship Edges with source weights and priorities
    edges = [
        ("biogen_diagnostics", "schedule_m_gmp", "COMPLIES_WITH", {"weight": 1.0, "source_priority": 1.0}),
        ("biogen_diagnostics", "form_28d_license", "HOLDS_LICENSE", {"weight": 1.0, "source_priority": 1.0}),
        ("biogen_diagnostics", "who_trs1025_annex7", "CERTIFIED_FOR", {"weight": 0.85, "source_priority": 0.85}),
        
        ("global_pharma", "nppa_dpco_ceiling", "GOVERNED_BY", {"weight": 1.0, "source_priority": 1.0}),
        ("global_pharma", "schedule_m_gmp", "AUDITED_AGAINST", {"weight": 0.9, "source_priority": 0.9}),
        ("global_pharma", "liability_cap_standard", "BOUND_BY", {"weight": 0.85, "source_priority": 0.85}),

        ("apex_biologistics", "schedule_m_gmp", "COMPLIES_WITH", {"weight": 0.9, "source_priority": 0.9}),
        ("apex_biologistics", "who_trs1025_annex7", "DISPUTED_COMPLIANCE", {"weight": 0.7, "source_priority": 0.7}),

        ("nova_biologics", "who_trs1025_annex7", "MANDATES", {"weight": 1.0, "source_priority": 1.0}),
        ("nova_biologics", "iot_temperature_logger", "EQUIPPED_WITH", {"weight": 1.0, "source_priority": 1.0}),
        ("nova_biologics", "nppa_dpco_ceiling", "COMPLIES_WITH", {"weight": 1.0, "source_priority": 1.0}),

        ("medisynth_specialty", "schedule_m_gmp", "COMPLIES_WITH", {"weight": 0.9, "source_priority": 0.9}),

        ("who_trs1025_annex7", "drugs_cosmetics_act", "CITED_IN", {"weight": 1.0, "source_priority": 1.0}),
        ("schedule_m_gmp", "drugs_cosmetics_act", "DEFINED_IN", {"weight": 1.0, "source_priority": 1.0}),
    ]

    for src, tgt, rel, props in edges:
        g.add_edge(src, tgt, relation=rel, **props)

    # Persist as GraphML
    nx.write_graphml(g, GRAPH_FILE)

    # Persist as JSON for fast in-memory loading without XML overhead
    graph_data = {
        "nodes": [{"id": n, **d} for n, d in g.nodes(data=True)],
        "edges": [{"source": u, "target": v, **d} for u, v, d in g.edges(data=True)]
    }
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(graph_data, f, indent=2)

    print(f"  ✓ Nodes created: {g.number_of_nodes()}")
    print(f"  ✓ Edges created: {g.number_of_edges()}")
    print(f"  ✓ Persisted GraphML: {GRAPH_FILE}")
    print(f"  ✓ Persisted JSON:    {JSON_FILE}")
    print(f"\n  [Graph Build Complete] Ready for Graph RAG traversals.")
    return g


if __name__ == "__main__":
    run_graph_build()
