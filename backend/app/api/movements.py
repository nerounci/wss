from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.schemas import MovementCreate, MovementRead, MovementBatchCreate
from app.crud import create_movement, create_batch_movement, get_movements
from app.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/api/movements", tags=["movements"])

@router.post("/", response_model=MovementRead)
async def new_movement(movement: MovementCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    move, error = await create_movement(db, movement, current_user.id)
    if error: raise HTTPException(status_code=400, detail=error)
    return move

@router.post("/batch")
async def new_batch_movement(movement: MovementBatchCreate, current_user: User = Depends(get_current_user)):
    moved_count, error = await create_batch_movement(
        db, movement.equipment_ids, movement.to_warehouse_id, movement.comment, current_user.id
    )
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"moved_count": moved_count}

@router.get("/", response_model=List[MovementRead])
async def list_movements(equipment_id: Optional[int] = None, user_id: Optional[int] = None,
                         start_date: Optional[datetime] = None, end_date: Optional[datetime] = None,
                         skip: int = 0, limit: int = 100,
                         db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await get_movements(db, skip=skip, limit=limit, equipment_id=equipment_id, user_id=user_id, start_date=start_date, end_date=end_date)
