"""
LangGraph Multi-Agent Workflow Engine for AutonoSource (pharmProcure).
Constructs the stateful StateGraph connecting:
Planner -> Executor -> Risk Scorer -> Critic -> (loop) -> Report Writer
"""

from langgraph.graph import StateGraph, END
from app.agents.state import WorkflowState
from app.agents.planner import planner_agent
from app.agents.executor import executor_agent
from app.agents.scorer import risk_scorer_agent
from app.agents.critic import critic_agent
from app.agents.writer import report_writer_agent
from app.models.schemas import WorkflowStage

def should_reinvestigate(state: WorkflowState) -> str:
    """
    Conditional edge logic after Critic evaluation.
    Loops back to Executor if Critic requested revision, else advances to Report Writer.
    """
    stage = state.get("stage")
    if stage == WorkflowStage.EXECUTING or stage == "EXECUTING":
        return "executor"
    return "report_writer"

def create_procurement_workflow():
    """
    Builds and compiles the multi-agent LangGraph workflow.
    """
    workflow = StateGraph(WorkflowState)

    # 1. Add Agent Nodes
    workflow.add_node("planner", planner_agent)
    workflow.add_node("executor", executor_agent)
    workflow.add_node("risk_scorer", risk_scorer_agent)
    workflow.add_node("critic", critic_agent)
    workflow.add_node("report_writer", report_writer_agent)

    # 2. Add Fixed Directed Edges
    workflow.set_entry_point("planner")
    workflow.add_edge("planner", "executor")
    workflow.add_edge("executor", "risk_scorer")
    workflow.add_edge("risk_scorer", "critic")

    # 3. Add Conditional Edge for Critic Loop
    workflow.add_conditional_edges(
        "critic",
        should_reinvestigate,
        {
            "executor": "executor",
            "report_writer": "report_writer"
        }
    )

    # 4. Final Edge to END
    workflow.add_edge("report_writer", END)

    return workflow.compile()
