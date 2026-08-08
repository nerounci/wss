"""
Наполняет базу демо-данными для ручного тестирования (аудитории/склады, оборудование, перемещения, пользователь).
Запуск: docker compose exec backend python seed_demo_data.py
Идемпотентен: при повторном запуске пропускает уже существующие записи (проверка по имени/штрихкоду).
"""
import asyncio

from sqlalchemy import select

from app.database import async_session
from app.models import EquipmentStatus, Role, User, Warehouse, Equipment
from app import crud
from app.schemas import EquipmentCreate, UserCreate, WarehouseCreate, MovementCreate

WAREHOUSES = [
    {"name": "Аудитория 101", "address": None, "description": "Учебная аудитория, 1 этаж"},
    {"name": "Аудитория 205", "address": None, "description": "Учебная аудитория, 2 этаж"},
    {"name": "Склад техники", "address": None, "description": "Основной склад"},
    {"name": "Комната для списания", "address": None, "description": "Временное хранение перед списанием"},
]

EQUIPMENT = [
    {"barcode": "DEMO-001", "name": "Ноутбук Dell Latitude", "category": "Компьютерная техника",
     "equipment_type": "computer", "current_status": EquipmentStatus.WORKING, "warehouse": "Аудитория 101"},
    {"barcode": "DEMO-002", "name": "Проектор Epson EB-X05", "category": "Проекционное оборудование",
     "equipment_type": "other", "current_status": EquipmentStatus.NEEDS_REPAIR, "warehouse": "Аудитория 101"},
    {"barcode": "DEMO-003", "name": "Принтер HP LaserJet", "category": "Оргтехника",
     "equipment_type": "printer", "current_status": EquipmentStatus.IN_WAREHOUSE, "warehouse": "Аудитория 205"},
    {"barcode": "DEMO-004", "name": "Компьютер учебный №12", "category": "Компьютерная техника",
     "equipment_type": "computer", "current_status": EquipmentStatus.ISSUED, "warehouse": "Склад техники"},
    {"barcode": "DEMO-005", "name": "Монитор Samsung 24\"", "category": "Периферия",
     "equipment_type": "monitor", "current_status": EquipmentStatus.DECOMMISSIONED, "warehouse": "Склад техники"},
    {"barcode": "DEMO-006", "name": "Клавиатура Logitech", "category": "Периферия",
     "equipment_type": "other", "current_status": EquipmentStatus.WORKING, "warehouse": "Аудитория 205"},
]

EMPLOYEE = {"username": "ivanov", "password": "employee123", "full_name": "Иванов И.И."}


async def main():
    async with async_session() as db:
        warehouses_by_name: dict[str, Warehouse] = {}
        for wh_data in WAREHOUSES:
            existing = (await db.execute(select(Warehouse).where(Warehouse.name == wh_data["name"]))).scalar_one_or_none()
            if existing:
                warehouses_by_name[wh_data["name"]] = existing
                continue
            wh = await crud.create_warehouse(db, WarehouseCreate(**wh_data))
            warehouses_by_name[wh_data["name"]] = wh
            print(f"+ склад/аудитория: {wh.name}")

        employee_role = (await db.execute(select(Role).where(Role.name == "employee"))).scalar_one()
        employee = (await db.execute(select(User).where(User.username == EMPLOYEE["username"]))).scalar_one_or_none()
        if not employee:
            employee = await crud.create_user(db, UserCreate(
                username=EMPLOYEE["username"], password=EMPLOYEE["password"],
                full_name=EMPLOYEE["full_name"], role_id=employee_role.id,
            ))
            print(f"+ пользователь: {employee.username} / пароль: {EMPLOYEE['password']} (роль: employee)")
        admin_for_ops = (await db.execute(select(User).where(User.username == "admin"))).scalar_one()

        equipment_by_barcode: dict[str, Equipment] = {}
        newly_created_barcodes: set[str] = set()
        for eq_data in EQUIPMENT:
            existing = (await db.execute(select(Equipment).where(Equipment.barcode == eq_data["barcode"]))).scalar_one_or_none()
            if existing:
                equipment_by_barcode[eq_data["barcode"]] = existing
                continue
            warehouse = warehouses_by_name[eq_data["warehouse"]]
            eq = await crud.create_equipment(db, EquipmentCreate(
                barcode=eq_data["barcode"], name=eq_data["name"], category=eq_data["category"],
                equipment_type=eq_data["equipment_type"], current_status=eq_data["current_status"],
                current_warehouse_id=warehouse.id,
            ), user_id=admin_for_ops.id)
            equipment_by_barcode[eq_data["barcode"]] = eq
            newly_created_barcodes.add(eq_data["barcode"])
            print(f"+ оборудование: {eq.name} ({eq.barcode}) -> {warehouse.name}, статус: {eq.current_status.value}")

        # Демонстрация: оборудование заезжало в "Комнату для списания" и уехало обратно —
        # склад сейчас пуст, но фигурирует в истории перемещений (тест на фикс удаления складов).
        if "DEMO-005" in newly_created_barcodes:
            demo_eq = equipment_by_barcode["DEMO-005"]
            writeoff_room = warehouses_by_name["Комната для списания"]
            storage = warehouses_by_name["Склад техники"]
            move1, err1 = await crud.create_movement(db, MovementCreate(
                equipment_id=demo_eq.id, to_warehouse_id=writeoff_room.id, comment="Перенесли для списания"
            ), user_id=admin_for_ops.id)
            if move1:
                await crud.create_movement(db, MovementCreate(
                    equipment_id=demo_eq.id, to_warehouse_id=storage.id, comment="Вернули обратно на склад"
                ), user_id=admin_for_ops.id)
                print("+ история перемещений через 'Комнату для списания' создана (сейчас пуста, но есть в истории)")

        print("\nГотово. Демо-данные наполнены (или уже были).")


if __name__ == "__main__":
    asyncio.run(main())
