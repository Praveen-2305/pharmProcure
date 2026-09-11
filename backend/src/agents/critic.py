"""
Critic Agent Node for AutonoSource (POC v2.0).
Self-audits the Risk Scorer's findings.
If confidence score < 0.80 and revision count < max_revisions,
triggers an iterative evidence gathering loop back to Executor.
Otherwise, approves assessment for Report Generation.
"""

from src.agents.state import WorkflowState
from src.models.schemas import WorkflowStage

def critic_agent(state: WorkflowState) -> WorkflowState:
    """
    Audits evidence completeness and confidence score.
    """
    print("--- CRITIC AGENT: Auditing evidence completeness ---")
    
    assessment = state.get("riskAssessment") or state.get("risk_assessment")
    score = getattr(assessment, "confidence_score", 0.75) if assessment else 0.75
    rev_count = state.get("revisionCount", state.get("revision_count", 0))
    max_revs = state.get("maxRevisions", state.get("max_revisions", 3))

    CONFIDENCE_THRESHOLD = 0.80

    if score < CONFIDENCE_THRESHOLD and rev_count < max_revs:
        print(f"[Critic] REJECTED assessment: Confidence {score} is below required threshold ({CONFIDENCE_THRESHOLD}). Initiating revision {rev_count + 1}/{max_revs}.")
        state["revisionCount"] = rev_count + 1
        state["revision_count"] = rev_count + 1
        state["stage"] = WorkflowStage.EXECUTING
        state["criticFeedback"] = f"Confidence {score} below threshold. Gather additional regulatory evidence."
    else:
        if score >= CONFIDENCE_THRESHOLD:
            print(f"[Critic] APPROVED assessment: Confidence {score} meets threshold ({CONFIDENCE_THRESHOLD}). Proceeding to report writing.")
        else:
            print(f"[Critic] MAX REVISIONS REACHED ({max_revs}). Proceeding to report writing with best available confidence ({score}).")
        state["stage"] = WorkflowStage.WRITING_REPORT

    return state
