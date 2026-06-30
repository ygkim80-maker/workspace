from models import Project
from schemas import ProjectCreate, ProjectOut, ProjectUpdate

from routers._base import make_crud_router

router = make_crud_router(
    model=Project, create_schema=ProjectCreate, update_schema=ProjectUpdate, out_schema=ProjectOut,
    prefix="/api/v1/projects", tag="projects",
    search_fields=["name", "assignee"], status_field="status",
)
