"""
Prompts package initialization.
Exports system prompts and prompt formatters for all pipeline agents.
"""

from src.prompts.planner_prompt import PLANNER_SYSTEM_PROMPT, get_planner_prompt
from src.prompts.graph_extraction_prompt import GRAPH_EXTRACTION_SYSTEM_PROMPT
from src.prompts.critic_prompt import CRITIC_SYSTEM_PROMPT, get_critic_prompt
from src.prompts.writer_prompt import WRITER_SYSTEM_PROMPT

__all__ = [
    "PLANNER_SYSTEM_PROMPT",
    "get_planner_prompt",
    "GRAPH_EXTRACTION_SYSTEM_PROMPT",
    "CRITIC_SYSTEM_PROMPT",
    "get_critic_prompt",
    "WRITER_SYSTEM_PROMPT",
]
