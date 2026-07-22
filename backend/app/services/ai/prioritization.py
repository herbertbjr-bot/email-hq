"""Message prioritization.

Calls the configured Claude model to score how urgently a message needs
attention. Falls back to keyword-based heuristics if AI is not configured
or the call fails.
"""

from __future__ import annotations

import logging

from app.schemas.ai import PrioritizeRequest, PrioritizeResponse
from app.services.ai.base import ai_enabled, call_model_json

logger = logging.getLogger("emailhq.ai.prioritization")

_URGENT_KEYWORDS = ("urgent", "asap", "immediately", "deadline", "action required", "important")

_VALID_PRIORITIES = {"low", "normal", "high", "urgent"}

_SYSTEM_PROMPT = (
    "You triage emails for a busy inbox. Given a subject, body, sender, and whether it's part of "
    "a thread the user already replied to, decide how urgently it needs attention. "
    'JSON shape: {"priority": "low"|"normal"|"high"|"urgent", "score": 0.0-1.0, '
    '"reasons": ["short reason", ...]}'
)


def _label_for_score(score: float) -> str:
    if score >= 0.75:
        return "urgent"
    if score >= 0.5:
        return "high"
    if score >= 0.25:
        return "normal"
    return "low"


def _heuristic_score(payload: PrioritizeRequest) -> PrioritizeResponse:
    haystack = f"{payload.subject} {payload.body_text}".lower()
    score = 0.2
    reasons: list[str] = []

    matched_keywords = [kw for kw in _URGENT_KEYWORDS if kw in haystack]
    if matched_keywords:
        score += 0.4
        reasons.append(f"Contains urgency keyword(s): {', '.join(matched_keywords)}")

    if payload.is_reply:
        score += 0.15
        reasons.append("Part of an active thread you've replied to")

    if payload.subject.strip().endswith("?"):
        score += 0.1
        reasons.append("Subject line poses a direct question")

    score = min(score, 1.0)
    if not reasons:
        reasons.append("No strong priority signals detected")

    return PrioritizeResponse(priority=_label_for_score(score), score=round(score, 2), reasons=reasons, source="heuristic")


async def score_message(payload: PrioritizeRequest) -> PrioritizeResponse:
    if ai_enabled():
        try:
            user_content = (
                f"Subject: {payload.subject}\nFrom: {payload.sender_address}\n"
                f"Already part of a thread you replied to: {payload.is_reply}\n\n{payload.body_text}"
            )
            result = await call_model_json(_SYSTEM_PROMPT, user_content, max_tokens=250)
            priority = str(result.get("priority", "")).lower()
            score = result.get("score")
            if priority in _VALID_PRIORITIES and isinstance(score, (int, float)):
                reasons = [str(r) for r in result.get("reasons", [])][:5]
                return PrioritizeResponse(
                    priority=priority, score=round(float(score), 2), reasons=reasons or ["Assessed by AI"], source="ai"
                )
        except Exception as exc:  # noqa: BLE001 - any AI failure falls back to heuristics
            logger.warning("Live prioritization failed, falling back to heuristics: %s", exc)

    return _heuristic_score(payload)
