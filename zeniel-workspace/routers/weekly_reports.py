import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import WeeklyReport, WeeklyReportItem
from schemas import (WeeklyReportCreate, WeeklyReportItemCreate, WeeklyReportItemOut,
                     WeeklyReportItemUpdate, WeeklyReportOut, WeeklyReportUpdate)

router = APIRouter(prefix="/api/v1/weekly-reports", tags=["weekly-reports"])

DEFAULT_CATEGORIES = ["3PL", "디버", "크립톤", "의약품", "리버스물류", "시장동향"]


def _report_out(report: WeeklyReport, db: Session) -> dict:
    items = (db.query(WeeklyReportItem)
             .filter(WeeklyReportItem.report_id == report.id)
             .order_by(WeeklyReportItem.sort_order)
             .all())
    return {
        "id": report.id,
        "week_label": report.week_label,
        "title": report.title,
        "team": report.team,
        "created_at": report.created_at,
        "updated_at": report.updated_at,
        "items": [
            {
                "id": i.id,
                "report_id": i.report_id,
                "category": i.category,
                "sort_order": i.sort_order,
                "done_items": i.done_items or "[]",
                "plan_items": i.plan_items or "[]",
            }
            for i in items
        ],
    }


@router.get("")
@router.get("/")
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(WeeklyReport).order_by(WeeklyReport.id.desc()).all()
    return [_report_out(r, db) for r in reports]


@router.post("")
@router.post("/")
def create_report(item: WeeklyReportCreate, db: Session = Depends(get_db)):
    obj = WeeklyReport(**item.dict())
    db.add(obj)
    db.flush()
    for idx, cat in enumerate(DEFAULT_CATEGORIES):
        db.add(WeeklyReportItem(report_id=obj.id, category=cat, sort_order=idx,
                                done_items="[]", plan_items="[]"))
    db.commit()
    db.refresh(obj)
    return _report_out(obj, db)


@router.get("/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db)):
    obj = db.get(WeeklyReport, report_id)
    if not obj:
        raise HTTPException(404, "Not found")
    return _report_out(obj, db)


@router.put("/{report_id}")
def update_report(report_id: int, item: WeeklyReportUpdate, db: Session = Depends(get_db)):
    obj = db.get(WeeklyReport, report_id)
    if not obj:
        raise HTTPException(404, "Not found")
    for k, v in item.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return _report_out(obj, db)


@router.delete("/{report_id}")
def delete_report(report_id: int, db: Session = Depends(get_db)):
    obj = db.get(WeeklyReport, report_id)
    if not obj:
        raise HTTPException(404, "Not found")
    db.query(WeeklyReportItem).filter(WeeklyReportItem.report_id == report_id).delete()
    db.delete(obj)
    db.commit()
    return {"ok": True}


# ── Items ──────────────────────────────────────────────────────────────────────

@router.put("/{report_id}/items/{item_id}")
def update_item(report_id: int, item_id: int, payload: WeeklyReportItemUpdate,
                db: Session = Depends(get_db)):
    obj = db.get(WeeklyReportItem, item_id)
    if not obj or obj.report_id != report_id:
        raise HTTPException(404, "Not found")
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.post("/{report_id}/items")
def add_item(report_id: int, payload: WeeklyReportItemCreate, db: Session = Depends(get_db)):
    obj = WeeklyReportItem(report_id=report_id, **payload.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{report_id}/items/{item_id}")
def delete_item(report_id: int, item_id: int, db: Session = Depends(get_db)):
    obj = db.get(WeeklyReportItem, item_id)
    if not obj:
        raise HTTPException(404, "Not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}
