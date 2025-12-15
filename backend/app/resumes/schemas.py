from pydantic import BaseModel, ConfigDict
from datetime import datetime

class ResumeCreate(BaseModel):
    full_name: str
    short_profile: str
    skills: str
    experience: str
    strengths: str
    additional_info: str

class ResumeSchema(BaseModel):
    id: int
    title: str
    content: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)