from models import Task
from schemas import TaskCreate, TaskOut, TaskUpdate

from routers._base import make_crud_router

router = make_crud_router(
    model=Task, create_schema=TaskCreate, update_schema=TaskUpdate, out_schema=TaskOut,
    prefix="/api/v1/tasks", tag="tasks",
    search_fields=["title", "assignee"],
)
