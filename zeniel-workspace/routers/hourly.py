from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import HourlyVolume
from schemas import HourlyVolumeCreate, HourlyVolumeOut, HourlyVolumeUpdate
from routers._base import make_crud_router

router = make_crud_router(
    prefix="/api/v1/hourly",
    model=HourlyVolume,
    create_schema=HourlyVolumeCreate,
    update_schema=HourlyVolumeUpdate,
    out_schema=HourlyVolumeOut,
    tag="hourly",
)


@router.get("/summary/{date}")
def daily_summary(date: str, db: Session = Depends(get_db)):
    rows = db.query(HourlyVolume).filter(HourlyVolume.date == date).order_by(HourlyVolume.hour).all()
    total_target = sum(r.target or 0 for r in rows)
    total_actual = sum(r.actual or 0 for r in rows)
    total_workers = sum(r.worker_count or 0 for r in rows)
    rate = round(total_actual / total_target * 100, 1) if total_target else 0
    by_hour = [{"hour": r.hour, "site": r.site, "target": r.target,
                "actual": r.actual, "worker_count": r.worker_count, "notes": r.notes}
               for r in rows]
    return {"date": date, "total_target": total_target, "total_actual": total_actual,
            "total_workers": total_workers, "rate": rate, "by_hour": by_hour}
