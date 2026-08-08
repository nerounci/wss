from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.database import get_db
from app.schemas import OperationLogRead
from app.crud import get_logs
from app.auth import require_page

router = APIRouter(prefix="/api/logs", tags=["logs"])

@router.get("/", response_model=List[OperationLogRead])
async def list_logs(user_id: Optional[int] = None, action: Optional[str] = None, search: Optional[str] = None,
                    skip: int = 0, limit: int = 100,
                    db: AsyncSession = Depends(get_db), current_user = Depends(require_page("logs"))):
    return await get_logs(db, skip=skip, limit=limit, user_id=user_id, action=action, search=search)
