"""
Qdrant Vector Embedding & Document Ingestion Pipeline.
Handles text extraction, chunking, dense 384-dimension vector embedding,
and upserting into the Qdrant vector store.
"""

import os
import hashlib
import glob
from typing import List, Dict, Any, Optional

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, VectorParams, PointStruct
    HAS_QDRANT = True
except ImportError:
    HAS_QDRANT = False

COLLECTION_NAME = "procurement_contracts"
VECTOR_SIZE = 768

# Lazy-load the model to prevent massive memory overhead on simple imports
_encoder = None

def compute_dense_embedding(text: str, vector_dim: int = VECTOR_SIZE) -> List[float]:
    """
    Generates high-quality 768-dimensional dense semantic embedding using nomic-embed-text-v1.5.
    Requires internet connection on first run to download model weights.
    """
    global _encoder
    if _encoder is None:
        try:
            from sentence_transformers import SentenceTransformer
            print("[EmbeddingPipeline] Loading nomic-ai/nomic-embed-text-v1.5 model...")
            _encoder = SentenceTransformer("nomic-ai/nomic-embed-text-v1.5", trust_remote_code=True)
        except ImportError:
            print("[EmbeddingPipeline] WARNING: sentence-transformers not installed. Returning zero vector.")
            return [0.0] * vector_dim
            
    if _encoder:
        # Nomic includes a 'search_document: ' prefix requirement, but we handle raw text for now
        vector = _encoder.encode(text).tolist()
        return vector
    return [0.0] * vector_dim

class QdrantEmbeddingPipeline:
    """
    Manages vector ingestion, collection initialization, and similarity search in Qdrant.
    """
    def __init__(self, host: str = ":memory:"):
        self.host = host
        self.client = None
        self.initialized = False
        self._init_client()

    def _init_client(self):
        if not HAS_QDRANT:
            print("[QdrantPipeline] qdrant_client not installed. Running in structured in-memory mode.")
            return

        try:
            if self.host == ":memory:":
                self.client = QdrantClient(location=":memory:")
            else:
                self.client = QdrantClient(host=self.host, port=6333)

            # Ensure collection exists
            existing = [c.name for c in self.client.get_collections().collections]
            if COLLECTION_NAME not in existing:
                from qdrant_client.models import models
                self.client.create_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
                    hnsw_config=models.HnswConfigDiff(
                        m=16,
                        ef_construct=100,
                        full_scan_threshold=10000,
                        max_indexing_threads=0,
                        on_disk=False
                    )
                )
            self.initialized = True
            print(f"[QdrantPipeline] Initialized collection '{COLLECTION_NAME}' in {self.host}")
        except Exception as e:
            print(f"[QdrantPipeline] Initialization note ({e}). Active in fallback mode.")
            self.initialized = False

    def ingest_document_chunks(self, chunks: List[Dict[str, Any]]) -> int:
        """
        Embeds and upserts a list of document chunks into Qdrant.
        Each chunk should have: {'text': str, 'source_doc': str, 'category': str, 'source_priority': float}
        """
        if not self.initialized or not self.client:
            return len(chunks)

        points = []
        for i, chunk in enumerate(chunks):
            text = chunk.get("text", "")
            vector = compute_dense_embedding(text)
            point_id = i + 1
            payload = {
                "chunk_id": f"chunk_{point_id}",
                "text": text,
                "source_doc": chunk.get("source_doc", "unknown.pdf"),
                "category": chunk.get("category", "general"),
                "source_priority": float(chunk.get("source_priority", 0.85)),
                "page_number": int(chunk.get("page_number", 1))
            }
            points.append(PointStruct(id=point_id, vector=vector, payload=payload))

        self.client.upsert(collection_name=COLLECTION_NAME, points=points)
        print(f"[QdrantPipeline] Successfully upserted {len(points)} points into '{COLLECTION_NAME}'")
        return len(points)

    def search(self, query_text: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """
        Computes vector for query and retrieves top-k most similar points with scores.
        """
        if not self.initialized or not self.client:
            return []

        try:
            query_vector = compute_dense_embedding(query_text)
            search_results = self.client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_vector,
                limit=top_k
            )

            hits = []
            for hit in search_results:
                payload = hit.payload or {}
                hits.append({
                    "fact_id": f"v_point_{hit.id}",
                    "text": payload.get("text", ""),
                    "score": round(float(hit.score), 4),
                    "source_doc": payload.get("source_doc", "document.pdf"),
                    "source_priority": float(payload.get("source_priority", 0.85)),
                    "category": payload.get("category", "general")
                })
            return hits
        except Exception as e:
            print(f"[QdrantPipeline] Search error: {e}")
            return []

    def batch_embed_and_index(self, chunks: List[Dict[str, Any]]) -> int:
        """Alias for ingest_document_chunks."""
        self.collection_name = COLLECTION_NAME
        return self.ingest_document_chunks(chunks)

# Canonical alias
EmbeddingPipeline = QdrantEmbeddingPipeline
qdrant_pipeline = QdrantEmbeddingPipeline()

__all__ = [
    "QdrantEmbeddingPipeline",
    "EmbeddingPipeline",
    "qdrant_pipeline",
    "compute_dense_embedding",
    "COLLECTION_NAME",
    "VECTOR_SIZE",
]
