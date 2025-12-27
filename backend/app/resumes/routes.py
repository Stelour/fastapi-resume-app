from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.auth.routes import get_current_user
from backend.app.models import Resume, ResumeImprovement, User as UserDb
from backend.app.resumes.improve import improve_resume
from backend.app.resumes.schemas import (
    ResumeCreate,
    ResumeSchema,
    ResumeUpdate,
    ImprovePreviewResponse,
    ImproveCommitRequest,
    ImproveCommitResponse,
    ResumeImprovementSchema
)

router = APIRouter(tags=["resumes"])


async def get_resume_or_404(
    resume_id: int,
    current_user: UserDb = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Resume:
    stmt = select(Resume).where(Resume.id == resume_id)
    result = await db.execute(stmt)
    resume = result.scalar_one_or_none()

    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    
    if resume.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return resume


@router.post("/", response_model=ResumeSchema, status_code=201)
async def create_resume(
    resume_in: ResumeCreate,
    current_user: UserDb = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    content = resume_in.model_dump()

    new_resume = Resume(
        title=resume_in.short_profile,
        content=content,
        user_id=current_user.id
    )

    db.add(new_resume)
    await db.commit()
    await db.refresh(new_resume)

    return new_resume


@router.get("/", response_model=List[ResumeSchema])
async def resume_list_get(
    current_user: UserDb = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Resume)
        .where(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{resume_id}", response_model=ResumeSchema)
async def resume_get_by_id(
    resume: Resume = Depends(get_resume_or_404)
):
    return resume


@router.patch("/{resume_id}", response_model=ResumeSchema)
async def resume_patch(
    payload: ResumeUpdate,
    resume: Resume = Depends(get_resume_or_404),
    db: AsyncSession = Depends(get_db),
):
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=422, detail="No fields provided for update")
    if "title" in update_data:
        resume.title = update_data.pop("title")
    update_data.pop("content", None)
    if update_data:
        current_content = dict(resume.content) if resume.content else {}
        current_content.update(update_data)
        if "short_profile" in update_data:
            resume.title = update_data["short_profile"]

        resume.content = current_content

    await db.commit()
    await db.refresh(resume)
    return resume


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def resume_delete(
    resume: Resume = Depends(get_resume_or_404),
    db: AsyncSession = Depends(get_db),
):
    await db.delete(resume)
    await db.commit()


@router.post("/{resume_id}/improve/preview", response_model=ImprovePreviewResponse)
async def improve_preview(
    resume: Resume = Depends(get_resume_or_404),
    current_user: UserDb = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    draft = resume.content or {}
    if not isinstance(draft, dict) or not draft:
        raise HTTPException(status_code=422, detail="Resume content is empty")

    improved_content = await run_in_threadpool(improve_resume, draft)

    if not improved_content:
        raise HTTPException(status_code=502, detail="AI returned empty response")

    stmt = select(ResumeImprovement).where(
        ResumeImprovement.resume_id == resume.id,
        ResumeImprovement.is_preview.is_(True),
    )
    result = await db.execute(stmt)
    preview_row = result.scalar_one_or_none()

    if preview_row:
        preview_row.original_content = draft
        preview_row.improved_content = improved_content
    else:
        preview_row = ResumeImprovement(
            resume_id=resume.id,
            user_id=current_user.id,
            original_content=draft,
            improved_content=improved_content,
            is_preview=True,
        )
        db.add(preview_row)

    await db.commit()
    
    return ImprovePreviewResponse(resume_id=resume.id, improved_content=improved_content)


@router.get("/{resume_id}/improve/preview", response_model=ImprovePreviewResponse)
async def get_existing_preview(
    resume: Resume = Depends(get_resume_or_404),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ResumeImprovement).where(
        ResumeImprovement.resume_id == resume.id,
        ResumeImprovement.is_preview.is_(True),
    )
    preview = (await db.execute(stmt)).scalar_one_or_none()

    if preview is None:
        raise HTTPException(status_code=404, detail="No preview found")

    return ImprovePreviewResponse(resume_id=resume.id, improved_content=preview.improved_content)


@router.post("/{resume_id}/improve/commit", response_model=ImproveCommitResponse)
async def improve_commit(
    body: ImproveCommitRequest,
    resume: Resume = Depends(get_resume_or_404), # Используем dependency чтобы проверить доступ
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ResumeImprovement)
        .where(
            ResumeImprovement.resume_id == resume.id,
            ResumeImprovement.is_preview.is_(True),
        )
    )
    preview = (await db.execute(stmt)).scalar_one_or_none()

    if preview is None:
        raise HTTPException(status_code=404, detail="No preview to commit")

    if not body.confirm:
        await db.delete(preview)
        committed = False
    else:
        preview.is_preview = False
        committed = True

    await db.commit()
    return ImproveCommitResponse(resume_id=resume.id, committed=committed)


@router.get("/{resume_id}/history", response_model=List[ResumeImprovementSchema])
async def improvements_history(
    resume: Resume = Depends(get_resume_or_404),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(ResumeImprovement)
        .where(
            ResumeImprovement.resume_id == resume.id,
            ResumeImprovement.is_preview.is_(False)
        )
        .order_by(ResumeImprovement.created_at.desc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()


@router.delete("/improvements/{improvement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_improvement(
    improvement_id: int,
    current_user: UserDb = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ResumeImprovement).where(
        ResumeImprovement.id == improvement_id,
        ResumeImprovement.user_id == current_user.id,
        ResumeImprovement.is_preview.is_(False)
    )
    result = await db.execute(stmt)
    improvement = result.scalar_one_or_none()

    if improvement is None:
        raise HTTPException(status_code=404, detail="Improvement not found")

    await db.delete(improvement)
    await db.commit()
