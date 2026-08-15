from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import PagePermission, UserRole

PAGE_KEYS = [
    "dashboard", "equipment", "technology", "warehouses", "movements",
    "relocation", "scan", "import", "logs", "users", "admin_panel",
]

PAGE_LABELS = {
    "dashboard": "Дашборд",
    "equipment": "Оборудование",
    "technology": "Техника",
    "warehouses": "Склады и аудитории",
    "movements": "Перемещения",
    "relocation": "Перестановка",
    "scan": "Сканер",
    "import": "Импорт Excel",
    "logs": "Журнал",
    "users": "Пользователи",
    "admin_panel": "Админка (управление правами)",
}

ROLE_DEFAULT_PAGES = {
    UserRole.OWNER: {
        "dashboard", "equipment", "technology", "warehouses", "movements",
        "relocation", "scan", "import", "logs", "users", "admin_panel",
    },
    UserRole.ADMIN: {
        "dashboard", "equipment", "technology", "warehouses", "movements",
        "relocation", "scan", "import", "logs", "users",
    },
    UserRole.EMPLOYEE: {
        "dashboard", "equipment", "technology", "warehouses", "movements",
        "relocation", "scan",
    },
}


async def get_resolved_permissions(db: AsyncSession, user) -> dict[str, bool]:
    defaults = ROLE_DEFAULT_PAGES.get(user.role.name, set())
    result = await db.execute(select(PagePermission).where(PagePermission.user_id == user.id))
    overrides = {row.page_key: row.allowed for row in result.scalars().all()}
    return {key: overrides.get(key, key in defaults) for key in PAGE_KEYS}


async def user_has_page_access(db: AsyncSession, user, page_key: str) -> bool:
    result = await db.execute(
        select(PagePermission).where(PagePermission.user_id == user.id, PagePermission.page_key == page_key)
    )
    override = result.scalar_one_or_none()
    if override is not None:
        return override.allowed
    return page_key in ROLE_DEFAULT_PAGES.get(user.role.name, set())
