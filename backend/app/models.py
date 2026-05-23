from pydantic import BaseModel


class ResumeUploadResponse(BaseModel):
    id: int
    filename: str
    message: str
