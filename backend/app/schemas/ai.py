from pydantic import BaseModel, Field

AISource = str  # "ai" | "heuristic"


class SmartTagRequest(BaseModel):
    subject: str
    body_text: str
    sender_address: str


class SmartTagResponse(BaseModel):
    tags: list[str]
    confidence: float | None = None
    source: AISource = "heuristic"


class PrioritizeRequest(BaseModel):
    subject: str
    body_text: str
    sender_address: str
    is_reply: bool = False


class PrioritizeResponse(BaseModel):
    priority: str  # "low" | "normal" | "high" | "urgent"
    score: float
    reasons: list[str] = Field(default_factory=list)
    source: AISource = "heuristic"


class QuickReplyRequest(BaseModel):
    subject: str
    body_text: str
    sender_name: str | None = None
    tone: str = "professional"  # "professional" | "friendly" | "brief"


class QuickReplySuggestion(BaseModel):
    label: str
    body: str


class QuickReplyResponse(BaseModel):
    suggestions: list[QuickReplySuggestion]
    source: AISource = "heuristic"


class AIStatusResponse(BaseModel):
    enabled: bool
    provider: str
    model: str | None = None
