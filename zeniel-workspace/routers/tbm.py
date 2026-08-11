from routers._base import make_crud
from models import TBM
from schemas import TBMCreate, TBMUpdate, TBMOut

router = make_crud(
    prefix="/api/v1/tbm",
    model=TBM,
    create_schema=TBMCreate,
    update_schema=TBMUpdate,
    out_schema=TBMOut,
    tags=["tbm"],
)
