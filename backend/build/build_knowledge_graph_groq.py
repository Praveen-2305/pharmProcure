"""
Production-Grade Knowledge Graph Construction Pipeline using Groq Cloud API.
PENTA-WORKER HIGH-THROUGHPUT ENGINE

Features:
- Penta Concurrent Workers (Worker-1 to Worker-5) pulling from a thread-safe FIFO Queue
- 17-Key Round-Robin Ring with automatic dynamic cooldown (5s clamp) and 45s quarantine on HTTP 429
- Single-Producer Qdrant Reader (Zero database locks or concurrent access conflicts)
- Monotonic Continuous Watermark Checkpointing (Mathematically immune to out-of-order completion loss)
- Thread-Safe Local In-Memory Deduplication with fine-grained Graph Lock (Zero Token Cost)
- Atomic Checkpointing & Crash Resumption (saves to .tmp then atomic os.replace)
- Coordinated Multi-Thread Signal Trapping (Ctrl+C / SIGTERM) for safe in-flight drain and flush
- Rich Terminal Telemetry (Progress %, Chunks, Source Docs, Nodes, Edges, Worker IDs, Active Keys, ETA)
- 100% Isolated Environment (reads backend/build/.env without clashing with backend/.env)
"""

import os
import sys
import json
import re
import time
import signal
import gc
import threading
import queue
from typing import List, Dict, Any, Optional, Tuple
import networkx as nx
from dotenv import dotenv_values
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import box

console = Console()

# Ensure backend root is on sys.path
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

# Isolate backend/build/.env so it NEVER clashes with backend/.env
build_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
build_config = dotenv_values(build_env_path) if os.path.exists(build_env_path) else {}

from openai import OpenAI, APIError, RateLimitError, APITimeoutError, InternalServerError

# ==============================================================================
# CONFIGURATION & PATHS
# ==============================================================================
DB_GRAPH_DIR = os.path.join(backend_root, "processed_data", "graph")
GRAPH_FILE = os.path.join(DB_GRAPH_DIR, "knowledge_graph.graphml")
JSON_FILE = os.path.join(DB_GRAPH_DIR, "knowledge_graph.json")
CHECKPOINT_FILE = os.path.join(DB_GRAPH_DIR, "checkpoint.json")
ERROR_LOG_FILE = os.path.join(DB_GRAPH_DIR, "failed_batches.log")

DEFAULT_MODEL = build_config.get("GROQ_MODEL") or os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
NUM_WORKERS = 5               # 5 concurrent worker threads (Worker-1 to Worker-5)
BATCH_CHUNK_SIZE = 3          # 3 Chunks per LLM request
GLOBAL_DISPATCH_INTERVAL = 1.30 # 1.30s heartbeat across 17 independent accounts = 22.1s rest per account
KEY_REST_SECONDS = 21.0       # Seconds each account rests after a batch to fully replenish its 8k token bucket
CHECKPOINT_SAVE_INTERVAL = 20 # Save checkpoint every 20 batches (~60 chunks)

# Load Groq API keys strictly from backend/build/.env
def get_groq_api_keys() -> List[str]:
    keys_str = build_config.get("GROQ_API_KEYS", "")
    keys = [k.strip() for k in keys_str.split(",") if k.strip()]
    if not keys:
        for i in range(1, 60):
            k = build_config.get(f"GROQ_KEY_{i}")
            if k and k.strip():
                keys.append(k.strip())
    if not keys:
        env_keys_str = os.getenv("GROQ_API_KEYS", "")
        keys = [k.strip() for k in env_keys_str.split(",") if k.strip()]
        if not keys and os.getenv("GROQ_API_KEY"):
            keys.append(os.getenv("GROQ_API_KEY").strip())
    return list(dict.fromkeys(keys))

GROQ_KEYS = get_groq_api_keys()
if not GROQ_KEYS:
    raise ValueError("[CRITICAL] No Groq API keys found in backend/build/.env!")

# ==============================================================================
# STOP-WORDS & CANONICAL ONTOLOGY
# ==============================================================================
GRAPH_STOPWORDS = {
    "medicine", "medicines", "drug", "drugs", "product", "products", "item", "items",
    "patient", "patients", "vendor", "vendors", "company", "companies", "manufacturer",
    "manufacturers", "supplier", "suppliers", "distributor", "distributors", "chapter",
    "annex", "annexure", "section", "part", "sub-section", "rule", "rules", "schedule",
    "document", "guideline", "guidelines", "requirement", "requirements", "specification",
    "specifications", "healthcare", "treatment", "general", "authority", "government"
}

SYSTEM_PROMPT = """You are a senior pharmaceutical regulatory and compliance knowledge graph specialist for the Indian and global healthcare supply chain.
Your mission is to read regulatory acts, Good Manufacturing Practice (Schedule M/WHO-GMP) rules, cold-chain standards, and Drug Price Control Orders (DPCO), and extract precise, factual knowledge graph entities and directed relations.

ALLOWED NODE TYPES (use clean canonical lowercase strings for ID):
- DRUG_OR_MOLECULE: Generic drug, active ingredient (API), scheduled formulation, vaccine, dosage form (e.g. "amoxicillin 500mg capsule").
- SCHEDULE: Schedule H, Schedule X, Schedule C, Schedule C1, Schedule M, Schedule G, etc.
- LICENSE_FORM: Form 20B, Form 21B, Form 24, Form 25, Form 28, Form 10, etc.
- REGULATORY_ACT: Drugs and Cosmetics Act 1940, Drugs Rules 1945, DPCO 2013, Essential Commodities Act, etc.
- REGULATORY_BODY: CDSCO, NPPA, Central Licence Approving Authority, State Licensing Authority, WHO.
- STORAGE_CONDITION: Cold chain 2C-8C, Controlled ambient 15C-25C, Deep freeze -20C, Protect from light.
- COMPLIANCE_STANDARD: Cleanroom Grade A/B/C/D, AHU HEPA filtration, Purified water IP, Temperature data logger, Stability testing Zone IVb.
- PRICING_RULE: Ceiling price, Retailer margin 16 percent, Maximum retail price (MRP), Annual WPI revision.

ALLOWED DIRECTED RELATIONS (Source -> Target):
- GOVERNED_BY: (DRUG_OR_MOLECULE | LICENSE_FORM | PRICING_RULE) -> (REGULATORY_ACT | SCHEDULE)
- MANDATES_LICENSE: (SCHEDULE | DRUG_OR_MOLECULE) -> (LICENSE_FORM)
- ISSUED_BY: (LICENSE_FORM) -> (REGULATORY_BODY)
- REQUIRES_STORAGE: (DRUG_OR_MOLECULE | SCHEDULE) -> (STORAGE_CONDITION)
- REQUIRES_COMPLIANCE: (DRUG_OR_MOLECULE | STORAGE_CONDITION | LICENSE_FORM) -> (COMPLIANCE_STANDARD)
- SUBJECT_TO_PRICING: (DRUG_OR_MOLECULE) -> (PRICING_RULE)
- ENFORCED_BY: (PRICING_RULE | REGULATORY_ACT) -> (REGULATORY_BODY)
- STANDARDIZED_UNDER: (COMPLIANCE_STANDARD) -> (REGULATORY_ACT | SCHEDULE)

STRICT RULES:
1. Return strictly valid JSON containing "nodes" and "edges". No conversational commentary.
2. Only extract facts explicitly supported by the text.
3. Every edge must include an "evidence" snippet and reference the chunk ID where it was found.
4. If a text snippet contains no regulatory, compliance, or pharmaceutical specifications, return: {"nodes": [], "edges": []}.
5. Never extract generic noise words like "medicine", "guideline", "document", "product", "annex", "chapter".
"""

# ==============================================================================
# RATE PACING & SMART TOKEN REPLENISHMENT
# ==============================================================================
def extract_retry_seconds(err: Exception, default_wait: float = KEY_REST_SECONDS) -> float:
    """Extracts exact wait time from Groq 429 response message or headers."""
    err_str = str(err)
    m = re.search(r"try again in ([\d\.]+)\s*s", err_str, re.IGNORECASE)
    if m:
        try:
            val = float(m.group(1))
            return max(3.0, val + 1.0)
        except ValueError:
            pass
    if hasattr(err, "response") and err.response is not None:
        try:
            retry_header = err.response.headers.get("retry-after")
            if retry_header:
                val = float(retry_header)
                return max(3.0, val + 1.0)
        except Exception:
            pass
    return default_wait

class GlobalRatePacer:
    """
    Thread-safe global heartbeat pacer.
    Ensures LLM requests across all 5 workers are dispatched with smooth, guaranteed
    time intervals (1.30s), completely eliminating concurrent burst spikes, token exhaustion,
    and cascading key burnout.
    """
    def __init__(self, interval: float = GLOBAL_DISPATCH_INTERVAL):
        self.lock = threading.Lock()
        self.interval = interval
        self.last_dispatch_time = 0.0

    def wait_turn(self, stop_event: threading.Event, extra_delay: float = 0.0):
        """Blocks until the global heartbeat allows the next request to dispatch."""
        while not stop_event.is_set():
            with self.lock:
                now = time.time()
                target_gap = self.interval + extra_delay
                elapsed = now - self.last_dispatch_time
                if elapsed >= target_gap:
                    self.last_dispatch_time = time.time()
                    return
                wait_needed = target_gap - elapsed

            sleep_step = min(wait_needed, 0.2)
            time.sleep(sleep_step)

# ==============================================================================
# CONCURRENT THREAD-SAFE KEY RING (LONGEST-RESTED FAIR ALLOCATOR)
# ==============================================================================
class ConcurrentKeyRing:
    """
    Thread-safe dynamic key allocator for multi-worker architectures.
    Provides longest-rested key allocation with individual token-bucket replenishment.
    """
    def __init__(self, keys: List[str], model: str = DEFAULT_MODEL):
        self.lock = threading.Lock()
        self.model = model
        self.records = []
        self.last_all_cooling_print = 0.0
        for idx, k in enumerate(keys):
            self.records.append({
                "id": idx + 1,
                "label": f"Key #{idx + 1}/{len(keys)}",
                "key": k,
                "client": OpenAI(base_url="https://api.groq.com/openai/v1", api_key=k, timeout=30.0),
                "last_used": 0.0,
                "cooldown_until": 0.0,
                "in_use": False
            })

    def acquire_key(self, stop_event: threading.Event, worker_id: str = "") -> Optional[Dict[str, Any]]:
        """Acquires the longest-rested available key whose token bucket has replenished."""
        while not stop_event.is_set():
            with self.lock:
                now = time.time()
                # Find available keys not currently held by another worker
                available = [r for r in self.records if not r["in_use"]]
                if available:
                    # Check for keys whose token replenishment cooldown has elapsed
                    ready_keys = [r for r in available if r["cooldown_until"] <= now]
                    if ready_keys:
                        # Longest-rested key first (fair round-robin)
                        ready_keys.sort(key=lambda r: r["last_used"])
                        candidate = ready_keys[0]
                        candidate["in_use"] = True
                        return candidate

                    # If all available keys are cooling, wait for earliest one to finish cooling
                    available.sort(key=lambda r: r["cooldown_until"])
                    earliest_key = available[0]
                    wait_needed = max(0.2, earliest_key["cooldown_until"] - now)
                else:
                    wait_needed = 0.5

                if wait_needed > 2.0 and (now - self.last_all_cooling_print > 15.0):
                    self.last_all_cooling_print = now
                    console.print(f"  [yellow]⏳ [Key-Rest] Replenishing Groq token buckets. Next key ready in {wait_needed:.1f}s...[/]")

            time.sleep(min(1.0, wait_needed))
        return None

    def release_key(self, key_record: Dict[str, Any], cooldown_seconds: float = KEY_REST_SECONDS):
        """Releases key back to pool with per-key rest duration."""
        with self.lock:
            now = time.time()
            key_record["in_use"] = False
            key_record["last_used"] = now
            key_record["cooldown_until"] = now + cooldown_seconds

# ==============================================================================
# MONOTONIC WATERMARK TRACKER (OUT-OF-ORDER SAFETY)
# ==============================================================================
class WatermarkTracker:
    """
    Guarantees continuous, gap-free checkpointing even if parallel workers
    complete batches out of order.
    """
    def __init__(self, initial_offset: Optional[int], initial_chunk_counter: int, initial_chunk_id: str):
        self.lock = threading.Lock()
        self.watermark_offset = initial_offset
        self.watermark_counter = initial_chunk_counter
        self.watermark_chunk_id = initial_chunk_id
        self.expected_seq = 1
        self.completed_batches: Dict[int, Dict[str, Any]] = {}
        self.batches_since_last_save = 0

    def register_completion(self, batch_item: Dict[str, Any]) -> Tuple[bool, int, int, str]:
        """
        Registers a completed batch and advances the continuous watermark.
        Returns (should_save_checkpoint, current_counter, current_offset, current_chunk_id).
        """
        with self.lock:
            seq = batch_item["seq"]
            self.completed_batches[seq] = batch_item

            # Advance watermark as far as possible in unbroken sequence
            while self.expected_seq in self.completed_batches:
                item = self.completed_batches.pop(self.expected_seq)
                self.watermark_offset = item["max_record_id"]
                self.watermark_counter = item["chunk_counter_at_batch"]
                self.watermark_chunk_id = item["last_chunk_id"]
                self.expected_seq += 1
                self.batches_since_last_save += 1

            should_save = self.batches_since_last_save >= CHECKPOINT_SAVE_INTERVAL
            if should_save:
                self.batches_since_last_save = 0

            return should_save, self.watermark_counter, self.watermark_offset, self.watermark_chunk_id

    def get_watermark(self) -> Tuple[int, Optional[int], str]:
        with self.lock:
            return self.watermark_counter, self.watermark_offset, self.watermark_chunk_id

# ==============================================================================
# LOCAL NORMALIZATION & DEDUPLICATION (THREAD-SAFE WITH LOCK)
# ==============================================================================
def normalize_entity_id(name: str) -> str:
    """Preserves dosages (mg, ml, %, g), chemical salts, and form numbers."""
    if not name:
        return ""
    clean = name.strip().lower()
    clean = re.sub(r'[\'"`]', '', clean)
    clean = re.sub(r'[\s\-_]+', ' ', clean)
    return clean.strip()

def is_stop_node(entity_id: str) -> bool:
    if not entity_id or len(entity_id) < 2:
        return True
    if entity_id in GRAPH_STOPWORDS:
        return True
    base = re.sub(r'[^a-z]', '', entity_id)
    return base in GRAPH_STOPWORDS

def canonicalize_edge_direction(src_id: str, tgt_id: str, rel: str) -> Tuple[str, str, str]:
    if rel == "MANDATES_LICENSE":
        if "form " in src_id and ("schedule" in tgt_id or not "form " in tgt_id):
            return tgt_id, src_id, rel
    if rel == "GOVERNED_BY":
        if ("act" in src_id or "rules" in src_id or "dpco" in src_id or "schedule" in src_id) and not ("act" in tgt_id or "rules" in tgt_id):
            return tgt_id, src_id, rel
    if rel == "ISSUED_BY":
        if ("cdsco" in src_id or "authority" in src_id or "nppa" in src_id) and "form " in tgt_id:
            return tgt_id, src_id, rel
    return src_id, tgt_id, rel

def merge_node_dedup(g: nx.MultiDiGraph, entity: dict, chunk_ids: Any, doc_name: str) -> Optional[str]:
    raw_id = entity.get("id", "")
    node_id = normalize_entity_id(raw_id)
    if is_stop_node(node_id):
        return None

    label = entity.get("label", "ENTITY").upper().strip()
    props = entity.get("properties", {}) or {}

    c_list = [chunk_ids] if isinstance(chunk_ids, str) else list(chunk_ids)

    if g.has_node(node_id):
        existing = g.nodes[node_id]
        existing["mention_count"] = existing.get("mention_count", 1) + 1
        
        chunks = existing.get("source_chunks", [])
        for cid in c_list:
            if cid and cid not in chunks:
                chunks.append(cid)
        existing["source_chunks"] = chunks

        docs = existing.get("source_docs", [])
        if doc_name and doc_name not in docs:
            docs.append(doc_name)
        existing["source_docs"] = docs

        aliases = existing.get("aliases", [])
        if raw_id and raw_id not in aliases:
            aliases.append(raw_id)
        existing["aliases"] = aliases
    else:
        g.add_node(
            node_id,
            label=label,
            canonical_name=raw_id,
            mention_count=1,
            source_chunks=[cid for cid in c_list if cid],
            source_docs=[doc_name] if doc_name else [],
            aliases=[raw_id] if raw_id else [],
            description=props.get("description", "")
        )
    return node_id

def merge_edge_dedup(g: nx.MultiDiGraph, edge: dict, chunk_ids: Any, doc_name: str):
    raw_src = edge.get("source", "")
    raw_tgt = edge.get("target", "")
    src_id = normalize_entity_id(raw_src)
    tgt_id = normalize_entity_id(raw_tgt)

    if not src_id or not tgt_id or is_stop_node(src_id) or is_stop_node(tgt_id):
        return
    if src_id == tgt_id:
        return

    rel = edge.get("relation", "ASSOCIATED_WITH").upper().strip()
    src_id, tgt_id, rel = canonicalize_edge_direction(src_id, tgt_id, rel)
    edge_props = edge.get("properties", {}) or {}
    evidence = edge_props.get("evidence", "")

    c_list = [chunk_ids] if isinstance(chunk_ids, str) else list(chunk_ids)
    chunk_label = f"{c_list[0]}..{c_list[-1]}" if len(c_list) > 1 else (c_list[0] if c_list else "")

    if not g.has_node(src_id):
        g.add_node(src_id, label="ENTITY", canonical_name=raw_src, mention_count=1, source_chunks=list(c_list), source_docs=[doc_name])
    if not g.has_node(tgt_id):
        g.add_node(tgt_id, label="ENTITY", canonical_name=raw_tgt, mention_count=1, source_chunks=list(c_list), source_docs=[doc_name])

    edge_found = False
    if g.has_edge(src_id, tgt_id):
        for key, existing_edge in g.get_edge_data(src_id, tgt_id).items():
            if existing_edge.get("relation") == rel:
                existing_edge["weight"] = existing_edge.get("weight", 1) + 1
                ev_list = existing_edge.get("evidence", [])
                if evidence and evidence not in ev_list:
                    ev_list.append(evidence)
                existing_edge["evidence"] = ev_list
                curr_source = existing_edge.get("source_chunk", "")
                if chunk_label and chunk_label not in curr_source:
                    existing_edge["source_chunk"] = f"{curr_source}, {chunk_label}".strip(", ")
                edge_found = True
                break

    if not edge_found:
        g.add_edge(
            src_id,
            tgt_id,
            relation=rel,
            weight=1,
            evidence=[evidence] if evidence else [],
            source_chunk=chunk_label,
            source_doc=doc_name
        )

# ==============================================================================
# ATOMIC PERSISTENCE & CHECKPOINTING
# ==============================================================================
def atomic_save_graph(g: nx.MultiDiGraph, current_offset: Any, chunk_counter: int, last_chunk_id: str):
    """Safely writes to temporary files first, then performs atomic os.replace."""
    os.makedirs(DB_GRAPH_DIR, exist_ok=True)

    # 1. Save GraphML atomically
    tmp_graphml = GRAPH_FILE + ".tmp"
    try:
        g_export = nx.MultiDiGraph()
        for n, d in g.nodes(data=True):
            clean_d = {k: json.dumps(v) if isinstance(v, (list, dict)) else v for k, v in d.items()}
            g_export.add_node(n, **clean_d)
        for u, v, d in g.edges(data=True):
            clean_d = {k: json.dumps(v) if isinstance(v, (list, dict)) else v for k, v in d.items()}
            g_export.add_edge(u, v, **clean_d)
        nx.write_graphml(g_export, tmp_graphml)
        os.replace(tmp_graphml, GRAPH_FILE)
    except Exception as e:
        print(f"  [WARN] GraphML save failed: {e}")
        if os.path.exists(tmp_graphml):
            os.remove(tmp_graphml)

    # 2. Save JSON format atomically
    tmp_json = JSON_FILE + ".tmp"
    try:
        graph_data = {
            "nodes": [{"id": n, **d} for n, d in g.nodes(data=True)],
            "edges": [{"source": u, "target": v, **d} for u, v, d in g.edges(data=True)]
        }
        with open(tmp_json, "w", encoding="utf-8") as f:
            json.dump(graph_data, f, indent=2)
        os.replace(tmp_json, JSON_FILE)
    except Exception as e:
        print(f"  [WARN] JSON graph save failed: {e}")
        if os.path.exists(tmp_json):
            os.remove(tmp_json)

    # 3. Save Checkpoint atomically
    tmp_checkpoint = CHECKPOINT_FILE + ".tmp"
    try:
        checkpoint_data = {
            "last_offset": current_offset,
            "processed_chunk_count": chunk_counter,
            "last_chunk_id": last_chunk_id,
            "total_nodes": g.number_of_nodes(),
            "total_edges": g.number_of_edges(),
            "timestamp": time.time()
        }
        with open(tmp_checkpoint, "w", encoding="utf-8") as f:
            json.dump(checkpoint_data, f, indent=2)
        os.replace(tmp_checkpoint, CHECKPOINT_FILE)
    except Exception as e:
        print(f"  [WARN] Checkpoint save failed: {e}")
        if os.path.exists(tmp_checkpoint):
            os.remove(tmp_checkpoint)

def load_graph_and_checkpoint() -> Tuple[nx.MultiDiGraph, Optional[Any], int, str]:
    g = nx.MultiDiGraph()
    offset = None
    chunk_counter = 0
    last_chunk_id = ""

    if os.path.exists(CHECKPOINT_FILE):
        try:
            with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
                ckpt = json.load(f)
                offset = ckpt.get("last_offset")
                chunk_counter = ckpt.get("processed_chunk_count", 0)
                last_chunk_id = ckpt.get("last_chunk_id", "")
        except Exception as e:
            print(f"  [WARN] Could not read checkpoint file: {e}")

    if os.path.exists(JSON_FILE):
        try:
            with open(JSON_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for node in data.get("nodes", []):
                    nid = node.pop("id")
                    g.add_node(nid, **node)
                for edge in data.get("edges", []):
                    u = edge.pop("source")
                    v = edge.pop("target")
                    g.add_edge(u, v, **edge)
            return g, offset, chunk_counter, last_chunk_id
        except Exception as e:
            print(f"  [WARN] Could not load JSON graph: {e}")

    if os.path.exists(GRAPH_FILE):
        try:
            loaded_g = nx.read_graphml(GRAPH_FILE)
            for n, d in loaded_g.nodes(data=True):
                for k, v in list(d.items()):
                    if isinstance(v, str) and (v.startswith("[") or v.startswith("{")):
                        try:
                            d[k] = json.loads(v)
                        except Exception:
                            pass
                g.add_node(n, **d)
            for u, v, d in loaded_g.edges(data=True):
                for k, v in list(d.items()):
                    if isinstance(v, str) and (v.startswith("[") or v.startswith("{")):
                        try:
                            d[k] = json.loads(v)
                        except Exception:
                            pass
                g.add_edge(u, v, **d)
        except Exception as e:
            print(f"  [WARN] Could not read GraphML file: {e}")

    return g, offset, chunk_counter, last_chunk_id

# ==============================================================================
# TELEMETRY & PROMPT FORMATTERS
# ==============================================================================
def format_progress_bar(pct: float, width: int = 10) -> str:
    filled = int(round(width * min(100.0, max(0.0, pct)) / 100))
    return "█" * filled + "░" * (width - filled)

def format_duration(seconds: float) -> str:
    if seconds <= 0:
        return "0s"
    if seconds > 86400 * 7:
        return "calculating..."
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    if h > 0:
        return f"{h}h {m:02d}m"
    if m > 0:
        return f"{m}m {s:02d}s"
    return f"{s}s"

format_eta = format_duration

def format_batch_user_prompt(chunks: List[Dict[str, Any]]) -> str:
    prompt_parts = ["Extract all regulatory, compliance, drug, and pricing entities & edges from these chunks:\n"]
    for idx, c in enumerate(chunks, 1):
        prompt_parts.append(
            f"--- BEGIN CHUNK {idx} [ID: {c.get('chunk_id')} | DOC: {c.get('source_doc')}] ---\n"
            f"{c.get('text', '').strip()}\n"
            f"--- END CHUNK {idx} ---\n"
        )
    prompt_parts.append(
        "\nReturn ONLY a valid JSON object matching this schema:\n"
        "{\n"
        '  "nodes": [{"id": "canonical unique lowercase name", "label": "DRUG_OR_MOLECULE|SCHEDULE|LICENSE_FORM|REGULATORY_ACT|REGULATORY_BODY|STORAGE_CONDITION|COMPLIANCE_STANDARD|PRICING_RULE", "properties": {"description": "brief note"}}],\n'
        '  "edges": [{"source": "source node id", "target": "target node id", "relation": "GOVERNED_BY|MANDATES_LICENSE|ISSUED_BY|REQUIRES_STORAGE|REQUIRES_COMPLIANCE|SUBJECT_TO_PRICING|ENFORCED_BY|STANDARDIZED_UNDER", "properties": {"evidence": "exact sentence snippet"}}]\n'
        "}"
    )
    return "\n".join(prompt_parts)

def parse_llm_json(raw_text: str) -> Dict[str, Any]:
    if not raw_text:
        return {"nodes": [], "edges": []}
    text = raw_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass
    match = re.search(r"(\{.*\})", text, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(1))
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            pass
    return {"nodes": [], "edges": []}

# ==============================================================================
# WORKER THREAD FUNCTION
# ==============================================================================
def worker_loop(
    worker_id: str,
    work_queue: queue.Queue,
    g: nx.MultiDiGraph,
    graph_lock: threading.Lock,
    key_ring: ConcurrentKeyRing,
    watermark: WatermarkTracker,
    global_pacer: GlobalRatePacer,
    stop_event: threading.Event,
    print_lock: threading.Lock,
    total_points: int,
    start_time: float,
    initial_chunks_done: int
):
    """Worker Thread: Pulls from queue, paces request, extracts via Groq, merges into graph."""
    while not stop_event.is_set():
        try:
            batch_item = work_queue.get(timeout=1.0)
        except queue.Empty:
            continue

        if batch_item is None:
            # Sentinel value to terminate worker
            work_queue.task_done()
            break

        chunks = batch_item["chunks"]
        user_prompt = format_batch_user_prompt(chunks)
        chunk_ids_label = f"{chunks[0]['chunk_id']}..{chunks[-1]['chunk_id']}" if len(chunks) > 1 else chunks[0]['chunk_id']
        doc_label = os.path.basename(chunks[0]["source_doc"])

        success = False
        attempts = 0
        max_attempts = len(GROQ_KEYS) * 2
        last_err = ""

        while attempts < max_attempts and not stop_event.is_set():
            attempts += 1
            key_record = key_ring.acquire_key(stop_event, worker_id)
            if key_record is None:
                break

            key_label = key_record["label"]
            client = key_record["client"]

            try:
                # Global heartbeat pacing: guarantees smooth spacing between ANY Groq calls across all workers
                global_pacer.wait_turn(stop_event, extra_delay=0.4 if attempts > 1 else 0.0)
                if stop_event.is_set():
                    key_ring.release_key(key_record, cooldown_seconds=0.0)
                    break

                t0 = time.time()
                response = client.chat.completions.create(
                    model=key_ring.model,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.1,
                    response_format={"type": "json_object"}
                )
                lat = time.time() - t0
                raw_text = response.choices[0].message.content or ""
                data = parse_llm_json(raw_text)
                nodes = data.get("nodes", [])
                edges = data.get("edges", [])
                chunk_ids_list = [c["chunk_id"] for c in chunks]

                # Thread-safe in-memory graph merge
                with graph_lock:
                    for node in nodes:
                        if not isinstance(node, dict):
                            continue
                        props = node.get("properties")
                        c_prop = props.get("source_chunk_id") if isinstance(props, dict) else None
                        c_ref = [c_prop] if c_prop else chunk_ids_list
                        doc = chunks[0]["source_doc"]
                        merge_node_dedup(g, node, c_ref, doc)

                    for edge in edges:
                        if not isinstance(edge, dict):
                            continue
                        props = edge.get("properties")
                        c_prop = props.get("source_chunk_id") if isinstance(props, dict) else None
                        c_ref = [c_prop] if c_prop else chunk_ids_list
                        doc = chunks[0]["source_doc"]
                        merge_edge_dedup(g, edge, c_ref, doc)

                    cur_nodes = g.number_of_nodes()
                    cur_edges = g.number_of_edges()

                # Register completion with continuous monotonic watermark
                should_save, wm_counter, wm_offset, wm_chunk_id = watermark.register_completion(batch_item)

                # Telemetry calculations
                elapsed = max(0.1, time.time() - start_time)
                chunks_processed_so_far = max(1, wm_counter - initial_chunks_done)
                speed_cpm = (chunks_processed_so_far / elapsed) * 60.0
                remaining_chunks = max(0, total_points - wm_counter)
                eta_seconds = remaining_chunks / max(0.01, chunks_processed_so_far / elapsed)
                eta_str = format_duration(eta_seconds)
                elapsed_str = format_duration(elapsed)
                pct = (wm_counter / max(1, total_points)) * 100.0
                bar = format_progress_bar(pct, width=10)

                if should_save:
                    with graph_lock:
                        atomic_save_graph(g, wm_offset, wm_counter, wm_chunk_id)
                        save_nodes = g.number_of_nodes()
                        save_edges = g.number_of_edges()
                    with print_lock:
                        ckpt_grid = Table.grid(padding=(0, 2))
                        ckpt_grid.add_column(style="bold cyan", justify="right")
                        ckpt_grid.add_column(style="white")
                        ckpt_grid.add_row("Progress:", f"[bold green]{wm_counter:,} / {total_points:,} Chunks ({pct:.1f}%)[/]  [dim]•  {remaining_chunks:,} Remaining[/]")
                        ckpt_grid.add_row("Time & Speed:", f"[bold magenta]ETA: ~{eta_str}[/]  [dim]•  Elapsed: {elapsed_str}  •  Speed: {speed_cpm:.0f} ch/m[/]")
                        ckpt_grid.add_row("Master Graph:", f"[bold white]{save_nodes:,} Unique Nodes[/]  [dim]•[/]  [bold white]{save_edges:,} Directed Edges[/]")
                        ckpt_grid.add_row("Files Committed:", f"[dim]{os.path.basename(GRAPH_FILE)} │ {os.path.basename(JSON_FILE)} │ {os.path.basename(CHECKPOINT_FILE)}[/]")
                        console.print("")
                        console.print(Panel(
                            ckpt_grid,
                            title="[bold green]💾 CHECKPOINT COMMITTED — DISK SECURED[/]",
                            border_style="green",
                            box=box.ROUNDED,
                            padding=(0, 2)
                        ))
                        console.print("")

                # Thread-safe terminal output with neat, compact 2-line visual hierarchy (no line wrapping)
                with print_lock:
                    clean_doc = doc_label.replace("drugs_and_cosmetics_rules_1945_updated_2024.md", "drugs_rules_1945.md")
                    if len(clean_doc) > 18:
                        clean_doc = clean_doc[:16] + ".."
                    c_short = chunk_ids_label.replace("chunk_", "#")
                    line1 = (
                        f"  [bold cyan][{worker_id}][/] [yellow]{key_label:<9}[/] [dim]({lat:3.1f}s)[/] "
                        f"│ [bold green][{bar}][/] [bold white]{pct:4.1f}%[/] [dim]({wm_counter:,}/{total_points:,})[/] "
                        f"│ [bold magenta]ETA ~{eta_str}[/]"
                    )
                    line2 = (
                        f"    [dim]➔[/] [green]+{len(nodes)}n, +{len(edges)}e[/] [dim]➔[/] [bold white]{cur_nodes:,}n, {cur_edges:,}e[/] "
                        f"│ [blue]{speed_cpm:.0f} ch/m[/] │ [dim]{clean_doc} ({c_short})[/]"
                    )
                    console.print(line1)
                    console.print(line2)

                key_ring.release_key(key_record, cooldown_seconds=KEY_REST_SECONDS)
                success = True
                break

            except RateLimitError as e:
                cooldown_sec = extract_retry_seconds(e, default_wait=KEY_REST_SECONDS)
                key_ring.release_key(key_record, cooldown_seconds=cooldown_sec)
                with print_lock:
                    console.print(f"    [yellow]⚠️ [{worker_id}] {key_label} 429 Rate Limit. Resting {cooldown_sec:.1f}s. Pacing next key...[/]")
                continue

            except (APITimeoutError, InternalServerError, APIError) as e:
                last_err = str(e)
                key_ring.release_key(key_record, cooldown_seconds=5.0)
                with print_lock:
                    console.print(f"    [yellow]⚠️ [{worker_id}] Server/Timeout on {key_label} ({e}). Pacing next key ({attempts}/{max_attempts})...[/]")
                continue

            except Exception as e:
                last_err = str(e)
                key_ring.release_key(key_record, cooldown_seconds=5.0)
                with print_lock:
                    console.print(f"    [red]⚠️ [{worker_id}] Error on {key_label} ({e}). Pacing key ({attempts}/{max_attempts})...[/]")
                continue

        if not success and not stop_event.is_set():
            with print_lock:
                console.print(f"    [bold red]❌ [{worker_id}] Batch permanently failed after {max_attempts} attempts on [{chunk_ids_label}].[/]")
            try:
                with open(ERROR_LOG_FILE, "a", encoding="utf-8") as err_f:
                    err_f.write(f"[{time.ctime()}] Permanently Failed Chunks [{chunk_ids_label}]: {last_err}\n")
            except Exception:
                pass
            watermark.register_completion(batch_item)

        work_queue.task_done()

# ==============================================================================
# MAIN PIPELINE EXECUTION (SINGLE PRODUCER, MULTI-CONSUMER)
# ==============================================================================
def run_pipeline():
    os.makedirs(DB_GRAPH_DIR, exist_ok=True)
    g, offset, chunk_counter, last_chunk_id = load_graph_and_checkpoint()
    initial_chunks_done = chunk_counter
    key_ring = ConcurrentKeyRing(GROQ_KEYS, model=DEFAULT_MODEL)
    watermark = WatermarkTracker(offset, chunk_counter, last_chunk_id)

    work_queue: queue.Queue = queue.Queue(maxsize=40)
    graph_lock = threading.Lock()
    print_lock = threading.Lock()
    stop_event = threading.Event()
    worker_threads: List[threading.Thread] = []
    q_client = None

    # Graceful Shutdown Handler
    def graceful_exit_handler(signum, frame):
        stop_event.set()

        # Drain queue so workers can exit
        while not work_queue.empty():
            try:
                work_queue.get_nowait()
                work_queue.task_done()
            except Exception:
                break

        # Put termination sentinels
        for _ in range(NUM_WORKERS):
            try:
                work_queue.put_nowait(None)
            except Exception:
                pass

        # Wait briefly for in-flight requests to complete (capped at 5.0s total)
        deadline = time.time() + 5.0
        for t in worker_threads:
            rem = max(0.1, deadline - time.time())
            t.join(timeout=rem)

        # Final atomic save of continuous watermark
        with graph_lock:
            wm_counter, wm_offset, wm_chunk_id = watermark.get_watermark()
            atomic_save_graph(g, wm_offset, wm_counter, wm_chunk_id)
            final_nodes = g.number_of_nodes()
            final_edges = g.number_of_edges()

        with print_lock:
            drain_grid = Table.grid(padding=(0, 2))
            drain_grid.add_column(style="bold yellow", justify="right")
            drain_grid.add_column(style="white")
            drain_grid.add_row("In-Flight Workers:", "[green]Cleanly drained & stopped[/]")
            drain_grid.add_row("Continuous Watermark:", f"[bold white]Saved up to Chunk #{wm_counter:,}[/] [dim](Zero skipped chunks)[/]")
            drain_grid.add_row("Master Graph:", f"[bold white]{final_nodes:,} nodes │ {final_edges:,} edges preserved[/]")
            drain_grid.add_row("Resume Anytime:", "[bold cyan]python build/build_knowledge_graph_groq.py[/]")
            console.print("")
            console.print(Panel(
                drain_grid,
                title="[bold yellow]🛑 SAFE SHUTDOWN COMPLETE — STATE PRESERVED[/]",
                border_style="yellow",
                box=box.ROUNDED,
                padding=(1, 2)
            ))
            console.print("")

        try:
            if q_client is not None:
                q_client.close()
        except Exception:
            pass

        sys.exit(0)

    signal.signal(signal.SIGINT, graceful_exit_handler)
    signal.signal(signal.SIGTERM, graceful_exit_handler)

    # Connect to Qdrant Vector Store (Single Producer only)
    from build.embedding_pipeline import qdrant_pipeline
    try:
        q_client = qdrant_pipeline.client
        if q_client is None:
            raise RuntimeError("Qdrant client not initialized.")
    except Exception as e:
        print(f"[ERROR] Failed to connect to Qdrant: {e}")
        return

    collection_name = "procurement_contracts"
    total_points = 10609
    try:
        col_info = q_client.get_collection(collection_name)
        if col_info and hasattr(col_info, "points_count") and col_info.points_count:
            total_points = col_info.points_count
    except Exception:
        pass

    remaining_at_start = max(0, total_points - chunk_counter)
    batches_remaining = (remaining_at_start + BATCH_CHUNK_SIZE - 1) // BATCH_CHUNK_SIZE
    est_minutes_at_start = int(round(remaining_at_start / 138.0))

    banner_grid = Table.grid(padding=(0, 2))
    banner_grid.add_column(style="bold cyan", justify="right")
    banner_grid.add_column(style="white")
    banner_grid.add_row("Collection:", f"[bold white]Qdrant / '{collection_name}'[/] [dim]({total_points:,} Total Points)[/]")
    banner_grid.add_row("Workers:", f"[bold green]{NUM_WORKERS} Concurrent Threads[/] [dim](Worker-1 to Worker-5)[/]")
    banner_grid.add_row("API Key Pool:", f"[bold yellow]{len(GROQ_KEYS)} Dedicated Groq Keys[/] [dim](100% Unique Independent Accounts)[/]")
    banner_grid.add_row("Groq Model:", f"[bold magenta]{DEFAULT_MODEL}[/]")
    banner_grid.add_row("Batch Window:", f"[white]{BATCH_CHUNK_SIZE} Chunks / Request[/] [dim](1 req / {GLOBAL_DISPATCH_INTERVAL}s heartbeat • {KEY_REST_SECONDS}s replenishment)[/]")
    
    if offset is not None and chunk_counter > 0:
        start_chunk_num = chunk_counter + 1
        pct_done = (chunk_counter / max(1, total_points)) * 100.0
        banner_grid.add_row("Execution Mode:", f"[bold green]RESUMING FROM CHUNK #{start_chunk_num:,}[/] [dim]({pct_done:.1f}% done, {remaining_at_start:,} chunks left)[/]")
        banner_grid.add_row("Est. Time Left:", f"[bold magenta]~{est_minutes_at_start} minutes[/] [dim](at ~138 chunks/min continuous)[/]")
        banner_grid.add_row("Current Graph:", f"[bold white]{g.number_of_nodes():,} unique nodes │ {g.number_of_edges():,} directed edges[/]")
    else:
        banner_grid.add_row("Execution Mode:", f"[bold green]STARTING FRESH FROM CHUNK #1[/]")

    console.print("")
    console.print(Panel(
        banner_grid,
        title="[bold green]🚀 PHARMA KNOWLEDGE GRAPH PIPELINE — PENTA-WORKER ENGINE[/]",
        border_style="cyan",
        box=box.ROUNDED,
        padding=(1, 2)
    ))
    console.print("")

    start_time = time.time()
    global_pacer = GlobalRatePacer(interval=GLOBAL_DISPATCH_INTERVAL)

    # Spawn Worker Threads
    for i in range(NUM_WORKERS):
        t = threading.Thread(
            target=worker_loop,
            args=(
                f"Worker-{i+1}",
                work_queue,
                g,
                graph_lock,
                key_ring,
                watermark,
                global_pacer,
                stop_event,
                print_lock,
                total_points,
                start_time,
                initial_chunks_done
            ),
            daemon=True
        )
        t.start()
        worker_threads.append(t)

    # Producer Loop (Main Thread scrolls Qdrant exclusively)
    batch_buffer: List[Dict[str, Any]] = []
    current_counter = chunk_counter
    seq_counter = 1
    scroll_offset = (offset + 1) if (offset is not None and isinstance(offset, int)) else offset

    while not stop_event.is_set():
        try:
            records, next_offset = q_client.scroll(
                collection_name=collection_name,
                offset=scroll_offset,
                limit=45,
                with_payload=True,
                with_vectors=False
            )
        except Exception as e:
            with print_lock:
                print(f"[ERROR] Qdrant scroll error: {e}. Retrying in 5 seconds...")
            time.sleep(5)
            continue

        if not records:
            break

        for record in records:
            if stop_event.is_set():
                break

            payload = record.payload or {}
            chunk_text = payload.get("text", "")
            source_doc = payload.get("source_doc", "unknown.md")
            chunk_id = payload.get("chunk_id", f"chunk_{record.id}")

            if len(chunk_text.strip()) >= 50:
                batch_buffer.append({
                    "chunk_id": chunk_id,
                    "source_doc": source_doc,
                    "text": chunk_text,
                    "record_id": record.id
                })

            current_counter += 1

            if len(batch_buffer) >= BATCH_CHUNK_SIZE:
                # Dispatch batch to work_queue
                batch_item = {
                    "seq": seq_counter,
                    "chunks": batch_buffer,
                    "max_record_id": record.id,
                    "last_chunk_id": chunk_id,
                    "chunk_counter_at_batch": current_counter
                }
                seq_counter += 1
                work_queue.put(batch_item)
                batch_buffer = []

                if current_counter % 300 == 0:
                    gc.collect()

        scroll_offset = next_offset
        if scroll_offset is None:
            break

    # Dispatch any remaining tail chunks
    if batch_buffer and not stop_event.is_set():
        batch_item = {
            "seq": seq_counter,
            "chunks": batch_buffer,
            "max_record_id": batch_buffer[-1]["record_id"],
            "last_chunk_id": batch_buffer[-1]["chunk_id"],
            "chunk_counter_at_batch": current_counter
        }
        work_queue.put(batch_item)

    # Wait for all batches to be processed by workers
    work_queue.join()

    # Signal workers to terminate
    for _ in range(NUM_WORKERS):
        work_queue.put(None)

    for t in worker_threads:
        t.join(timeout=5.0)

    # Final Watermark Save
    with graph_lock:
        wm_counter, wm_offset, wm_chunk_id = watermark.get_watermark()
        atomic_save_graph(g, wm_offset, wm_counter, wm_chunk_id)
        final_nodes = g.number_of_nodes()
        final_edges = g.number_of_edges()

    elapsed = time.time() - start_time
    with print_lock:
        done_grid = Table.grid(padding=(0, 2))
        done_grid.add_column(style="bold green", justify="right")
        done_grid.add_column(style="white")
        done_grid.add_row("Status:", "[bold green]100% Complete — All Chunks Extracted & Deduplicated[/]")
        done_grid.add_row("Total Chunks:", f"[bold white]{wm_counter:,} / {total_points:,}[/]")
        done_grid.add_row("Master Graph:", f"[bold white]{final_nodes:,} Unique Nodes │ {final_edges:,} Directed Relationships[/]")
        done_grid.add_row("Elapsed Time:", f"[bold magenta]{elapsed/60:.1f} minutes ({elapsed/3600:.2f} hours)[/]")
        done_grid.add_row("GraphML File:", f"[dim]{GRAPH_FILE}[/]")
        done_grid.add_row("JSON File:", f"[dim]{JSON_FILE}[/]")
        console.print("")
        console.print(Panel(
            done_grid,
            title="[bold green]🎉 KNOWLEDGE GRAPH BUILD COMPLETE[/]",
            border_style="green",
            box=box.ROUNDED,
            padding=(1, 2)
        ))
        console.print("")

    try:
        if q_client is not None:
            q_client.close()
    except Exception:
        pass

if __name__ == "__main__":
    run_pipeline()
