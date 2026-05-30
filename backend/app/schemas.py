from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRoleEnum(str, Enum):
    ADMIN = "admin"
    EMPLOYEE = "employee"

class EquipmentStatusEnum(str, Enum):
    WORKING = "Рабочий"
    NEEDS_REPAIR = "Требует ремонта"
    IN_REPAIR = "В ремонте"
    IN_WAREHOUSE = "На складе"
    ISSUED = "Выдан"
    DECOMMISSIONED = "Списан"

class RoleRead(BaseModel):
    id: int
    name: UserRoleEnum
    class Config: from_attributes = True

class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    role_id: int

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    role: Optional[RoleRead] = None
    class Config: from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class WarehouseBase(BaseModel):
    name: str
    address: Optional[str] = None
    description: Optional[str] = None

class WarehouseCreate(WarehouseBase): pass

class WarehouseUpdate(WarehouseBase): pass

class WarehouseRead(WarehouseBase):
    id: int
    class Config: from_attributes = True

class EquipmentBase(BaseModel):
    barcode: str
    name: str
    category: Optional[str] = None
    serial_number: Optional[str] = None
    inventory_number: Optional[str] = None
    description: Optional[str] = None
    current_status: EquipmentStatusEnum = EquipmentStatusEnum.IN_WAREHOUSE
    current_warehouse_id: Optional[int] = None

class EquipmentCreate(EquipmentBase): pass

class EquipmentUpdate(BaseModel):
    barcode: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    serial_number: Optional[str] = None
    inventory_number: Optional[str] = None
    description: Optional[str] = None
    current_status: Optional[EquipmentStatusEnum] = None
    current_warehouse_id: Optional[int] = None

class EquipmentRead(EquipmentBase):
    id: int
    created_at: datetime
    warehouse: Optional[WarehouseRead] = None
    class Config: from_attributes = True

class StatusHistoryRead(BaseModel):
    id: int
    equipment_id: int
    old_status: Optional[EquipmentStatusEnum] = None
    new_status: EquipmentStatusEnum
    changed_by_user_id: Optional[int] = None
    comment: Optional[str] = None
    timestamp: datetime
    changed_by: Optional[UserRead] = None
    class Config: from_attributes = True

class MovementCreate(BaseModel):
    equipment_id: int
    to_warehouse_id: int
    comment: Optional[str] = None

class MovementRead(BaseModel):
    id: int
    equipment_id: int
    from_warehouse_id: int
    to_warehouse_id: int
    user_id: int
    comment: Optional[str] = None
    timestamp: datetime
    equipment: Optional[EquipmentRead] = None
    from_warehouse: Optional[WarehouseRead] = None
    to_warehouse: Optional[WarehouseRead] = None
    user: Optional[UserRead] = None
    class Config: from_attributes = True

class OperationLogRead(BaseModel):
    id: int
    user_id: int
    action: str
    object_type: Optional[str] = None
    object_id: Optional[int] = None
    details: Optional[str] = None
    timestamp: datetime
    user: Optional[UserRead] = None
    class Config: from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None
