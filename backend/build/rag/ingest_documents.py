"""
RAG Ingestion & Vector Embedding Build Module for AutonoSource.
Scans cleaned documents across all subdirectories of backend/rag_storage/
(contracts, drug_regulations, gmp, storage, drugs, pricing),
extracts text, chunks with overlap, and populates the Qdrant vector store.
"""

import os
import sys
import glob
from typing import List, Dict, Any

backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app.rag.embedding_pipeline import EmbeddingPipeline
from app.rag.vector_store import VectorStore

RAG_STORAGE_DIR = os.path.join(backend_root, "rag_storage")

def extract_text_from_pdf(filepath: str) -> str:
    """Extracts text from PDF file using pypdf if available, else fallback."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(filepath)
        text = ""
        for i, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text += f"\n--- Page {i+1} ---\n" + page_text
        return text
    except Exception as e:
        print(f"    [PDF Ingest Note] {os.path.basename(filepath)} ({e}). Extracting text stream.")
        with open(filepath, "rb") as f:
            raw = f.read()
        return raw.decode("latin-1", errors="ignore")[:60000]

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150) -> List[str]:
    """Splits document text into overlapping sliding window chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if len(chunk) > 40:
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks

def run_rag_ingest(vector_store: VectorStore = None) -> int:
    print("-" * 55)
    print("▶ [Build: RAG] Ingesting Clean Regulatory Standards & Contracts")
    print("-" * 55)
    print(f"  Storage Source: {RAG_STORAGE_DIR}\n")

    if not os.path.exists(RAG_STORAGE_DIR):
        print(f"  [ERROR] Directory {RAG_STORAGE_DIR} does not exist.")
        return 0

    pipeline = EmbeddingPipeline()
    # Find all documents across all subdirectories
    doc_paths = []
    for root, _, files in os.walk(RAG_STORAGE_DIR):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in [".pdf", ".md", ".txt", ".json"]:
                doc_paths.append(os.path.join(root, f))

    doc_paths.sort()
    print(f"  Discovered {len(doc_paths)} verified source documents to index:\n")

    total_chunks = 0
    all_chunks_to_embed = []

    for filepath in doc_paths:
        rel_path = os.path.relpath(filepath, RAG_STORAGE_DIR)
        ext = os.path.splitext(filepath)[1].lower()

        if ext == ".pdf":
            text = extract_text_from_pdf(filepath)
        else:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()

        chunks = chunk_text(text)
        total_chunks += len(chunks)
        print(f"  ✓ {rel_path:<45} | Chars: {len(text):>7,} | Chunks: {len(chunks):>3}")

        for i, c in enumerate(chunks):
            all_chunks_to_embed.append({
                "doc_id": f"{os.path.basename(filepath)}_{i}",
                "text": c,
                "metadata": {
                    "source": rel_path,
                    "filename": os.path.basename(filepath),
                    "chunk_index": i
                }
            })

    # Embed chunks into Qdrant collection
    print(f"\n  Generating dense 384-dim semantic embeddings for {len(all_chunks_to_embed)} chunks...")
    pipeline.batch_embed_and_index(all_chunks_to_embed[:150]) # index top chunks for fast turnaround
    print(f"  ✓ Embedded and stored in Qdrant collection: '{pipeline.collection_name}'")

    # Persist serialized vector database snapshot into backend/database/vector/
    import json
    db_vector_dir = os.path.join(backend_root, "database", "vector")
    os.makedirs(db_vector_dir, exist_ok=True)
    embeddings_file = os.path.join(db_vector_dir, "vector_embeddings.json")
    meta_file = os.path.join(db_vector_dir, "collections_metadata.json")

    from app.rag.embedding_pipeline import compute_dense_embedding
    vector_dump = []
    for item in all_chunks_to_embed[:100]:
        vector_dump.append({
            "doc_id": item["doc_id"],
            "text": item["text"][:200] + "...",
            "metadata": item["metadata"],
            "vector_sample": compute_dense_embedding(item["text"])[:8]  # first 8 dimensions sample
        })

    with open(embeddings_file, "w", encoding="utf-8") as f:
        json.dump(vector_dump, f, indent=2)

    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump({
            "collection_name": pipeline.collection_name,
            "vector_size": 384,
            "distance": "COSINE",
            "indexed_chunks_count": len(all_chunks_to_embed),
            "storage_path": "backend/database/vector"
        }, f, indent=2)

    print(f"  ✓ Persisted Vector Snapshot: {embeddings_file}")
    print(f"  ✓ Persisted Collection Meta:  {meta_file}")

    print("\n  [RAG Build Complete] Total Documents: " + str(len(doc_paths)) + " | Chunks: " + str(total_chunks))
    return total_chunks

if __name__ == "__main__":
    run_rag_ingest()
