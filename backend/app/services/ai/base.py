"""Shared scaffolding for AI-powered mail features.

When AI_PROVIDER=anthropic and AI_API_KEY are set, tagging, prioritization,
and quick-reply generation call the Claude API for real output. Without
that configuration (the default), each feature falls back to the
deterministic, rule-based heuristics in tagging.py / prioritization.py /
quick_reply.py so the app is fully usable out of the box. Every AI response
schema carries a `source` field ("ai" or "heuristic") so the frontend can
show which mode produced a given result.
"""

from __future__ import annotations

import json
import logging
from functools import lru_cache

from app.config import get_settings

logger = logging.getLogger("emailhq.ai")

DEFAULT_MODEL = "claude-sonnet-5"


def ai_enabled() -> bool:
    settings = get_settings()
    return bool(
        settings.ai_provider
        and settings.ai_provider.lower() == "anthropic"
        and settings.ai_api_key
    )


def ai_status() -> dict:
    settings = get_settings()
    return {
        "enabled": ai_enabled(),
        "provider": settings.ai_provider or "none",
        "model": settings.ai_model or DEFAULT_MODEL if ai_enabled() else None,
    }


@lru_cache
def _client():
    try:
        from anthropic import AsyncAnthropic
    except ImportError as exc:
        raise RuntimeError(
            "The 'anthropic' package is not installed. Run `pip install anthropic` in the "
            "backend virtualenv to enable live AI features."
        ) from exc

    settings = get_settings()
    return AsyncAnthropic(api_key=settings.ai_api_key)


async def _call_model(system_prompt: str, user_content: str, max_tokens: int = 512) -> str:
    """Send a single-turn request to the configured Claude model, return the text reply."""
    settings = get_settings()
    client = _client()
    model = settings.ai_model or DEFAULT_MODEL

    response = await client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": user_content}],
    )
    return "".join(block.text for block in response.content if block.type == "text")


async def call_model_json(system_prompt: str, user_content: str, max_tokens: int = 512) -> dict:
    """Call the model expecting a single JSON object back, and parse it.

    Raises on any failure (not configured, network error, malformed JSON) so
    callers can catch and fall back to their heuristic implementation.
    """
    if not ai_enabled():
        raise RuntimeError("AI provider is not configured")

    raw = await _call_model(
        system_prompt + "\n\nRespond with ONLY a single valid JSON object, no prose, no markdown fences.",
        user_content,
        max_tokens=max_tokens,
    )
    text = raw.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        logger.warning("AI response was not valid JSON: %s", text[:200])
        raise RuntimeError("Model returned malformed JSON") from exc
