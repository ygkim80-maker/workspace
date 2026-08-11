from routers._base import make_crud_router
from models import TBM
from schemas import TBMCreate, TBMUpdate, TBMOut

router = make_crud_router(
    prefix="/api/v1/tbm",
    model=TBM,
    create_schema=TBMCreate,
    update_schema=TBMUpdate,
    out_schema=TBMOut,
    tag="tbm",
)
