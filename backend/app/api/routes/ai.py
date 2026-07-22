from fastapi import APIRouter

from app.schemas.ai import (
    AIStatusResponse,
    PrioritizeRequest,
    PrioritizeResponse,
    QuickReplyRequest,
    QuickReplyResponse,
    SmartTagRequest,
    SmartTagResponse,
)
from app.services.ai import prioritization, quick_reply, tagging
from app.services.ai.base import ai_status

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/status", response_model=AIStatusResponse)
async def get_ai_status() -> AIStatusResponse:
    return AIStatusResponse(**ai_status())


@router.post("/tag", response_model=SmartTagResponse)
async def tag_message(payload: SmartTagRequest) -> SmartTagResponse:
    return await tagging.suggest_tags(payload)


@router.post("/prioritize", response_model=PrioritizeResponse)
async def prioritize_message(payload: PrioritizeRequest) -> PrioritizeResponse:
    return await prioritization.score_message(payload)


@router.post("/quick-reply", response_model=QuickReplyResponse)
async def quick_reply_suggestions(payload: QuickReplyRequest) -> QuickReplyResponse:
    return await quick_reply.generate_replies(payload)
