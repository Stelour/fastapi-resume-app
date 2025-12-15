from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from backend.app.database import get_db
from backend.app.models import Resume, User as UserDb
from backend.app.resumes.schemas import ResumeCreate, ResumeSchema
from backend.app.auth.routes import get_current_user


router = APIRouter(tags=["resumes"])


@router.post("/", response_model=ResumeSchema, status_code=201)
async def create_resume(resume_in: ResumeCreate,
    current_user: UserDb = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    
    cont = (
        f"**Краткий профиль:**\n{resume_in.short_profile}\n\n"
        f"**Ключевые навыки:**\n{resume_in.skills}\n\n"
        f"**Опыт и проекты:**\n{resume_in.experience}\n\n"
        f"**Сильные стороны:**\n{resume_in.strengths}\n\n"
        f"**Дополнительная информация:**\n{resume_in.additional_info}"
    )

    new_resume = Resume(
        title=resume_in.full_name,
        content=cont,
        user_id=current_user.id
    )

    db.add(new_resume)
    await db.commit()
    await db.refresh(new_resume)

    return new_resume


@router.get("/", response_model=List[ResumeSchema], status_code=200)
async def resume_list_get(current_user: UserDb = Depends(get_current_user), db: AsyncSession = Depends(get_db),):
    stmt = (
        select(Resume)
        .where(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
    )
    result = await db.execute(stmt)
    resumes = result.scalars().all()
    return resumes


@router.get("/{resume_id}", response_model=ResumeSchema, status_code=200)
async def resume_get_by_id(resume_id: int, current_user: UserDb = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Resume).where(Resume.id == resume_id)
    result = await db.execute(stmt)
    resume = result.scalar_one_or_none()

    if resume is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found",)

    if resume.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied",)

    return resume