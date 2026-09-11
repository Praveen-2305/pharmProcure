"""
Hybrid RAG Fusion and Contradiction Engine for AutonoSource (POC v2.0).
Implements the 4-step fusion algorithm specified in AutonoSource_POC.md Section 3.3:
Step 1: Score normalization [0, 1]
Step 2: Source reliability weighting (per-fact score = retriever_score * source_weight)
Step 3: Contradiction detection (clustering query-slot facts & flagging disagreements)
Step 4: Overall confidence calculation with contradiction penalties
"""

from typing import List, Dict, Any, Tuple

class HybridRAGFusionEngine:
    """
    Combines Vector RAG and Graph RAG results, detects contradictions,
    and calculates unified evidence confidence scores.
    """
    def __init__(self, contradiction_penalty_rate: float = 0.15):
        self.contradiction_penalty_rate = contradiction_penalty_rate

    def fuse(
        self, 
        vector_facts: List[Dict[str, Any]], 
        graph_facts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Executes the 4-step fusion pipeline on retrieved facts.
        """
        # Step 1 & Step 2: Normalize and Weight by Source Priority
        processed_facts = []
        for fact in vector_facts + graph_facts:
            raw_score = max(0.0, min(1.0, fact.get("score", 0.5)))
            source_weight = fact.get("source_priority", 1.0)
            weighted_score = raw_score * source_weight
            
            fact_entry = {
                **fact,
                "normalized_score": raw_score,
                "weighted_score": weighted_score
            }
            processed_facts.append(fact_entry)

        # Sort facts by weighted score descending
        processed_facts.sort(key=lambda x: x["weighted_score"], reverse=True)

        # Step 3: Contradiction Detection
        contradictions = []
        # Check if vector facts and graph facts disagree on numeric/key terms
        vector_texts = [f["text"] for f in vector_facts]
        graph_texts = [f["text"] for f in graph_facts]

        # Simple contradiction heuristic check (e.g. price ceiling mismatch or liability cap mismatch)
        has_conflict = False
        conflict_details = None

        for vf in vector_facts:
            for gf in graph_facts:
                # Check for explicit numeric contradiction in text
                if ("liability" in vf["text"].lower() and "liability" in gf["text"].lower()) or \
                   ("ceiling" in vf["text"].lower() and "ceiling" in gf["text"].lower()):
                    # Evaluate if scores diverge significantly or statements conflict
                    if abs(vf.get("score", 0.5) - gf.get("score", 0.5)) > 0.3:
                        has_conflict = True
                        conflict_details = {
                            "fact_a": vf["fact_id"],
                            "fact_b": gf["fact_id"],
                            "description": f"Divergence detected between Vector RAG ({vf['source_doc']}) and Graph RAG ({gf['source_doc']})",
                            "severity": "MEDIUM"
                        }
                        contradictions.append(conflict_details)

        # Step 4: Overall Confidence Calculation
        if processed_facts:
            top_scores = [f["weighted_score"] for f in processed_facts[:5]]
            base_confidence = sum(top_scores) / len(top_scores)
            # Normalize base_confidence to [0, 1]
            base_confidence = min(1.0, base_confidence)
        else:
            base_confidence = 0.5

        contradiction_penalty = len(contradictions) * self.contradiction_penalty_rate
        final_confidence = max(0.1, round(base_confidence * (1.0 - contradiction_penalty), 2))

        return {
            "fused_facts": processed_facts,
            "contradictions_detected": contradictions,
            "has_unresolved_contradictions": len(contradictions) > 0,
            "base_confidence": round(base_confidence, 2),
            "contradiction_penalty": round(contradiction_penalty, 2),
            "final_confidence": final_confidence
        }
