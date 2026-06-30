from models import Meeting
from schemas import MeetingCreate, MeetingOut, MeetingUpdate

from routers._base import make_crud_router

router = make_crud_router(
    model=Meeting, create_schema=MeetingCreate, update_schema=MeetingUpdate, out_schema=MeetingOut,
    prefix="/api/v1/meetings", tag="meetings",
    search_fields=["title", "counterpart"],
)
