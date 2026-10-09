from typing import Any

from langchain_core.runnables import Runnable
from langchain_google_genai.chat_models import (
    GoogleAPIError,
    GoogleRateLimitError,
)


# Errors that normally indicate Gemini may recover if we try again.
RETRYABLE_EXCEPTIONS = (
    GoogleRateLimitError,
    GoogleAPIError,
    TimeoutError,
    ConnectionError,
)

def make_resilient_llm(
        primary_llm:Runnable,
        fallback_llms:list[Runnable],
)-> Runnable:
    """
    Creates a resilient LLM that uses a primary LLM and falls back to a secondary LLM in case of failure.

    Args:
        primary_llm (Runnables): The primary LLM to use.
        fallback_llms (list[Runnables]): The fallback LLMs to use in case the primary fails.

    Returns:
        Runnables: A resilient LLM that uses the primary and fallback LLMs.
    """
    return (primary_llm.with_retry( stop_after_attempt=2, retry_if_exception_type=RETRYABLE_EXCEPTIONS,
        wait_exponential_jitter=True,).with_fallbacks(fallback_llms,exceptions_to_handle=RETRYABLE_EXCEPTIONS,))