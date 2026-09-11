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
import glob
import re

backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

DB_GRAPH_KNOWLEDGE_DIR = os.path.join(backend_root, "ingestion", "rag_and_graph")
DB_GRAPH_DIR = os.path.join(backend_root, "processed_data")
GRAPH_FILE = os.path.join(DB_GRAPH_DIR, "knowledge_graph.graphml")
JSON_FILE = os.path.join(DB_GRAPH_DIR, "knowledge_graph.json")

def run_graph_build() -> nx.MultiDiGraph:
    os.makedirs(DB_GRAPH_DIR, exist_ok=True)
    g = nx.MultiDiGraph()

    print("-" * 55)

    print("▶ [Build: Graph] Constructing Regulatory & Vendor Knowledge Graph from Markdown")
    print("-" * 55)

    # 1. Parse Nodes and Edges from Markdown
    parsed_nodes = []
    parsed_edges = []
    
    if os.path.exists(DB_GRAPH_KNOWLEDGE_DIR):
        print(f"  Scanning for markdown extraction files in: {DB_GRAPH_KNOWLEDGE_DIR}")
        md_files = glob.glob(os.path.join(DB_GRAPH_KNOWLEDGE_DIR, "*.md"))
        print(f"  Found {len(md_files)} markdown files for entity extraction.")
        for filepath in md_files:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            sections = content.split('## Node: ')
            for section in sections[1:]:
                lines = section.strip().split('\n')
                title = lines[0].strip()
                
                node_attrs = {"name": title} if "Vendor" in title else {"title": title}
                node_id = None
                
                i = 1
                while i < len(lines):
                    line = lines[i].strip()
                    if line.startswith('### Relationships'):
                        i += 1
                        break
                    if line.startswith('- ID:'):
                        node_id = line.replace('- ID:', '').strip()
                    elif line.startswith('- '):
                        key_val = line[2:].split(':', 1)
                        if len(key_val) == 2:
                            key = key_val[0].strip().lower().replace(' ', '_')
                            val = key_val[1].strip()
                            try:
                                if '.' in val: val = float(val)
                                else: val = int(val)
                            except: pass
                            node_attrs[key] = val
                    i += 1
                    
                if node_id:
                    parsed_nodes.append((node_id, node_attrs))
                    
                while i < len(lines):
                    line = lines[i].strip()
                    if line.startswith('- ['):
                        match = re.match(r'- \[(.*?)\] -> (.*?) \((.*?)\)', line)
                        if match:
                            rel = match.group(1).strip()
                            target = match.group(2).strip()
                            props_str = match.group(3).strip()
                            props = {}
                            for prop in props_str.split(','):
                                k, v = prop.split(':')
                                k = k.strip().lower().replace(' ', '_')
                                v = float(v.strip())
                                props[k] = v
                            parsed_edges.append((node_id, target, rel, props))
                    i += 1

    for nid, attrs in parsed_nodes:
        g.add_node(nid, **attrs)

    for src, tgt, rel, props in parsed_edges:
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
