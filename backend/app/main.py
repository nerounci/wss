from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.database import engine, Base, async_session
from app.crud import init_roles, init_admin
from app.config import get_settings
from app.limiter import limiter
from app.api import auth, equipment, warehouses, movements, logs, import_xlsx

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
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
