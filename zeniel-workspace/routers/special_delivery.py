from routers._base import make_crud_router
from models import CardDelivery, BranchStaff, BranchIssue
from schemas import (CardDeliveryCreate, CardDeliveryUpdate, CardDeliveryOut,
                     BranchStaffCreate, BranchStaffUpdate, BranchStaffOut,
                     BranchIssueCreate, BranchIssueUpdate, BranchIssueOut)

card_delivery_router = make_crud_router(
    prefix="/api/v1/card_deliveries",
    model=CardDelivery,
    create_schema=CardDeliveryCreate,
    update_schema=CardDeliveryUpdate,
    out_schema=CardDeliveryOut,
    tag="special_delivery",
)

branch_staff_router = make_crud_router(
    prefix="/api/v1/branch_staff",
    model=BranchStaff,
    create_schema=BranchStaffCreate,
    update_schema=BranchStaffUpdate,
    out_schema=BranchStaffOut,
    tag="special_delivery",
)

branch_issue_router = make_crud_router(
    prefix="/api/v1/branch_issues",
    model=BranchIssue,
    create_schema=BranchIssueCreate,
    update_schema=BranchIssueUpdate,
    out_schema=BranchIssueOut,
    tag="special_delivery",
)
