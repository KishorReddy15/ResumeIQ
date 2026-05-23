from fastapi import APIRouter

router = APIRouter(prefix="/api")


@router.get("/resumes")
def list_resumes():
    return []
