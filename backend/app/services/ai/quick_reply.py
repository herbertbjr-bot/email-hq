"""Quick-reply generation.

Calls the configured Claude model to draft 2-3 short reply options in the
requested tone. Falls back to fixed templates if AI is not configured or
the call fails.
"""

from __future__ import annotations

import logging

from app.schemas.ai import QuickReplyRequest, QuickReplyResponse, QuickReplySuggestion
from app.services.ai.base import ai_enabled, call_model_json

logger = logging.getLogger("emailhq.ai.quick_reply")

_TEMPLATES: dict[str, tuple[tuple[str, str], ...]] = {
    "professional": (
        ("Acknowledge", "Thank you for your message. I've received it and will follow up shortly."),
        ("Accept", "This works for me - please proceed as outlined."),
        ("Need time", "Thanks for reaching out. I need a bit more time to review this and will respond by end of day."),
    ),
    "friendly": (
        ("Acknowledge", "Thanks so much for this - got it! I'll get back to you soon."),
        ("Accept", "Sounds great to me, let's go ahead!"),
        ("Need time", "Appreciate you sending this over - let me take a closer look and circle back shortly."),
    ),
    "brief": (
        ("Acknowledge", "Got it, thanks."),
        ("Accept", "Works for me."),
        ("Need time", "Reviewing - will follow up soon."),
    ),
}

_SYSTEM_PROMPT = (
    "You draft short reply options for an email client. Given the original message and a desired "
    "tone (professional, friendly, or brief), produce exactly 3 distinct reply drafts covering "
    "different intents (e.g. acknowledge, accept/agree, need more time - adapt to what the message "
    "actually needs). Each body should be ready to send, 1-4 sentences, no signature block. "
    'JSON shape: {"suggestions": [{"label": "short label", "body": "reply text"}, ...]}'
)


def _heuristic_replies(payload: QuickReplyRequest) -> QuickReplyResponse:
    templates = _TEMPLATES.get(payload.tone, _TEMPLATES["professional"])
    greeting = f"Hi {payload.sender_name}," if payload.sender_name else "Hi,"

    suggestions = [QuickReplySuggestion(label=label, body=f"{greeting}\n\n{body}") for label, body in templates]
    return QuickReplyResponse(suggestions=suggestions, source="heuristic")


async def generate_replies(payload: QuickReplyRequest) -> QuickReplyResponse:
    if ai_enabled():
        try:
            user_content = (
                f"Subject: {payload.subject}\nFrom: {payload.sender_name or 'unknown sender'}\n"
                f"Desired tone: {payload.tone}\n\n{payload.body_text}"
            )
            result = await call_model_json(_SYSTEM_PROMPT, user_content, max_tokens=500)
            raw_suggestions = result.get("suggestions", [])
            suggestions = [
                QuickReplySuggestion(label=str(s.get("label", "Reply")), body=str(s.get("body", "")).strip())
                for s in raw_suggestions
                if str(s.get("body", "")).strip()
            ][:3]
            if suggestions:
                return QuickReplyResponse(suggestions=suggestions, source="ai")
        except Exception as exc:  # noqa: BLE001 - any AI failure falls back to templates
            logger.warning("Live quick-reply generation failed, falling back to templates: %s", exc)

    return _heuristic_replies(payload)
