from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, async_session
from app.crud import init_roles, init_admin
from app.api import auth, equipment, warehouses, movements, logs

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(equipment.router)
app.include_router(warehouses.router)
app.include_router(movements.router)
app.include_router(logs.router)
