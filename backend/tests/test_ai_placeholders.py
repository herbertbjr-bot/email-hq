import pytest

from app.schemas.ai import PrioritizeRequest, QuickReplyRequest, SmartTagRequest
from app.services.ai import prioritization, quick_reply, tagging


@pytest.mark.asyncio
async def test_suggest_tags_matches_keywords():
    result = await tagging.suggest_tags(
        SmartTagRequest(subject="Invoice due", body_text="Please pay the attached invoice", sender_address="a@b.com")
    )
    assert "Finance" in result.tags


@pytest.mark.asyncio
async def test_prioritize_flags_urgent_keywords():
    result = await prioritization.score_message(
        PrioritizeRequest(subject="URGENT: action required", body_text="Please respond asap", sender_address="a@b.com")
    )
    assert result.priority in {"high", "urgent"}


@pytest.mark.asyncio
async def test_quick_reply_returns_suggestions():
    result = await quick_reply.generate_replies(
        QuickReplyRequest(subject="Hi", body_text="Can we meet?", sender_name="Jamie", tone="brief")
    )
    assert len(result.suggestions) == 3
