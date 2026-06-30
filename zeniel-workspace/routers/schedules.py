from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Schedule
from schemas import ScheduleCreate, ScheduleOut, ScheduleUpdate

router = APIRouter(prefix="/api/v1/schedules", tags=["schedules"])


def _list(month: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Schedule)
    if month:
        query = query.filter(Schedule.date.like(f"{month}%"))
    return query.order_by(Schedule.date.asc(), Schedule.time.asc()).all()


router.add_api_route("", _list, methods=["GET"], response_model=List[ScheduleOut])
router.add_api_route("/", _list, methods=["GET"], response_model=List[ScheduleOut], include_in_schema=False)


@router.get("/{item_id}", response_model=ScheduleOut)
def get_schedule(item_id: int, db: Session = Depends(get_db)):
    obj = db.get(Schedule, item_id)
    if not obj:
        raise HTTPException(404, "Not found")
    return obj


def _create(item: ScheduleCreate, db: Session = Depends(get_db)):
    obj = Schedule(**item.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


router.add_api_route("", _create, methods=["POST"], response_model=ScheduleOut)
router.add_api_route("/", _create, methods=["POST"], response_model=ScheduleOut, include_in_schema=False)


@router.put("/{item_id}", response_model=ScheduleOut)
def update_schedule(item_id: int, item: ScheduleUpdate, db: Session = Depends(get_db)):
    obj = db.get(Schedule, item_id)
    if not obj:
        raise HTTPException(404, "Not found")
    for k, v in item.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{item_id}")
def delete_schedule(item_id: int, db: Session = Depends(get_db)):
    obj = db.get(Schedule, item_id)
    if not obj:
        raise HTTPException(404, "Not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}
