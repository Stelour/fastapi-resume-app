from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Any

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
    content: dict[str, Any]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ResumeUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: Optional[str] = None
    content: Optional[str] = None

    full_name: Optional[str] = None
    short_profile: Optional[str] = None
    skills: Optional[str] = None
    experience: Optional[str] = None
    strengths: Optional[str] = None
    additional_info: Optional[str] = None

class ImprovePreviewResponse(BaseModel):
    resume_id: int
    improved_content: dict[str, Any]

class ImproveCommitRequest(BaseModel):
    confirm: bool

class ImproveCommitResponse(BaseModel):
    resume_id: int
    committed: bool

class ResumeImprovementSchema(BaseModel):
    id: int
    resume_id: int
    original_content: dict[str, Any]
    improved_content: dict[str, Any]
    is_preview: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)