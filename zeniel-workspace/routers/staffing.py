from routers._base import make_crud_router
from models import Staffing
from schemas import StaffingCreate, StaffingUpdate, StaffingOut

router = make_crud_router(
    prefix="/api/v1/staffing",
    model=Staffing,
    create_schema=StaffingCreate,
    update_schema=StaffingUpdate,
    out_schema=StaffingOut,
    tag="staffing",
)
