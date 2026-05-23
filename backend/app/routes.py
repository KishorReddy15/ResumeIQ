from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from .database import get_connection
from .models import CandidateOut, ExperienceItem, EducationItem, TagUpdate, UploadResponse
from .services import extract_text_from_pdf, extract_resume_data, validate_pdf

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
def list_candidates():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM candidates ORDER BY created_at DESC").fetchall()
    conn.close()
    return [_build_candidate(row) for row in rows]


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
