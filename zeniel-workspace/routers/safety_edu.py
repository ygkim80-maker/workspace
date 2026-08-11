from routers._base import make_crud_router
from models import SafetyEdu
from schemas import SafetyEduCreate, SafetyEduUpdate, SafetyEduOut

router = make_crud_router(
    prefix="/api/v1/safety_edu",
    model=SafetyEdu,
    create_schema=SafetyEduCreate,
    update_schema=SafetyEduUpdate,
    out_schema=SafetyEduOut,
    tag="safety_edu",
)
