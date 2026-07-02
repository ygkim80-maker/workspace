from models import Document
from schemas import DocumentCreate, DocumentOut, DocumentUpdate

from routers._base import make_crud_router

router = make_crud_router(
    model=Document, create_schema=DocumentCreate, update_schema=DocumentUpdate, out_schema=DocumentOut,
    prefix="/api/v1/documents", tag="documents",
    search_fields=["title", "content"], status_field="category",
)
