"""
LLM-Powered Knowledge Graph Construction Build Module for AutonoSource.
Builds the property graph connecting vendors, regulatory standards,
pricing acts, cold-chain specifications, and licenses using the provided LLM.
Persists the graph to backend/data_collected/processed_data/knowledge_graph.graphml
"""

import os
import sys
import networkx as nx
import json
import time
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List

# Load environment variables
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)
load_dotenv(os.path.join(backend_root, '.env'))

DB_GRAPH_KNOWLEDGE_DIR = os.path.join(backend_root, "ingestion", "rag_and_graph")
DB_GRAPH_DIR = os.path.join(backend_root, "processed_data", "graph")
GRAPH_FILE = os.path.join(DB_GRAPH_DIR, "knowledge_graph.graphml")
JSON_FILE = os.path.join(DB_GRAPH_DIR, "knowledge_graph.json")

# Define expected JSON structure for LangChain parser
class NodeModel(BaseModel):
    id: str = Field(description="Unique ID for the node")
    label: str = Field(description="Type of node (e.g. Vendor, Regulation, Act)")
    properties: dict = Field(description="Key-value pairs of properties")

class EdgeModel(BaseModel):
    source: str = Field(description="ID of the source node")
    target: str = Field(description="ID of the target node")
    relation: str = Field(description="Type of relationship (e.g. COMPLIES_WITH, REGULATES)")
    properties: dict = Field(description="Key-value pairs of edge properties")

class GraphExtraction(BaseModel):
    nodes: List[NodeModel]
    edges: List[EdgeModel]

def run_graph_build(provider="ollama") -> nx.MultiDiGraph:
    os.makedirs(DB_GRAPH_DIR, exist_ok=True)
    g = nx.MultiDiGraph()

    print("-" * 55)
    print("▶ [Build: Graph] Constructing Graph via LLM Extraction")
    print("-" * 55)

    if provider == "ollama":
        print("  [Config] Provider: Ollama (Local Network)")
        llm = ChatOpenAI(
            api_key="ollama",
            base_url="http://10.150.20.231:11434/v1",
            model="qwen3:14b",
            temperature=0.1,
        )
    else:
        print("  [Config] Provider: Groq (Cloud API)")
        llm = ChatOpenAI(
            api_key=os.getenv("GROQ_API_KEY"),
            base_url="https://api.groq.com/openai/v1",
            model=os.getenv("GROQ_MODEL", "gpt-oss-120b"),
            temperature=0.1,
        )
    
    parser = JsonOutputParser(pydantic_object=GraphExtraction)
    prompt = PromptTemplate(
        template="Extract the regulatory entities and relationships from this text.\n{format_instructions}\n\nText:\n{text}",
        input_variables=["text"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )
    chain = prompt | llm | parser

    from build.embedding_pipeline import qdrant_pipeline
    
    try:
        q_client = qdrant_pipeline.client
        if q_client is None:
            raise Exception("Global Qdrant client not initialized.")
    except Exception as e:
        print(f"  [ERROR] Failed to connect to Qdrant: {e}. Ensure ingest_rag_docs.py was run first.")
        return g

    print("  Connected to local Qdrant Vector Database.")
    print("  Streaming semantic chunks into LLM for relationship extraction...")
    
    offset = None
    chunk_counter = 0
    collection_name = "procurement_contracts"
    
    while True:
        try:
            records, offset = q_client.scroll(
                collection_name=collection_name,
                offset=offset,
                limit=50,
                with_payload=True,
                with_vectors=False
            )
        except Exception as e:
            print(f"  [ERROR] Failed to read from collection '{collection_name}': {e}")
            break
            
        if not records:
            break
            
        for record in records:
            chunk_counter += 1
            chunk_text = record.payload.get("text", "")
            source_file = record.payload.get("source_doc", "unknown")
            chunk_id = record.payload.get("chunk_id", f"unknown_{chunk_counter}")
            
            print(f"    [Qdrant ➔ LLM] Loaded {chunk_id} from doc: '{source_file}' (Global #{chunk_counter})")
            print(f"    ➔ Extracting Knowledge Graph facts...")
            
            if len(chunk_text) < 50:
                continue
                
            try:
                result = chain.invoke({"text": chunk_text})
                
                # Add nodes to graph
                for node in result.get("nodes", []):
                    # inject provenance
                    props = node.get("properties", {})
                    props["source_doc"] = source_file
                    props["source_chunk_id"] = chunk_id
                    g.add_node(node["id"], label=node.get("label", "Entity"), **props)
                    
                # Add edges to graph
                for edge in result.get("edges", []):
                    props = edge.get("properties", {})
                    props["source_doc"] = source_file
                    props["source_chunk_id"] = chunk_id
                    g.add_edge(edge["source"], edge["target"], relation=edge.get("relation"), **props)
            
            except Exception as e:
                print(f"    [Error] LLM Extraction failed on chunk #{chunk_counter}: {e}")
            
            # Rate limiting only for external APIs
            if provider != "ollama":
                time.sleep(2)
                
        if offset is None:
            break
                
    # Persist as GraphML
    nx.write_graphml(g, GRAPH_FILE)

    # Persist as JSON
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
    print(f"\n  [Graph Build Complete] LLM Extraction Finished.")
    return g

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Build Knowledge Graph")
    parser.add_argument("--provider", type=str, choices=["groq", "ollama"], default="ollama", help="LLM Provider to use (groq or ollama)")
    args = parser.parse_args()
    
    run_graph_build(provider=args.provider)
