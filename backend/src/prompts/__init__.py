"""
Prompts package initialization.
AutonoSource Multi-Agent Prompt Engineering Subsystem.
Exports system prompts, rubrics, and dynamic prompt formatters for all LangGraph agents.
"""

from src.prompts.planner_prompt import PLANNER_SYSTEM_PROMPT, get_planner_prompt
from src.prompts.scraper_prompt import SCRAPER_SYSTEM_PROMPT, get_scraper_prompt
from src.prompts.scorer_prompt import SCORER_SYSTEM_PROMPT, get_scorer_prompt
from src.prompts.critic_prompt import CRITIC_SYSTEM_PROMPT, get_critic_prompt
from src.prompts.writer_prompt import WRITER_SYSTEM_PROMPT, get_writer_prompt
from src.prompts.graph_extraction_prompt import GRAPH_EXTRACTION_SYSTEM_PROMPT

__all__ = [
    "PLANNER_SYSTEM_PROMPT",
    "get_planner_prompt",
    "SCRAPER_SYSTEM_PROMPT",
    "get_scraper_prompt",
    "SCORER_SYSTEM_PROMPT",
    "get_scorer_prompt",
    "CRITIC_SYSTEM_PROMPT",
    "get_critic_prompt",
    "WRITER_SYSTEM_PROMPT",
    "get_writer_prompt",
    "GRAPH_EXTRACTION_SYSTEM_PROMPT",
]
