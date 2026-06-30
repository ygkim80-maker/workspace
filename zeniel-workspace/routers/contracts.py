from models import Contract
from schemas import ContractCreate, ContractOut, ContractUpdate

from routers._base import make_crud_router

router = make_crud_router(
    model=Contract, create_schema=ContractCreate, update_schema=ContractUpdate, out_schema=ContractOut,
    prefix="/api/v1/contracts", tag="contracts",
)
