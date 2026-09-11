"""
RAG Subsystem package initialization.
Exports VectorRAGRetriever, GraphRAGRetriever, HybridRetriever, and fuse_retrieval_results.
"""

from app.rag_pipeline.fusion import (
    fuse_retrieval_results,
    VectorHit,
    GraphHit,
    HybridRAGFusionEngine,
    DEFAULT_SOURCE_PRIORITY
)
from app.rag_pipeline.vector_store import VectorRAGRetriever, VectorStore
from app.rag_pipeline.graph_store import GraphRAGRetriever, GraphRAGStore
from app.rag_pipeline.hybrid_retriever import HybridRetriever
from app.rag_pipeline.web_scraper import VendorWebScraper, vendor_scraper
from app.rag_pipeline.embedding_pipeline import EmbeddingPipeline

__all__ = [
    "fuse_retrieval_results",
    "VectorHit",
    "GraphHit",
    "HybridRAGFusionEngine",
    "DEFAULT_SOURCE_PRIORITY",
    "VectorRAGRetriever",
    "VectorStore",
    "GraphRAGRetriever",
    "GraphRAGStore",
    "HybridRetriever",
    "VendorWebScraper",
    "vendor_scraper",
    "EmbeddingPipeline",
]

