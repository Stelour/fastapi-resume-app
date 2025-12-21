from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from fastapi.concurrency import run_in_threadpool

from backend.app.models import ResumeImprovement
from backend.app.resumes.improve import improve_resume
from backend.app.database import get_db
from backend.app.models import Resume, User as UserDb
from backend.app.resumes.schemas import (
    ResumeCreate, 
    ResumeSchema, 
    ResumeUpdate,
    ImprovePreviewResponse, 
    ImproveCommitRequest, 
    ImproveCommitResponse,
    ResumeImprovementSchema
)
from backend.app.auth.routes import get_current_user


router = APIRouter(tags=["resumes"])


def build_content(
    short_profile: str,
    skills: str,
    experience: str,
    strengths: str,
    additional_info: str,
):
    return (
        f"**Краткий профиль:**\n{short_profile}\n\n"
        f"**Ключевые навыки:**\n{skills}\n\n"
        f"**Опыт и проекты:**\n{experience}\n\n"
        f"**Сильные стороны:**\n{strengths}\n\n"
        f"**Дополнительная информация:**\n{additional_info}"
    )


@router.post("/", response_model=ResumeSchema, status_code=201)
async def create_resume(resume_in: ResumeCreate,
    current_user: UserDb = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    
    cont = build_content(
        short_profile=resume_in.short_profile,
        skills=resume_in.skills,
        experience=resume_in.experience,
        strengths=resume_in.strengths,
        additional_info=resume_in.additional_info,
    )

    new_resume = Resume(title=resume_in.full_name, content=cont, user_id=current_user.id)

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


@router.patch("/{resume_id}", response_model=ResumeSchema, status_code=200)
async def resume_patch(resume_id: int, payload: ResumeUpdate, current_user: UserDb = Depends(get_current_user), db: AsyncSession = Depends(get_db),):
    stmt = select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    result = await db.execute(stmt)
    resume = result.scalar_one_or_none()

    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found")

    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=422, detail="No fields provided")

    if "full_name" in data and "title" not in data:
        data["title"] = data.pop("full_name")

    form_keys = {"short_profile", "skills", "experience", "strengths", "additional_info"}
    if form_keys.intersection(data.keys()):
        missing = [k for k in form_keys if k not in data]
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"If you update via form fields, send all of them: missing {missing}",
            )

        data["content"] = build_content(
            short_profile=data["short_profile"],
            skills=data["skills"],
            experience=data["experience"],
            strengths=data["strengths"],
            additional_info=data["additional_info"],
        )
        for k in form_keys:
            data.pop(k, None)

    for k in ("title", "content"):
        if k in data:
            setattr(resume, k, data[k])

    await db.commit()
    await db.refresh(resume)
    return resume


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def resume_delete(resume_id: int, current_user: UserDb = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db),):
    stmt = select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id,)
    result = await db.execute(stmt)
    resume = result.scalar_one_or_none()

    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found")

    await db.delete(resume)
    await db.commit()

    return


@router.post("/{resume_id}/improve/preview", response_model=ImprovePreviewResponse, status_code=200)
async def improve_preview(
    resume_id: int,
    current_user: UserDb = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    res = await db.execute(stmt)
    resume = res.scalar_one_or_none()

    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found")

    draft = resume.content or ""
    if not draft.strip():
        raise HTTPException(status_code=422, detail="Resume content is empty")

    improved = await run_in_threadpool(improve_resume, draft)

    if not improved:
        raise HTTPException(status_code=502, detail="AI returned empty response")

    stmt_prev = select(ResumeImprovement).where(
        ResumeImprovement.user_id == current_user.id,
        ResumeImprovement.resume_id == resume_id,
        ResumeImprovement.is_preview == True,
    )
    prev_res = await db.execute(stmt_prev)
    preview_row = prev_res.scalar_one_or_none()

    if preview_row is None:
        preview_row = ResumeImprovement(
            resume_id=resume_id,
            user_id=current_user.id,
            original_content=draft,
            improved_content=improved,
            is_preview=True,
        )
        db.add(preview_row)
    else:
        preview_row.original_content = draft
        preview_row.improved_content = improved
        preview_row.is_preview = True

    await db.commit()

    return ImprovePreviewResponse(resume_id=resume_id, improved_content=improved)


@router.post("/{resume_id}/improve/commit", response_model=ImproveCommitResponse, status_code=200)
async def improve_commit(
    resume_id: int,
    body: ImproveCommitRequest,
    current_user: UserDb = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ResumeImprovement).where(
        ResumeImprovement.user_id == current_user.id,
        ResumeImprovement.resume_id == resume_id,
        ResumeImprovement.is_preview == True,
    )
    result = await db.execute(stmt)
    preview = result.scalar_one_or_none()

    if preview is None:
        raise HTTPException(404, "No preview to commit")

    if body.confirm is False:
        await db.delete(preview)
        await db.commit()
        return {"committed": False}

    preview.is_preview = False
    await db.commit()

    return {"resume_id": resume_id, "committed": True/False}


@router.get("/{resume_id}/history", response_model=List[ResumeImprovementSchema], status_code=200)
async def improvements_history(resume_id: int, current_user: UserDb = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = (
        select(ResumeImprovement)
        .where(
            ResumeImprovement.user_id == current_user.id,
            ResumeImprovement.resume_id == resume_id,
            ResumeImprovement.is_preview.is_(False)
        ).order_by(ResumeImprovement.created_at.desc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()


@router.delete("/improvements/{improvement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_improvement(improvement_id: int, current_user: UserDb = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(ResumeImprovement).where(
        ResumeImprovement.id == improvement_id,
        ResumeImprovement.user_id == current_user.id,
        ResumeImprovement.is_preview.is_(False)
    )
    res = await db.execute(stmt)
    improvement = res.scalar_one_or_none()

    if improvement is None:
        raise HTTPException(status_code=404, detail="Improvement not found")

    await db.delete(improvement)
    await db.commit()
