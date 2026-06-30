from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import get_db


def make_crud_router(*, model, create_schema, update_schema, out_schema, prefix, tag,
                      search_fields=None, status_field=None, order_by="-id"):
    router = APIRouter(prefix=prefix, tags=[tag])
    search_fields = search_fields or []
    order_col = order_by.lstrip("-")
    descending = order_by.startswith("-")

    def _list(q: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
        query = db.query(model)
        if q and search_fields:
            conds = [getattr(model, f).ilike(f"%{q}%") for f in search_fields]
            query = query.filter(or_(*conds))
        if status and status_field:
            query = query.filter(getattr(model, status_field) == status)
        col = getattr(model, order_col)
        query = query.order_by(col.desc() if descending else col.asc())
        return query.all()

    router.add_api_route("", _list, methods=["GET"], response_model=List[out_schema])
    router.add_api_route("/", _list, methods=["GET"], response_model=List[out_schema], include_in_schema=False)

    @router.get("/{item_id}", response_model=out_schema)
    def get_item(item_id: int, db: Session = Depends(get_db)):
        obj = db.get(model, item_id)
        if not obj:
            raise HTTPException(404, "Not found")
        return obj

    def _create(item: create_schema, db: Session = Depends(get_db)):
        obj = model(**item.dict())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    router.add_api_route("", _create, methods=["POST"], response_model=out_schema)
    router.add_api_route("/", _create, methods=["POST"], response_model=out_schema, include_in_schema=False)

    @router.put("/{item_id}", response_model=out_schema)
    def update_item(item_id: int, item: update_schema, db: Session = Depends(get_db)):
        obj = db.get(model, item_id)
        if not obj:
            raise HTTPException(404, "Not found")
        for k, v in item.dict(exclude_unset=True).items():
            setattr(obj, k, v)
        db.commit()
        db.refresh(obj)
        return obj

    @router.delete("/{item_id}")
    def delete_item(item_id: int, db: Session = Depends(get_db)):
        obj = db.get(model, item_id)
        if not obj:
            raise HTTPException(404, "Not found")
        db.delete(obj)
        db.commit()
        return {"ok": True}

    return router
