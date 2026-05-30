from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.database import get_db
from app.schemas import EquipmentCreate, EquipmentRead, EquipmentUpdate, EquipmentStatusEnum, StatusHistoryRead
from app.crud import create_equipment, get_equipments, get_equipment_by_id, update_equipment, delete_equipment, change_equipment_status, get_status_history
from app.auth import get_current_user, get_current_admin
from app.models import User, EquipmentStatus

router = APIRouter(prefix="/api/equipment", tags=["equipment"])

@router.get("/", response_model=List[EquipmentRead])
async def read_equipment(search: Optional[str] = None, barcode: Optional[str] = None, category: Optional[str] = None,
                         status: Optional[EquipmentStatus] = None, warehouse_id: Optional[int] = None,
                         skip: int = 0, limit: int = 100,
                         db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await get_equipments(db, skip=skip, limit=limit, search=search, barcode=barcode, category=category, status=status, warehouse_id=warehouse_id)

@router.post("/", response_model=EquipmentRead)
async def new_equipment(equipment: EquipmentCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await create_equipment(db, equipment)

@router.get("/{eq_id}", response_model=EquipmentRead)
async def get_equipment(eq_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    eq = await get_equipment_by_id(db, eq_id)
    if not eq: raise HTTPException(status_code=404, detail="Not found")
    return eq

@router.put("/{eq_id}", response_model=EquipmentRead)
async def update_equipment_endpoint(eq_id: int, updates: EquipmentUpdate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_admin)):
    eq = await update_equipment(db, eq_id, updates)
    if not eq: raise HTTPException(status_code=404, detail="Not found")
    return eq

@router.delete("/{eq_id}", status_code=204)
async def delete_equipment_endpoint(eq_id: int, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_admin)):
    await delete_equipment(db, eq_id)
    return {"ok": True}

@router.put("/{eq_id}/status", response_model=EquipmentRead)
async def change_status(eq_id: int, new_status: EquipmentStatusEnum, comment: Optional[str] = None,
                        db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    eq, error = await change_equipment_status(db, eq_id, new_status, current_user.id, comment)
    if error: raise HTTPException(status_code=400, detail=error)
    return eq

@router.get("/{eq_id}/status-history", response_model=List[StatusHistoryRead])
async def status_history(eq_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await get_status_history(db, eq_id)
