from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from pydantic import BaseModel, Field

from app.database import get_db
from app.schemas import WarehouseCreate, WarehouseRead, WarehouseUpdate, EquipmentRead
from app.crud import create_warehouse, get_warehouses, get_warehouse_by_id, update_warehouse, delete_warehouse, delete_warehouses_batch, get_warehouse_equipment
from app.auth import get_current_user, get_current_admin
from app.models import User

class BatchDeleteRequest(BaseModel):
    ids: List[int] = Field(min_length=1)

router = APIRouter(prefix="/api/warehouses", tags=["warehouses"])

@router.get("/", response_model=List[WarehouseRead])
async def list_warehouses(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    return await get_warehouses(db, skip=skip, limit=limit)

@router.post("/", response_model=WarehouseRead)
async def new_warehouse(warehouse: WarehouseCreate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_admin)):
    return await create_warehouse(db, warehouse)

@router.get("/{wh_id}", response_model=WarehouseRead)
async def get_warehouse(wh_id: int, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    wh = await get_warehouse_by_id(db, wh_id)
    if not wh: raise HTTPException(status_code=404, detail="Not found")
    return wh

@router.put("/{wh_id}", response_model=WarehouseRead)
async def update_warehouse_endpoint(wh_id: int, updates: WarehouseUpdate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_admin)):
    wh = await update_warehouse(db, wh_id, updates)
    if not wh: raise HTTPException(status_code=404, detail="Not found")
    return wh

@router.delete("/batch")
async def delete_warehouses_batch_endpoint(payload: BatchDeleteRequest, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_admin)):
    deleted, errors = await delete_warehouses_batch(db, payload.ids)
    return {"deleted": deleted, "errors": errors}

@router.delete("/{wh_id}", status_code=204)
async def delete_warehouse_endpoint(wh_id: int, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_admin)):
    wh, error = await delete_warehouse(db, wh_id)
    if error == "Warehouse not found":
        raise HTTPException(status_code=404, detail=error)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"ok": True}

@router.get("/{wh_id}/equipment", response_model=List[EquipmentRead])
async def warehouse_equipment(wh_id: int, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    return await get_warehouse_equipment(db, wh_id)
