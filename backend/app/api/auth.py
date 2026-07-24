from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.schemas import Token, UserRead, UserCreate
from app.crud import get_user_by_username, create_user, get_users
from app.auth import verify_password, create_access_token, get_current_user, get_current_admin
from app.models import User
from app.limiter import limiter

router = APIRouter(prefix="/api", tags=["auth"])

@router.post("/token", response_model=Token)
@limiter.limit("10/minute")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user = await get_user_by_username(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username, "user_id": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=UserRead)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/users", response_model=List[UserRead])
async def list_users(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_admin)):
    return await get_users(db, skip=skip, limit=limit)

@router.post("/users", response_model=UserRead)
async def register_user(user: UserCreate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_admin)):
    existing = await get_user_by_username(db, user.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    db_user = await create_user(db, user)
    return db_user
