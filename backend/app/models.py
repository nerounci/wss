from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SAEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    EMPLOYEE = "employee"

class EquipmentStatus(str, enum.Enum):
    WORKING = "Рабочий"
    NEEDS_REPAIR = "Требует ремонта"
    IN_REPAIR = "В ремонте"
    IN_WAREHOUSE = "На складе"
    ISSUED = "Выдан"
    DECOMMISSIONED = "Списан"

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200))
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    role = relationship("Role", back_populates="users")
    movements = relationship("Movement", back_populates="user")
    status_changes = relationship("StatusHistory", back_populates="changed_by")
    logs = relationship("OperationLog", back_populates="user")

class Warehouse(Base):
    __tablename__ = "warehouses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    address = Column(String(300))
    description = Column(Text)
    equipments = relationship("Equipment", back_populates="warehouse")
    movements_from = relationship("Movement", foreign_keys="Movement.from_warehouse_id", back_populates="from_warehouse")
    movements_to = relationship("Movement", foreign_keys="Movement.to_warehouse_id", back_populates="to_warehouse")

class Equipment(Base):
    __tablename__ = "equipment"
    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String(100), unique=True, index=True)
    name = Column(String(300), nullable=False)
    category = Column(String(200))
    serial_number = Column(String(200))
    inventory_number = Column(String(200))
    description = Column(Text)
    current_status = Column(SAEnum(EquipmentStatus), default=EquipmentStatus.IN_WAREHOUSE)
    current_warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    warehouse = relationship("Warehouse", back_populates="equipments")
    status_histories = relationship("StatusHistory", back_populates="equipment")
    movements = relationship("Movement", back_populates="equipment")

class StatusHistory(Base):
    __tablename__ = "status_history"
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    old_status = Column(SAEnum(EquipmentStatus))
    new_status = Column(SAEnum(EquipmentStatus), nullable=False)
    changed_by_user_id = Column(Integer, ForeignKey("users.id"))
    comment = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    equipment = relationship("Equipment", back_populates="status_histories")
    changed_by = relationship("User", back_populates="status_changes")

class Movement(Base):
    __tablename__ = "movements"
    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"), nullable=False)
    from_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    to_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    comment = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    equipment = relationship("Equipment", back_populates="movements")
    from_warehouse = relationship("Warehouse", foreign_keys=[from_warehouse_id], back_populates="movements_from")
    to_warehouse = relationship("Warehouse", foreign_keys=[to_warehouse_id], back_populates="movements_to")
    user = relationship("User", back_populates="movements")

class OperationLog(Base):
    __tablename__ = "operation_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(200), nullable=False)
    object_type = Column(String(100))
    object_id = Column(Integer)
    details = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="logs")
