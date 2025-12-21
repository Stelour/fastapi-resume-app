from sqlalchemy import String, Text, ForeignKey, func, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    resumes: Mapped[list["Resume"]] = relationship(back_populates="owner")
    improvements: Mapped[list["ResumeImprovement"]] = relationship(back_populates="user")


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=True)
    
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    owner: Mapped["User"] = relationship(back_populates="resumes")
    improvements: Mapped[list["ResumeImprovement"]] = relationship(back_populates="resume", passive_deletes=True)


class ResumeImprovement(Base):
    __tablename__ = "resume_improvements"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    resume_id: Mapped[int] = mapped_column(ForeignKey("resumes.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    original_content: Mapped[str] = mapped_column(Text, nullable=False)
    improved_content: Mapped[str] = mapped_column(Text, nullable=False)
    is_preview: Mapped[bool] = mapped_column(default=True, nullable=False, index=True)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    resume: Mapped["Resume"] = relationship(back_populates="improvements")
    user: Mapped["User"] = relationship(back_populates="improvements")
