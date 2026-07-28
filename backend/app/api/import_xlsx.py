import io
import re
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from openpyxl import load_workbook
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_admin
from app.database import get_db
from app.models import Equipment, EquipmentStatus, OperationLog, User, Warehouse

router = APIRouter(prefix="/api/import", tags=["import"])

STATUS_MAP = {
    "РАБОЧИЙ": EquipmentStatus.WORKING,
    "ТРЕБУЕТРЕМОНТА": EquipmentStatus.NEEDS_REPAIR,
    "ВРЕМОНТЕ": EquipmentStatus.IN_REPAIR,
    "НАСКЛАДЕ": EquipmentStatus.IN_WAREHOUSE,
    "ВЫДАН": EquipmentStatus.ISSUED,
    "СПИСАН": EquipmentStatus.DECOMMISSIONED,
}

HEADER_ALIASES = {
    "barcode": {"ШТРИХКОД", "BARCODE"},
    "name": {"НАИМЕНОВАНИЕ", "НАЗВАНИЕ", "NAME"},
    "serial_number": {"SN", "СЕРИЙНЫЙНОМЕР", "СЕРИЙНЫЙНОМЕРSN", "SERIALNUMBER"},
    "inventory_number": {"ИНВ", "ИНВЕНТАРНЫЙНОМЕР", "ИНВНОМЕР", "INVENTORYNUMBER"},
    "location": {"НАХОЖДЕНИЕ", "РАСПОЛОЖЕНИЕ", "СКЛАД", "АУДИТОРИЯ", "LOCATION"},
    "assigned_to": {"НАЗВАНИЕФАМИЛИЯ", "ФАМИЛИЯ", "ПОЛЬЗОВАТЕЛЬ"},
    "domain": {"ДОМЕН", "DOMAIN"},
    "comment": {"КОММЕНТАРИИ", "КОММЕНТАРИЙ", "ОПИСАНИЕ", "DESCRIPTION"},
    "status": {"ТЕКУЩИЙСТАТУС", "СТАТУС", "STATUS"},
    "category": {"КАТЕГОРИЯ", "CATEGORY"},
}


def normalize(value) -> str:
    return re.sub(r"[^A-ZА-ЯЁ0-9]", "", str(value or "").upper())


def text_value(value) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def header_map(headers) -> dict[str, int]:
    normalized_headers = {normalize(header): index for index, header in enumerate(headers) if header is not None}
    result = {}
    for field, aliases in HEADER_ALIASES.items():
        for alias in aliases:
            if alias in normalized_headers:
                result[field] = normalized_headers[alias]
                break
    return result


def row_value(row, columns: dict[str, int], field: str) -> str | None:
    column = columns.get(field)
    return text_value(row[column]) if column is not None and column < len(row) else None


async def get_or_create_warehouse(db: AsyncSession, name: str, cache: dict[str, Warehouse]) -> tuple[Warehouse, bool]:
    if name in cache:
        return cache[name], False
    result = await db.execute(select(Warehouse).where(Warehouse.name == name))
    warehouse = result.scalar_one_or_none()
    if not warehouse:
        warehouse = Warehouse(name=name, description="Создано при импорте Excel")
        db.add(warehouse)
        await db.flush()
        created = True
    else:
        created = False
    cache[name] = warehouse
    return warehouse, created


async def duplicate_exists(db: AsyncSession, serial_number: str | None, inventory_number: str | None, barcode: str | None) -> bool:
    filters = []
    if serial_number:
        filters.append(Equipment.serial_number == serial_number)
    if inventory_number:
        filters.append(Equipment.inventory_number == inventory_number)
    if barcode:
        filters.append(Equipment.barcode == barcode)
    if not filters:
        return False
    result = await db.execute(select(Equipment.id).where(or_(*filters)).limit(1))
    return result.scalar_one_or_none() is not None


@router.post("/xlsx")
async def import_from_xlsx(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    if not file.filename or not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(400, "Файл должен быть в формате .xlsx")

    try:
        workbook = load_workbook(io.BytesIO(await file.read()), data_only=True)
    except Exception as error:
        raise HTTPException(400, f"Не удалось прочитать Excel-файл: {error}") from error

    imported = 0
    skipped = 0
    created_locations = 0
    errors: list[str] = []
    warehouse_cache: dict[str, Warehouse] = {}

    for worksheet in workbook.worksheets:
        rows = worksheet.iter_rows(values_only=True)
        headers = next(rows, None)
        if not headers:
            continue
        columns = header_map(headers)
        has_identity = "serial_number" in columns or "inventory_number" in columns
        if not has_identity:
            errors.append(f"Лист «{worksheet.title}»: не найдены столбцы S/N или ИНВ")
            continue

        is_computer_sheet = "domain" in columns or "assigned_to" in columns or "name" in columns
        default_type = "computer" if is_computer_sheet else "printer"
        default_name = "Компьютер" if is_computer_sheet else "Принтер"

        for row_number, row in enumerate(rows, start=2):
            serial_number = row_value(row, columns, "serial_number")
            inventory_number = row_value(row, columns, "inventory_number")
            if not serial_number and not inventory_number:
                continue
            try:
                barcode = row_value(row, columns, "barcode") or f"AUTO-{uuid4().hex[:12].upper()}"
                if await duplicate_exists(db, serial_number, inventory_number, barcode):
                    errors.append(f"{worksheet.title}, строка {row_number}: позиция с таким S/N или ИНВ уже существует")
                    skipped += 1
                    continue

                location_name = row_value(row, columns, "location")
                warehouse_id = None
                if location_name:
                    warehouse, was_new = await get_or_create_warehouse(db, location_name, warehouse_cache)
                    warehouse_id = warehouse.id
                    if was_new:
                        created_locations += 1

                assigned_to = row_value(row, columns, "assigned_to")
                domain = row_value(row, columns, "domain")
                comment = row_value(row, columns, "comment")
                description_parts = []
                if domain:
                    description_parts.append(f"Домен: {domain}")
                if comment:
                    description_parts.append(comment)

                status_value = normalize(row_value(row, columns, "status"))
                status = STATUS_MAP.get(status_value, EquipmentStatus.WORKING if warehouse_id else EquipmentStatus.IN_WAREHOUSE)
                name = row_value(row, columns, "name") or default_name
                equipment = Equipment(
                    barcode=barcode,
                    name=name,
                    category=row_value(row, columns, "category") or "Компьютерная техника",
                    serial_number=serial_number,
                    inventory_number=inventory_number,
                    description="; ".join(description_parts) or None,
                    equipment_type=default_type,
                    location_label=assigned_to,
                    quantity=1,
                    minimum_quantity=0,
                    current_status=status,
                    current_warehouse_id=warehouse_id,
                )
                db.add(equipment)
                await db.flush()
                db.add(OperationLog(
                    user_id=current_user.id,
                    action="import",
                    object_type="equipment",
                    object_id=equipment.id,
                    details=f"Imported from Excel: {equipment.name}",
                ))
                imported += 1
            except Exception as error:
                errors.append(f"{worksheet.title}, строка {row_number}: {error}")
                skipped += 1

    await db.commit()
    return {
        "message": "Импорт завершён",
        "imported": imported,
        "skipped": skipped,
        "created_locations": created_locations,
        "errors": errors[:30],
    }
