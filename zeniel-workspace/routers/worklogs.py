from models import WorkLog
from schemas import WorkLogCreate, WorkLogOut, WorkLogUpdate

from routers._base import make_crud_router

router = make_crud_router(
    model=WorkLog, create_schema=WorkLogCreate, update_schema=WorkLogUpdate, out_schema=WorkLogOut,
    prefix="/api/v1/worklogs", tag="worklogs",
    search_fields=["site", "work_type"], order_by="-date",
)
