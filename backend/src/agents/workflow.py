"""
LangGraph Multi-Agent Workflow Engine for AutonoSource (pharmProcure).
Constructs the stateful StateGraph connecting:
Planner -> [RAG Node, Scraper Node] (Parallel) -> Risk Scorer -> Critic -> (loop) -> Report Writer
"""

from typing import List
from langgraph.graph import StateGraph, END
from src.agents.state import WorkflowState
from src.agents.planner import planner_agent
from src.agents.rag_agent import rag_node_agent
from src.agents.scraper_agent import scraper_node_agent
from src.agents.scorer import risk_scorer_agent
from src.agents.critic import critic_agent
from src.agents.writer import report_writer_agent
from src.models.schemas import WorkflowStage

def should_reinvestigate(state: WorkflowState) -> str:
    """
    Conditional edge logic after Critic evaluation.
    Loops back to Executor (now parallel nodes) if Critic requested revision.
    """
    stage = state.get("stage")
    if stage == WorkflowStage.EXECUTING or stage == "EXECUTING":
        return ["rag_node", "scraper_node"]
    return "report_writer"

def route_planner(state: WorkflowState) -> List[str]:
    """
    Routes from Planner based on chosen InvestigationPlan.
    LIGHT -> skips execution, goes straight to Risk Scorer.
    FULL -> fans out to RAG and Scraper nodes in parallel.
    """
    plan = state.get("investigation_plan")
    if plan == "LIGHT":
        return ["risk_scorer"]
    return ["rag_node", "scraper_node"]

def create_procurement_workflow():
    """
    Builds and compiles the multi-agent LangGraph workflow with independent parallel nodes.
    """
    workflow = StateGraph(WorkflowState)

    # 1. Add Agent Nodes
    workflow.add_node("planner", planner_agent)
    workflow.add_node("rag_node", rag_node_agent)
    workflow.add_node("scraper_node", scraper_node_agent)
    workflow.add_node("risk_scorer", risk_scorer_agent)
    workflow.add_node("critic", critic_agent)
    workflow.add_node("report_writer", report_writer_agent)

    # 2. Add Directed & Conditional Edges
    workflow.set_entry_point("planner")
    
    workflow.add_conditional_edges("planner", route_planner)
    
    # Fan-in from parallel nodes to the Scorer
    workflow.add_edge("rag_node", "risk_scorer")
    workflow.add_edge("scraper_node", "risk_scorer")
    
    workflow.add_edge("risk_scorer", "critic")

    # 3. Add Conditional Edge for Critic Loop
    # If a revision is needed, we trigger the parallel nodes again
    workflow.add_conditional_edges("critic", should_reinvestigate)

    # 4. Final Edge to END
    workflow.add_edge("report_writer", END)

    return workflow.compile()
