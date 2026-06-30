from models import Issue
from schemas import IssueCreate, IssueOut, IssueUpdate

from routers._base import make_crud_router

router = make_crud_router(
    model=Issue, create_schema=IssueCreate, update_schema=IssueUpdate, out_schema=IssueOut,
    prefix="/api/v1/issues", tag="issues",
    search_fields=["title", "assignee"], status_field="status",
)
