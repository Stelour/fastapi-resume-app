import os
from datetime import datetime, timedelta, timezone
from typing import Annotated
import jwt
from dotenv import load_dotenv

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.database import get_db
from backend.app.models import User as UserDb, Resume


load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("No SECRET_KEY set for FastAPI application")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

router = APIRouter(tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login") 


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class UserSchema(BaseModel):
    id: int
    username: str
    email: EmailStr
    
    model_config = ConfigDict(from_attributes=True)

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=32)


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


async def authenticate_user(db: AsyncSession, username: str, password: str):
    query = select(UserDb).where(UserDb.email == username)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, excd: timedelta | None = None):
    enc = data.copy()
    if excd:
        exp = datetime.now(timezone.utc) + excd
    else:
        exp = datetime.now(timezone.utc) + timedelta(minutes=15)
    enc.update({"exp": exp})
    enc_jwt = jwt.encode(enc, SECRET_KEY, algorithm=ALGORITHM)
    return enc_jwt


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)],db: AsyncSession = Depends(get_db)):
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        pl = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = pl.get("sub")
        if email is None:
            raise exc
        token_data = TokenData(username=email)
    except jwt.InvalidTokenError:
        raise exc
    
    query = select(UserDb).where(UserDb.email == token_data.username)
    result = await db.execute(query)
    user = result.scalars().first()
    
    if user is None:
        raise exc
        
    return user


@router.post("/register", status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    query = select(UserDb).where(UserDb.email == data.email)
    result = await db.execute(query)
    such_user = result.scalars().first()

    if such_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    hashed_pass = hash_password(data.password)
    
    new_user = UserDb(
        email=data.email,
        username=data.username,
        hashed_password=hash_password(data.password)
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return {"message": "User registered successfully", "user_id": new_user.id}


@router.post("/login", response_model=Token)
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()],db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, 
        excd=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: Annotated[UserSchema, Depends(get_current_user)]):
    return current_user
