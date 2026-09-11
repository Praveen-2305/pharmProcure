from langgraph.graph import StateGraph, END
from workflow.state import WorkflowState
from agents.planner import planner_agent
from agents.executor import executor_agent
from agents.scorer import risk_scorer_agent
from agents.critic import critic_agent
from agents.reporter import report_writer_agent

def should_loop_or_report(state: WorkflowState) -> str:
    """Conditional edge after critic."""
    if state["stage"] == "EXECUTING":
        return "executor"
    return "report_writer"

def create_procurement_workflow() -> StateGraph:
    """
    Constructs the AutonoSource Multi-Agent Workflow.
    """
    workflow = StateGraph(WorkflowState)
    
    # Add Nodes
    workflow.add_node("planner", planner_agent)
    workflow.add_node("executor", executor_agent)
    workflow.add_node("risk_scorer", risk_scorer_agent)
    workflow.add_node("critic", critic_agent)
    workflow.add_node("report_writer", report_writer_agent)
    
    # Define Edges
    workflow.set_entry_point("planner")
    workflow.add_edge("planner", "executor")
    workflow.add_edge("executor", "risk_scorer")
    workflow.add_edge("risk_scorer", "critic")
    
    # Conditional edge from critic
    workflow.add_conditional_edges(
        "critic",
        should_loop_or_report,
        {
            "executor": "executor",
            "report_writer": "report_writer"
        }
    )
    
    # End edge
    workflow.add_edge("report_writer", END)
    
    return workflow.compile()
