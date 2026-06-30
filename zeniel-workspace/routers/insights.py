from models import Insight
from schemas import InsightCreate, InsightOut, InsightUpdate

from routers._base import make_crud_router

router = make_crud_router(
    model=Insight, create_schema=InsightCreate, update_schema=InsightUpdate, out_schema=InsightOut,
    prefix="/api/v1/insights", tag="insights",
    search_fields=["title", "content", "tags"],
)
