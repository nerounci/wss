from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.schemas import Token, UserRead, UserCreate, UserUpdate, RoleRead, PagePermissionUpdate
from app.crud import (
    get_user_by_username, create_user, get_users, get_user_by_id, update_user, get_roles,
    set_user_permission, clear_user_permission,
)
from app.auth import verify_password, create_access_token, get_current_user, get_current_admin, get_current_owner, require_page
from app.permissions import get_resolved_permissions, PAGE_KEYS
from app.models import User, Role
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

@router.get("/users/me/permissions")
async def read_my_permissions(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await get_resolved_permissions(db, current_user)

@router.get("/users", response_model=List[UserRead])
async def list_users(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_page("users"))):
    return await get_users(db, skip=skip, limit=limit)

@router.post("/users", response_model=UserRead)
async def register_user(user: UserCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_admin)):
    existing = await get_user_by_username(db, user.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    target_role = await db.get(Role, user.role_id)
    if target_role and target_role.name == "owner" and current_user.role.name != "owner":
        raise HTTPException(status_code=403, detail="Только владелец может назначать роль владельца")
    db_user = await create_user(db, user)
    return db_user

@router.get("/roles", response_model=List[RoleRead])
async def list_roles(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_admin)):
    return await get_roles(db)

@router.put("/users/{user_id}", response_model=UserRead)
async def update_user_endpoint(user_id: int, updates: UserUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_admin)):
    if updates.role_id is not None:
        new_role = await db.get(Role, updates.role_id)
        if new_role and new_role.name == "owner" and current_user.role.name != "owner":
            raise HTTPException(status_code=403, detail="Только владелец может назначать роль владельца")
        if user_id == current_user.id:
            if not new_role or new_role.name not in ("admin", "owner"):
                raise HTTPException(status_code=400, detail="Нельзя снять права администратора с самого себя")
            if current_user.role.name == "owner" and new_role.name != "owner":
                raise HTTPException(status_code=400, detail="Владелец не может понизить сам себя")
    user = await update_user(db, user_id, updates)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/users/{user_id}/permissions")
async def read_user_permissions(user_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_owner)):
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return await get_resolved_permissions(db, user)

@router.put("/users/{user_id}/permissions/{page_key}")
async def set_user_permission_endpoint(user_id: int, page_key: str, payload: PagePermissionUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_owner)):
    if page_key not in PAGE_KEYS:
        raise HTTPException(status_code=400, detail="Unknown page")
    await set_user_permission(db, user_id, page_key, payload.allowed)
    return {"ok": True}

@router.delete("/users/{user_id}/permissions/{page_key}")
async def clear_user_permission_endpoint(user_id: int, page_key: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_owner)):
    await clear_user_permission(db, user_id, page_key)
    return {"ok": True}
