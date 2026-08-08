from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.crud import get_dashboard_summary
from app.database import get_db
from app.models import User
from app.schemas import DashboardSummary

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/", response_model=DashboardSummary)
async def read_dashboard(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await get_dashboard_summary(db)
