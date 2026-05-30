from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime

from app.models import User, Role, Equipment, Warehouse, Movement, StatusHistory, OperationLog, EquipmentStatus
from app.schemas import UserCreate, EquipmentCreate, EquipmentUpdate, WarehouseCreate, WarehouseUpdate, MovementCreate
from app.auth import get_password_hash

async def create_user(db: AsyncSession, user: UserCreate):
    hashed_pw = get_password_hash(user.password)
    db_user = User(username=user.username, hashed_password=hashed_pw, full_name=user.full_name, role_id=user.role_id)
    db.add(db_user)
    await db.commit()
    result = await db.execute(
        select(User).where(User.id == db_user.id).options(selectinload(User.role))
    )
    return result.scalar_one()

async def get_user_by_username(db: AsyncSession, username: str):
    result = await db.execute(
        select(User).where(User.username == username).options(selectinload(User.role))
    )
    return result.scalar_one_or_none()

async def get_roles(db: AsyncSession):
    result = await db.execute(select(Role))
    return result.scalars().all()

async def init_roles(db: AsyncSession):
    roles = await get_roles(db)
    if not roles:
        db.add_all([Role(name="admin"), Role(name="employee")])
        await db.commit()

async def init_admin(db: AsyncSession):
    admin_role = await db.execute(select(Role).where(Role.name == "admin"))
    admin_role = admin_role.scalar_one()
    admin_user = await get_user_by_username(db, "admin")
    if not admin_user:
        await create_user(db, UserCreate(username="admin", password="admin", full_name="Administrator", role_id=admin_role.id))

async def create_equipment(db: AsyncSession, equipment: EquipmentCreate):
    db_eq = Equipment(**equipment.model_dump())
    db.add(db_eq)
    await db.commit()
    await db.refresh(db_eq)
    return db_eq

async def get_equipments(db: AsyncSession, skip=0, limit=100, search=None, barcode=None, category=None, status=None, warehouse_id=None):
    query = select(Equipment).options(selectinload(Equipment.warehouse))
    if search: query = query.where(Equipment.name.ilike(f"%{search}%"))
    if barcode: query = query.where(Equipment.barcode == barcode)
    if category: query = query.where(Equipment.category.ilike(f"%{category}%"))
    if status: query = query.where(Equipment.current_status == status)
    if warehouse_id is not None: query = query.where(Equipment.current_warehouse_id == warehouse_id)
    query = query.offset(skip).limit(limit).order_by(Equipment.id)
    result = await db.execute(query)
    return result.scalars().all()

async def get_equipment_by_id(db: AsyncSession, eq_id: int):
    result = await db.execute(
        select(Equipment).where(Equipment.id == eq_id).options(selectinload(Equipment.warehouse))
    )
    return result.scalar_one_or_none()

async def update_equipment(db: AsyncSession, eq_id: int, updates: EquipmentUpdate):
    eq = await get_equipment_by_id(db, eq_id)
    if not eq: return None
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(eq, field, value)
    await db.commit()
    await db.refresh(eq)
    return eq

async def delete_equipment(db: AsyncSession, eq_id: int):
    eq = await get_equipment_by_id(db, eq_id)
    if eq:
        await db.delete(eq)
        await db.commit()
    return eq

async def change_equipment_status(db: AsyncSession, eq_id: int, new_status: EquipmentStatus, user_id: int, comment: Optional[str] = None):
    eq = await get_equipment_by_id(db, eq_id)
    if not eq: return None, "Equipment not found"
    old_status = eq.current_status
    eq.current_status = new_status
    history = StatusHistory(equipment_id=eq.id, old_status=old_status, new_status=new_status, changed_by_user_id=user_id, comment=comment)
    db.add(history)
    log = OperationLog(user_id=user_id, action="change_status", object_type="equipment", object_id=eq.id, details=f"Status changed from {old_status} to {new_status}")
    db.add(log)
    await db.commit()
    await db.refresh(eq)
    return eq, None

async def get_status_history(db: AsyncSession, eq_id: int):
    result = await db.execute(
        select(StatusHistory).where(StatusHistory.equipment_id == eq_id)
        .options(selectinload(StatusHistory.changed_by))
        .order_by(desc(StatusHistory.timestamp))
    )
    return result.scalars().all()

async def create_warehouse(db: AsyncSession, wh: WarehouseCreate):
    db_wh = Warehouse(**wh.model_dump())
    db.add(db_wh)
    await db.commit()
    await db.refresh(db_wh)
    return db_wh

async def get_warehouses(db: AsyncSession, skip=0, limit=100):
    result = await db.execute(select(Warehouse).offset(skip).limit(limit).order_by(Warehouse.id))
    return result.scalars().all()

async def get_warehouse_by_id(db: AsyncSession, wh_id: int):
    result = await db.execute(select(Warehouse).where(Warehouse.id == wh_id))
    return result.scalar_one_or_none()

async def update_warehouse(db: AsyncSession, wh_id: int, updates: WarehouseUpdate):
    wh = await get_warehouse_by_id(db, wh_id)
    if not wh: return None
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(wh, field, value)
    await db.commit()
    await db.refresh(wh)
    return wh

async def delete_warehouse(db: AsyncSession, wh_id: int):
    wh = await get_warehouse_by_id(db, wh_id)
    if wh:
        await db.delete(wh)
        await db.commit()
    return wh

async def create_movement(db: AsyncSession, move: MovementCreate, user_id: int):
    eq = await get_equipment_by_id(db, move.equipment_id)
    if not eq: return None, "Equipment not found"
    if eq.current_warehouse_id == move.to_warehouse_id: return None, "Equipment already at this warehouse"
    from_wh_id = eq.current_warehouse_id
    if from_wh_id is None: return None, "Equipment has no current warehouse"
    db_move = Movement(equipment_id=move.equipment_id, from_warehouse_id=from_wh_id, to_warehouse_id=move.to_warehouse_id, user_id=user_id, comment=move.comment)
    eq.current_warehouse_id = move.to_warehouse_id
    db.add(db_move)
    log = OperationLog(user_id=user_id, action="move", object_type="equipment", object_id=eq.id, details=f"Moved from warehouse {from_wh_id} to {move.to_warehouse_id}")
    db.add(log)
    await db.commit()
    await db.refresh(db_move)
    return db_move, None

async def get_movements(db: AsyncSession, skip=0, limit=100, equipment_id=None, user_id=None, start_date=None, end_date=None):
    query = select(Movement).options(
        selectinload(Movement.equipment),
        selectinload(Movement.from_warehouse),
        selectinload(Movement.to_warehouse),
        selectinload(Movement.user)
    )
    if equipment_id: query = query.where(Movement.equipment_id == equipment_id)
    if user_id: query = query.where(Movement.user_id == user_id)
    if start_date: query = query.where(Movement.timestamp >= start_date)
    if end_date: query = query.where(Movement.timestamp <= end_date)
    query = query.order_by(desc(Movement.timestamp)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def get_logs(db: AsyncSession, skip=0, limit=100, user_id=None, action=None):
    query = select(OperationLog).options(selectinload(OperationLog.user))
    if user_id: query = query.where(OperationLog.user_id == user_id)
    if action: query = query.where(OperationLog.action == action)
    query = query.order_by(desc(OperationLog.timestamp)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def get_warehouse_equipment(db: AsyncSession, wh_id: int):
    result = await db.execute(
        select(Equipment).where(Equipment.current_warehouse_id == wh_id)
    )
    return result.scalars().all()
