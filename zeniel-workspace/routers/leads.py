from models import Lead
from schemas import LeadCreate, LeadOut, LeadUpdate

from routers._base import make_crud_router

router = make_crud_router(
    model=Lead, create_schema=LeadCreate, update_schema=LeadUpdate, out_schema=LeadOut,
    prefix="/api/v1/leads", tag="leads",
    search_fields=["company", "contact"], status_field="status",
)
