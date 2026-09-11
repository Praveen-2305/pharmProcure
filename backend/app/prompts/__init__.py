"""
Prompts package initialization.
Exports system prompts and prompt formatters for all pipeline agents.
"""

from app.prompts.planner_prompt import PLANNER_SYSTEM_PROMPT, get_planner_prompt
from app.prompts.graph_extraction_prompt import GRAPH_EXTRACTION_SYSTEM_PROMPT
from app.prompts.critic_prompt import CRITIC_SYSTEM_PROMPT, get_critic_prompt
from app.prompts.writer_prompt import WRITER_SYSTEM_PROMPT

__all__ = [
    "PLANNER_SYSTEM_PROMPT",
    "get_planner_prompt",
    "GRAPH_EXTRACTION_SYSTEM_PROMPT",
    "CRITIC_SYSTEM_PROMPT",
    "get_critic_prompt",
    "WRITER_SYSTEM_PROMPT",
]
