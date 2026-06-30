from models import Deal
from schemas import DealCreate, DealOut, DealUpdate

from routers._base import make_crud_router

router = make_crud_router(
    model=Deal, create_schema=DealCreate, update_schema=DealUpdate, out_schema=DealOut,
    prefix="/api/v1/pipeline", tag="pipeline",
    search_fields=["company", "contact"], status_field="stage",
)
