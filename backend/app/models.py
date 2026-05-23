from pydantic import BaseModel


class ExperienceItem(BaseModel):
    title: str | None = None
    company: str | None = None
    duration: str | None = None
    description: str | None = None


class EducationItem(BaseModel):
    degree: str | None = None
    institution: str | None = None
    year: str | None = None


class ExtractedResume(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    skills: list[str] = []
    experience: list[ExperienceItem] = []
    education: list[EducationItem] = []


class CandidateOut(BaseModel):
    id: int
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    source: str = "Direct Apply"
    filename: str | None = None
    skills: list[str] = []
    experience: list[ExperienceItem] = []
    education: list[EducationItem] = []
    tags: list[str] = []
    created_at: str | None = None


class TagUpdate(BaseModel):
    tags: list[str]


class UploadResponse(BaseModel):
    id: int
    filename: str
    candidate: CandidateOut


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    resume_texts: list[str] = []


class ChatResponse(BaseModel):
    reply: str


class NLSearchRequest(BaseModel):
    query: str


class NLCandidateResult(BaseModel):
    candidate: CandidateOut
    explanation: str


class NLSearchResponse(BaseModel):
    query: str
    sql: str
    results: list[NLCandidateResult]


class CompareRequest(BaseModel):
    candidate_ids: list[int]


class ComparisonField(BaseModel):
    label: str
    values: dict[str, str | list[str] | None]


class CompareResponse(BaseModel):
    candidates: list[CandidateOut]
    comparison: list[ComparisonField]
    ai_summary: str


class ScoreRequest(BaseModel):
    job_description: str
    candidate_ids: list[int] = []


class CandidateScore(BaseModel):
    candidate: CandidateOut
    score: int
    reasoning: str
    strengths: list[str]
    gaps: list[str]


class ScoreResponse(BaseModel):
    job_description: str
    results: list[CandidateScore]
