"""Smart tagging.

Calls the configured Claude model (when AI_PROVIDER=anthropic + AI_API_KEY
are set) to classify a message into short topical tags. Falls back to
keyword-matching heuristics if AI is not configured or the call fails, so
this endpoint always returns a usable result.
"""

from __future__ import annotations

import logging

from app.schemas.ai import SmartTagRequest, SmartTagResponse
from app.services.ai.base import ai_enabled, call_model_json

logger = logging.getLogger("emailhq.ai.tagging")

_KEYWORD_TAGS: dict[str, tuple[str, ...]] = {
    "invoice": ("Finance",),
    "payment": ("Finance",),
    "receipt": ("Finance",),
    "meeting": ("Scheduling",),
    "calendar": ("Scheduling",),
    "invite": ("Scheduling",),
    "urgent": ("Urgent",),
    "asap": ("Urgent",),
    "deadline": ("Urgent",),
    "newsletter": ("Newsletter",),
    "unsubscribe": ("Newsletter",),
    "contract": ("Legal",),
    "agreement": ("Legal",),
    "job": ("Recruiting",),
    "interview": ("Recruiting",),
    "candidate": ("Recruiting",),
}

_SYSTEM_PROMPT = (
    "You label emails with short topical tags for an email client. Given a subject, body, and "
    "sender, return 1-4 tags such as Finance, Scheduling, Urgent, Newsletter, Legal, Recruiting, "
    "Personal, Work, Social, or another concise single/two-word category if none fit. "
    'JSON shape: {"tags": ["Tag1", "Tag2"], "confidence": 0.0-1.0}'
)


def _heuristic_tags(payload: SmartTagRequest) -> SmartTagResponse:
    haystack = f"{payload.subject} {payload.body_text}".lower()
    tags: set[str] = set()

    for keyword, keyword_tags in _KEYWORD_TAGS.items():
        if keyword in haystack:
            tags.update(keyword_tags)

    if not tags:
        tags.add("General")

    return SmartTagResponse(tags=sorted(tags), confidence=0.35, source="heuristic")


async def suggest_tags(payload: SmartTagRequest) -> SmartTagResponse:
    if ai_enabled():
        try:
            user_content = (
                f"Subject: {payload.subject}\nFrom: {payload.sender_address}\n\n{payload.body_text}"
            )
            result = await call_model_json(_SYSTEM_PROMPT, user_content, max_tokens=200)
            tags = [str(t) for t in result.get("tags", []) if str(t).strip()][:4]
            if tags:
                confidence = result.get("confidence")
                return SmartTagResponse(
                    tags=tags,
                    confidence=float(confidence) if isinstance(confidence, (int, float)) else None,
                    source="ai",
                )
        except Exception as exc:  # noqa: BLE001 - any AI failure falls back to heuristics
            logger.warning("Live tagging failed, falling back to heuristics: %s", exc)

    return _heuristic_tags(payload)
