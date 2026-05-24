import os
import logging
from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile

from .database import get_connection
from .models import (
    CandidateOut, ExperienceItem, EducationItem, TagUpdate, UploadResponse,
    ChatRequest, ChatResponse,
)
from .services import (
    extract_text_from_pdf, extract_resume_data, validate_pdf,
    chat_with_resumes, filter_candidates_with_llm,
)

logger = logging.getLogger(__name__)


router = APIRouter()


def _build_candidate(row: dict) -> CandidateOut:
    conn = get_connection()
    cid = row["id"]

    skills = [r["skill"] for r in conn.execute(
        "SELECT skill FROM skills WHERE candidate_id = ?", (cid,)
    )]
    experience = [
        ExperienceItem(
            title=r["title"], company=r["company"],
            duration=r["duration"], description=r["description"],
        )
        for r in conn.execute(
            "SELECT title, company, duration, description FROM experience WHERE candidate_id = ?",
            (cid,),
        )
    ]
    education = [
        EducationItem(degree=r["degree"], institution=r["institution"], year=r["year"])
        for r in conn.execute(
            "SELECT degree, institution, year FROM education WHERE candidate_id = ?",
            (cid,),
        )
    ]
    tags = [r["tag"] for r in conn.execute(
        "SELECT tag FROM tags WHERE candidate_id = ?", (cid,)
    )]
    conn.close()

    return CandidateOut(
        id=row["id"],
        name=row["name"],
        email=row["email"],
        phone=row["phone"],
        source=row["source"],
        filename=row["filename"],
        skills=skills,
        experience=experience,
        education=education,
        tags=tags,
        created_at=row["created_at"],
        raw_text=row["raw_text"],
    )


@router.post("/upload", response_model=UploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    source: str = Form("Direct Apply"),
):
    error = validate_pdf(file.filename or "", file.size or 0)
    if error:
        raise HTTPException(status_code=400, detail=error)

    pdf_bytes = await file.read()

    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Empty file.")

    raw_text = extract_text_from_pdf(pdf_bytes)
    if not raw_text:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

    extracted = extract_resume_data(raw_text)

    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO candidates (name, email, phone, source, filename, raw_text) VALUES (?, ?, ?, ?, ?, ?)",
        (extracted.name, extracted.email, extracted.phone, source, file.filename, raw_text),
    )
    candidate_id = cursor.lastrowid

    for skill in extracted.skills:
        conn.execute("INSERT INTO skills (candidate_id, skill) VALUES (?, ?)", (candidate_id, skill))

    for exp in extracted.experience:
        conn.execute(
            "INSERT INTO experience (candidate_id, title, company, duration, description) VALUES (?, ?, ?, ?, ?)",
            (candidate_id, exp.title, exp.company, exp.duration, exp.description),
        )

    for edu in extracted.education:
        conn.execute(
            "INSERT INTO education (candidate_id, degree, institution, year) VALUES (?, ?, ?, ?)",
            (candidate_id, edu.degree, edu.institution, edu.year),
        )

    conn.commit()

    row = conn.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,)).fetchone()
    conn.close()

    candidate = _build_candidate(row)
    return UploadResponse(id=candidate_id, filename=file.filename or "", candidate=candidate)


def _filter_candidates_by_keywords(candidates: list[CandidateOut], search: str) -> list[CandidateOut]:
    term = search.lower()
    filtered = []
    for c in candidates:
        name_match = term in (c.name or "").lower()
        email_match = term in (c.email or "").lower()
        skill_match = any(term in s.lower() for s in c.skills)
        exp_match = any(
            term in (exp.title or "").lower() or term in (exp.company or "").lower() or term in (exp.description or "").lower()
            for exp in c.experience
        )
        edu_match = any(
            term in (edu.degree or "").lower() or term in (edu.institution or "").lower()
            for edu in c.education
        )
        raw_match = term in (c.raw_text or "").lower()
        if name_match or email_match or skill_match or exp_match or edu_match or raw_match:
            filtered.append(c)
    return filtered


@router.get("/candidates", response_model=list[CandidateOut])
def list_candidates(
    source: list[str] = Query(default=[]),
    skill: list[str] = Query(default=[]),
    tag: list[str] = Query(default=[]),
    search: str = Query(default=""),
):
    conn = get_connection()
    clauses: list[str] = []
    params: list[str] = []

    if source:
        placeholders = ",".join("?" for _ in source)
        clauses.append(f"c.source IN ({placeholders})")
        params.extend(source)

    if skill:
        for s in skill:
            clauses.append(
                "c.id IN (SELECT candidate_id FROM skills WHERE LOWER(skill) LIKE ?)"
            )
            params.append(f"%{s.lower()}%")

    if tag:
        for t in tag:
            clauses.append(
                "c.id IN (SELECT candidate_id FROM tags WHERE LOWER(tag) LIKE ?)"
            )
            params.append(f"%{t.lower()}%")

    where = ""
    if clauses:
        where = "WHERE " + " AND ".join(clauses)

    rows = conn.execute(
        f"SELECT c.* FROM candidates c {where} ORDER BY c.created_at DESC",
        params,
    ).fetchall()
    conn.close()

    candidates = [_build_candidate(row) for row in rows]

    if search:
        api_key = os.environ.get("GROQ_API_KEY", "")
        if api_key and candidates:
            try:
                matching_ids = filter_candidates_with_llm(candidates, search)
                candidates = [c for c in candidates if c.id in matching_ids]
            except Exception as e:
                logger.exception("Error filtering candidates with LLM. Falling back to keyword search.")
                candidates = _filter_candidates_by_keywords(candidates, search)
        elif candidates:
            candidates = _filter_candidates_by_keywords(candidates, search)

    return candidates


@router.get("/candidates/filters")
def get_filter_options():
    conn = get_connection()
    sources = [r["source"] for r in conn.execute("SELECT DISTINCT source FROM candidates ORDER BY source").fetchall()]
    skills = [r["skill"] for r in conn.execute("SELECT DISTINCT skill FROM skills ORDER BY skill").fetchall()]
    tags = [r["tag"] for r in conn.execute("SELECT DISTINCT tag FROM tags ORDER BY tag").fetchall()]
    conn.close()
    return {"sources": sources, "skills": skills, "tags": tags}


@router.get("/candidates/{candidate_id}", response_model=CandidateOut)
def get_candidate(candidate_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return _build_candidate(row)


@router.patch("/candidates/{candidate_id}/tags", response_model=CandidateOut)
def update_tags(candidate_id: int, body: TagUpdate):
    conn = get_connection()
    row = conn.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Candidate not found.")

    conn.execute("DELETE FROM tags WHERE candidate_id = ?", (candidate_id,))
    for tag in body.tags:
        conn.execute("INSERT INTO tags (candidate_id, tag) VALUES (?, ?)", (candidate_id, tag))
    conn.commit()
    conn.close()

    conn = get_connection()
    row = conn.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,)).fetchone()
    conn.close()
    return _build_candidate(row)


@router.post("/chat/upload")
async def chat_upload(files: list[UploadFile] = File(...)):
    texts = []
    filenames = []
    for f in files:
        error = validate_pdf(f.filename or "", f.size or 0)
        if error:
            raise HTTPException(status_code=400, detail=f"{f.filename}: {error}")

        pdf_bytes = await f.read()
        if not pdf_bytes:
            raise HTTPException(status_code=400, detail=f"{f.filename}: Empty file.")

        text = extract_text_from_pdf(pdf_bytes)
        if not text:
            raise HTTPException(
                status_code=400,
                detail=f"{f.filename}: Could not extract text from PDF.",
            )
        texts.append(text)
        filenames.append(f.filename or "unknown.pdf")

    return {"resume_texts": texts, "filenames": filenames}


@router.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest):
    if not body.resume_texts:
        raise HTTPException(
            status_code=400,
            detail="No resume texts provided. Upload resumes first.",
        )

    messages = [{"role": m.role, "content": m.content} for m in body.messages]
    reply = chat_with_resumes(body.resume_texts, messages)
    return ChatResponse(reply=reply)
