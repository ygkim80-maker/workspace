from models import EmailLog
from schemas import EmailLogCreate, EmailLogOut, EmailLogUpdate

from routers._base import make_crud_router

router = make_crud_router(
    model=EmailLog, create_schema=EmailLogCreate, update_schema=EmailLogUpdate, out_schema=EmailLogOut,
    prefix="/api/v1/emails", tag="emails",
    search_fields=["to_company", "subject"], status_field="status",
)
