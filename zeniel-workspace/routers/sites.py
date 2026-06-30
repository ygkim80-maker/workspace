from models import Site
from schemas import SiteCreate, SiteOut, SiteUpdate

from routers._base import make_crud_router

router = make_crud_router(
    model=Site, create_schema=SiteCreate, update_schema=SiteUpdate, out_schema=SiteOut,
    prefix="/api/v1/sites", tag="sites",
    search_fields=["name", "assignee"], status_field="status",
)
