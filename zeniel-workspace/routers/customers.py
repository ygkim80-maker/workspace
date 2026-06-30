from models import Customer
from schemas import CustomerCreate, CustomerOut, CustomerUpdate

from routers._base import make_crud_router

router = make_crud_router(
    model=Customer, create_schema=CustomerCreate, update_schema=CustomerUpdate, out_schema=CustomerOut,
    prefix="/api/v1/customers", tag="customers",
    search_fields=["company", "contact"],
)
