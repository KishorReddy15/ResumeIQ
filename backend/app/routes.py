import logging

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile

logger = logging.getLogger(__name__)

from .database import get_connection
from .models import (
    CandidateOut, ExperienceItem, EducationItem, TagUpdate, UploadResponse,
    ChatRequest, ChatResponse,
    NLSearchRequest, NLSearchResponse, NLCandidateResult,
    CompareRequest, CompareResponse, ComparisonField,
    ScoreRequest, ScoreResponse, CandidateScore,
)
from .services import (
    extract_text_from_pdf, extract_resume_data, validate_pdf, chat_with_resumes,
    generate_sql_from_query, validate_generated_sql, explain_candidates,
    compare_candidates, score_candidates,
)

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

    if search:
        term = f"%{search.lower()}%"
        clauses.append(
            "(LOWER(c.name) LIKE ? OR LOWER(c.email) LIKE ? "
            "OR c.id IN (SELECT candidate_id FROM skills WHERE LOWER(skill) LIKE ?) "
            "OR c.id IN (SELECT candidate_id FROM experience WHERE LOWER(title) LIKE ? OR LOWER(company) LIKE ?))"
        )
        params.extend([term, term, term, term, term])

    where = ""
    if clauses:
        where = "WHERE " + " AND ".join(clauses)

    rows = conn.execute(
        f"SELECT c.* FROM candidates c {where} ORDER BY c.created_at DESC",
        params,
    ).fetchall()
    conn.close()
    return [_build_candidate(row) for row in rows]


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


@router.post("/search/natural", response_model=NLSearchResponse)
def natural_language_search(body: NLSearchRequest):
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        sql = generate_sql_from_query(body.query)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception:
        logger.exception("Groq SQL generation failed")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate SQL from your query. Please try rephrasing.",
        )

    error = validate_generated_sql(sql)
    if error:
        logger.warning("Unsafe SQL rejected: %s — %s", sql, error)
        raise HTTPException(status_code=400, detail=error)

    conn = get_connection()
    try:
        rows = conn.execute(sql).fetchall()
    except Exception:
        conn.close()
        logger.exception("AI-generated SQL execution failed: %s", sql)
        raise HTTPException(
            status_code=400,
            detail="The AI-generated query could not be executed. Please try rephrasing your search.",
        )

    candidates = [_build_candidate(row) for row in rows]
    conn.close()

    if not candidates:
        return NLSearchResponse(query=body.query, sql=sql, results=[])

    candidates_info = [
        {
            "id": c.id,
            "name": c.name,
            "skills": c.skills,
            "experience": [
                {"title": e.title, "company": e.company, "duration": e.duration}
                for e in c.experience
            ],
            "source": c.source,
        }
        for c in candidates
    ]

    try:
        explanations = explain_candidates(body.query, candidates_info)
    except Exception:
        logger.exception("Groq explanation generation failed")
        explanations = {}

    results = [
        NLCandidateResult(
            candidate=c,
            explanation=explanations.get(str(c.id), "Matched the search criteria."),
        )
        for c in candidates
    ]

    return NLSearchResponse(query=body.query, sql=sql, results=results)


def _candidate_info(c: CandidateOut) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "skills": c.skills,
        "experience": [
            {"title": e.title, "company": e.company, "duration": e.duration}
            for e in c.experience
        ],
        "education": [
            {"degree": e.degree, "institution": e.institution, "year": e.year}
            for e in c.education
        ],
        "source": c.source,
    }


@router.post("/candidates/compare", response_model=CompareResponse)
def compare(body: CompareRequest):
    if len(body.candidate_ids) < 2:
        raise HTTPException(status_code=400, detail="Select at least 2 candidates to compare.")
    if len(body.candidate_ids) > 4:
        raise HTTPException(status_code=400, detail="Compare up to 4 candidates at a time.")

    conn = get_connection()
    candidates = []
    for cid in body.candidate_ids:
        row = conn.execute("SELECT * FROM candidates WHERE id = ?", (cid,)).fetchone()
        if not row:
            conn.close()
            raise HTTPException(status_code=404, detail=f"Candidate {cid} not found.")
        candidates.append(_build_candidate(row))
    conn.close()

    comparison = [
        ComparisonField(
            label="Name",
            values={str(c.id): c.name or "Unknown" for c in candidates},
        ),
        ComparisonField(
            label="Source",
            values={str(c.id): c.source for c in candidates},
        ),
        ComparisonField(
            label="Email",
            values={str(c.id): c.email for c in candidates},
        ),
        ComparisonField(
            label="Phone",
            values={str(c.id): c.phone for c in candidates},
        ),
        ComparisonField(
            label="Skills",
            values={str(c.id): c.skills for c in candidates},
        ),
        ComparisonField(
            label="Experience",
            values={
                str(c.id): [
                    f"{e.title} at {e.company} ({e.duration})"
                    for e in c.experience
                ]
                for c in candidates
            },
        ),
        ComparisonField(
            label="Education",
            values={
                str(c.id): [
                    f"{e.degree} — {e.institution} ({e.year})"
                    for e in c.education
                ]
                for c in candidates
            },
        ),
    ]

    candidates_info = [_candidate_info(c) for c in candidates]
    try:
        ai_summary = compare_candidates(candidates_info)
    except Exception:
        logger.exception("Comparison AI summary failed")
        ai_summary = "Could not generate AI comparison summary."

    return CompareResponse(
        candidates=candidates,
        comparison=comparison,
        ai_summary=ai_summary,
    )


@router.post("/candidates/score", response_model=ScoreResponse)
def score(body: ScoreRequest):
    if not body.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")

    conn = get_connection()
    if body.candidate_ids:
        candidates = []
        for cid in body.candidate_ids:
            row = conn.execute("SELECT * FROM candidates WHERE id = ?", (cid,)).fetchone()
            if row:
                candidates.append(_build_candidate(row))
        conn.close()
    else:
        rows = conn.execute("SELECT * FROM candidates ORDER BY created_at DESC").fetchall()
        conn.close()
        candidates = [_build_candidate(row) for row in rows]

    if not candidates:
        return ScoreResponse(job_description=body.job_description, results=[])

    candidates_info = [_candidate_info(c) for c in candidates]

    try:
        scores = score_candidates(body.job_description, candidates_info)
    except Exception:
        logger.exception("Scoring failed")
        scores = {}

    results = []
    for c in candidates:
        s = scores.get(str(c.id), {})
        results.append(
            CandidateScore(
                candidate=c,
                score=int(s.get("score", 0)),
                reasoning=s.get("reasoning", "Could not generate score."),
                strengths=s.get("strengths", []),
                gaps=s.get("gaps", []),
            )
        )

    results.sort(key=lambda r: r.score, reverse=True)
    return ScoreResponse(job_description=body.job_description, results=results)
