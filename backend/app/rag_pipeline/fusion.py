"""
Pure 4-Step Fusion & Contradiction Resolution Engine for AutonoSource (pharmProcure).
Sourced from AutonoSource_Backend_Specification.md Section 5.3.

Algorithm:
Step 1 — Normalize:
    vector_score = cosine_similarity [0, 1]
    graph_score  = 1 / (1 + path_length)

Step 2 — Weight by source reliability:
    final_score = normalized_score * source_priority.get(source_doc, 0.5)

Step 3 — Contradiction detection:
    Cluster facts by subject/semantic similarity.
    If two facts' values/assertions conflict:
        - higher final_score fact -> isPrimary = True
        - lower final_score fact  -> contradictionFlag = True, conflictsWith = <primary's factId>
    Do NOT discard the losing fact. Do NOT average the two values.

Step 4 — Confidence calculation:
    overall_confidence = weighted_avg(primary_fact_scores) * (1 - contradiction_penalty)
"""

from typing import List, Dict, Optional, Any
from dataclasses import dataclass
from app.models.schemas import RankedFact, RankedContext

@dataclass
class VectorHit:
    text: str
    cosine_similarity: float
    source_doc: str
    fact_id: Optional[str] = None

@dataclass
class GraphHit:
    text: str
    path_length: int
    source_doc: str
    fact_id: Optional[str] = None

DEFAULT_SOURCE_PRIORITY: Dict[str, float] = {
    "drugs_and_cosmetics_act_1940.pdf": 1.0,
    "schedule_m_gmp.pdf": 1.0,
    "who_trs1025_annex7_cold_chain.pdf": 0.85,
    "gdp_pharma_guidelines.pdf": 0.85,
    "state_licensing_authorities_directory.pdf": 0.75,
    "alert_all_stakeholders.pdf": 0.7,
    "novo_nordisk_alert.pdf": 0.7,
    "sample_pharma_msa.txt": 0.6,
}

def _detect_contradiction(text_a: str, text_b: str, threshold: float = 0.3) -> bool:
    """
    Evaluates whether two retrieved facts disagree on temperature, ceiling, liability, or compliance limits.
    """
    t_a, t_b = text_a.lower(), text_b.lower()
    
    # Common contradictory domain pairs in pharma procurement
    contradiction_keywords = [
        ("2°c to 8°c", "15°c to 25°c"),
        ("cold chain required", "room temperature permitted"),
        ("schedule m compliant", "schedule m non-compliant"),
        ("dpco compliant", "exceeds dpco ceiling"),
        ("cap at 1.0x", "cap at 1.5x"),
        ("cap at 1.5x", "unlimited liability"),
        ("within ceiling", "exceeds ceiling"),
    ]
    
    for kw1, kw2 in contradiction_keywords:
        if (kw1 in t_a and kw2 in t_b) or (kw2 in t_a and kw1 in t_b):
            return True
            
    # Check conflicting numeric ranges for shared topic keywords
    topics = ["temperature", "liability", "ceiling", "cure period", "indemnity", "expiry"]
    for topic in topics:
        if topic in t_a and topic in t_b:
            # Check if numbers diverge
            words_a = set(t_a.split())
            words_b = set(t_b.split())
            diff = words_a.symmetric_difference(words_b)
            if any(char.isdigit() for char in " ".join(diff)):
                return True
                
    return False

def fuse_retrieval_results(
    vector_results: List[VectorHit],
    graph_results: List[GraphHit],
    source_priority: Optional[Dict[str, float]] = None,
    contradiction_threshold: float = 0.3,
) -> RankedContext:
    """
    Pure, independently unit-testable fusion function.
    Combines Vector RAG and Graph RAG facts, detects contradictions, and computes confidence.
    """
    priority = source_priority or DEFAULT_SOURCE_PRIORITY
    ranked_facts: List[RankedFact] = []
    
    # Process vector hits
    for i, vh in enumerate(vector_results):
        norm_score = max(0.0, min(1.0, float(vh.cosine_similarity)))
        src_weight = priority.get(vh.source_doc, 0.5)
        final_score = round(norm_score * src_weight, 4)
        fact_id = vh.fact_id or f"v_fact_{i+1}"
        
        ranked_facts.append(
            RankedFact(
                fact_id=fact_id,
                text=vh.text,
                source="vector",
                retriever_score=norm_score,
                source_weight=src_weight,
                final_score=final_score,
                is_primary=False,
                contradiction_flag=False,
                conflicts_with=None,
            )
        )
        
    # Process graph hits
    for j, gh in enumerate(graph_results):
        norm_score = max(0.0, min(1.0, 1.0 / (1.0 + max(0, gh.path_length))))
        src_weight = priority.get(gh.source_doc, 0.5)
        final_score = round(norm_score * src_weight, 4)
        fact_id = gh.fact_id or f"g_fact_{j+1}"
        
        ranked_facts.append(
            RankedFact(
                fact_id=fact_id,
                text=gh.text,
                source="graph",
                retriever_score=norm_score,
                source_weight=src_weight,
                final_score=final_score,
                is_primary=False,
                contradiction_flag=False,
                conflicts_with=None,
            )
        )
        
    fallback_to_vector_only = (len(graph_results) == 0)
    
    if not ranked_facts:
        return RankedContext(
            facts=[],
            overall_confidence=0.0,
            fallback_to_vector_only=fallback_to_vector_only
        )

    # Sort descending by final_score
    ranked_facts.sort(key=lambda f: f.final_score, reverse=True)
    
    # Contradiction Resolution
    contradiction_count = 0
    for i in range(len(ranked_facts)):
        for j in range(i + 1, len(ranked_facts)):
            fact_a = ranked_facts[i]
            fact_b = ranked_facts[j]
            
            if _detect_contradiction(fact_a.text, fact_b.text, contradiction_threshold):
                # Both get flagged as involved in conflict
                fact_a.contradiction_flag = True
                fact_b.contradiction_flag = True
                
                # Higher scoring becomes primary, lower gets conflicts_with pointing to primary
                if fact_a.final_score >= fact_b.final_score:
                    fact_a.is_primary = True
                    fact_b.conflicts_with = fact_a.fact_id
                    fact_b.is_primary = False
                else:
                    fact_b.is_primary = True
                    fact_a.conflicts_with = fact_b.fact_id
                    fact_a.is_primary = False
                contradiction_count += 1

    # If no contradictions occurred on the top fact, mark highest score as primary
    if not any(f.is_primary for f in ranked_facts) and ranked_facts:
        ranked_facts[0].is_primary = True

    # Calculate Confidence
    primary_facts = [f for f in ranked_facts if f.is_primary]
    if not primary_facts:
        primary_facts = [ranked_facts[0]]

    # Weighted average of primary fact scores
    avg_primary = sum(f.final_score for f in primary_facts) / len(primary_facts)
    
    # Contradiction penalty scales with number of conflicts (0.15 per conflict, capped at 0.6)
    contradiction_penalty = min(0.60, contradiction_count * 0.15)
    overall_confidence = round(max(0.1, avg_primary * (1.0 - contradiction_penalty)), 4)

    return RankedContext(
        facts=ranked_facts,
        overall_confidence=overall_confidence,
        fallback_to_vector_only=fallback_to_vector_only
    )

class HybridRAGFusionEngine:
    """Compatibility wrapper for existing hybrid retriever calls."""
    def __init__(self, contradiction_penalty_rate: float = 0.15):
        self.contradiction_penalty_rate = contradiction_penalty_rate

    def fuse(self, vector_facts: List[Dict[str, Any]], graph_facts: List[Dict[str, Any]]) -> Dict[str, Any]:
        v_hits = [
            VectorHit(
                text=vf.get("text", ""),
                cosine_similarity=float(vf.get("score", 0.7)),
                source_doc=vf.get("source_doc", "unknown.pdf"),
                fact_id=vf.get("fact_id")
            )
            for vf in vector_facts
        ]
        g_hits = [
            GraphHit(
                text=gf.get("text", ""),
                path_length=int(gf.get("path_length", 1)),
                source_doc=gf.get("source_doc", "Regulatory_Entity_Graph"),
                fact_id=gf.get("fact_id")
            )
            for gf in graph_facts
        ]
        ranked_ctx = fuse_retrieval_results(v_hits, g_hits)
        return {
            "facts": [f.model_dump() for f in ranked_ctx.facts],
            "overall_confidence": ranked_ctx.overall_confidence,
            "has_unresolved_contradictions": any(f.contradiction_flag for f in ranked_ctx.facts),
            "fallback_to_vector_only": ranked_ctx.fallback_to_vector_only,
        }
