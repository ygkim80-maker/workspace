from routers._base import make_crud_router
from models import SafetyChecklist, SafetyGuide
from schemas import (SafetyChecklistCreate, SafetyChecklistUpdate, SafetyChecklistOut,
                     SafetyGuideCreate, SafetyGuideUpdate, SafetyGuideOut)

checklist_router = make_crud_router(
    prefix="/api/v1/safety_checklists",
    model=SafetyChecklist,
    create_schema=SafetyChecklistCreate,
    update_schema=SafetyChecklistUpdate,
    out_schema=SafetyChecklistOut,
    tag="safety_mgmt",
)

guide_router = make_crud_router(
    prefix="/api/v1/safety_guides",
    model=SafetyGuide,
    create_schema=SafetyGuideCreate,
    update_schema=SafetyGuideUpdate,
    out_schema=SafetyGuideOut,
    tag="safety_mgmt",
)
