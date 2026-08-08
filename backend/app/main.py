from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from app.database import engine, Base, async_session
from app.crud import init_roles, init_admin
from app.config import get_settings
from app.limiter import limiter
from app.api import auth, equipment, warehouses, movements, logs, import_xlsx, dashboard

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("ALTER TABLE equipment ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1"))
        await conn.execute(text("ALTER TABLE equipment ADD COLUMN IF NOT EXISTS minimum_quantity INTEGER NOT NULL DEFAULT 0"))
        await conn.execute(text("ALTER TABLE equipment ADD COLUMN IF NOT EXISTS equipment_type VARCHAR(50)"))
        await conn.execute(text("ALTER TABLE equipment ADD COLUMN IF NOT EXISTS location_label VARCHAR(200)"))
        await conn.execute(text("ALTER TABLE movements ALTER COLUMN from_warehouse_id DROP NOT NULL"))
        await conn.execute(text("ALTER TABLE movements ALTER COLUMN to_warehouse_id DROP NOT NULL"))
    async with async_session() as session:
        await init_roles(session)
        await init_admin(session)
    yield
    await engine.dispose()

app = FastAPI(title="Warehouse Storage System", version="1.0.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(equipment.router)
app.include_router(warehouses.router)
app.include_router(movements.router)
app.include_router(logs.router)
app.include_router(import_xlsx.router)
app.include_router(dashboard.router)
