from datetime import datetime, timedelta

from fastapi import Depends, FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

import models
from database import Base, SessionLocal, engine, get_db
from models import (Contract, Customer, Deal, Document, EmailLog, FeedComment, FeedPost, Insight,
                     Issue, Lead, Meeting, Project, Schedule, Site, Task, User, WorkLog)
from routers import (contracts, customers, documents, emails, feed, insights, issues, leads,
                      meetings, pipeline, projects, schedules, sites, tasks, worklogs)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ZENIEL WORKSPACE")
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

STAGES = ["발굴", "접촉", "제안", "협상", "수주", "탈락"]

for r in (leads.router, customers.router, pipeline.router, projects.router, contracts.router,
          sites.router, issues.router, meetings.router, emails.router, tasks.router,
          schedules.router, insights.router, worklogs.router, documents.router, feed.router):
    app.include_router(r)


@app.get("/")
def index(request: Request):
    return templates.TemplateResponse(request, "index.html", {})


@app.get("/api/v1/dashboard")
def dashboard(db: Session = Depends(get_db)):
    leads_count = db.query(Lead).count()
    active_projects = db.query(Project).filter(Project.status == "진행중").count()
    pending_tasks = db.query(Task).filter(Task.done.is_(False)).count()
    total_revenue = db.query(func.sum(Project.revenue)).scalar() or 0

    pipeline_stages = {s: 0 for s in STAGES}
    for stage, cnt in db.query(Deal.stage, func.count(Deal.id)).group_by(Deal.stage):
        if stage in pipeline_stages:
            pipeline_stages[stage] = cnt

    recent_leads = db.query(Lead).order_by(Lead.id.desc()).limit(5).all()
    recent_meetings = db.query(Meeting).order_by(Meeting.id.desc()).limit(5).all()
    recent_tasks = db.query(Task).order_by(Task.id.desc()).limit(5).all()

    return {
        "kpi": {
            "leads": leads_count,
            "active_projects": active_projects,
            "pending_tasks": pending_tasks,
            "total_revenue": total_revenue,
        },
        "pipeline_stages": pipeline_stages,
        "recent_leads": [
            {"company": l.company, "status": l.status, "created_at": l.created_at.isoformat() if l.created_at else None}
            for l in recent_leads
        ],
        "recent_meetings": [
            {"title": m.title, "counterpart": m.counterpart, "date": m.date} for m in recent_meetings
        ],
        "recent_tasks": [
            {"title": t.title, "done": t.done, "due_date": t.due_date} for t in recent_tasks
        ],
    }


@app.get("/api/v1/users")
def list_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.id.asc()).all()


@app.post("/api/v1/users")
def create_user(payload: dict, db: Session = Depends(get_db)):
    u = User(name=payload.get("name"), email=payload.get("email"), role=payload.get("role") or "member")
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@app.get("/api/v1/search")
def search(q: str = "", db: Session = Depends(get_db)):
    if not q.strip():
        return []
    like = f"%{q}%"
    results = []
    for l in db.query(Lead).filter(or_(Lead.company.ilike(like), Lead.contact.ilike(like))).limit(5):
        results.append({"type": "리드", "title": l.company, "sub": l.contact})
    for c in db.query(Customer).filter(or_(Customer.company.ilike(like), Customer.contact.ilike(like))).limit(5):
        results.append({"type": "고객", "title": c.company, "sub": c.contact})
    for p in db.query(Project).filter(Project.name.ilike(like)).limit(5):
        results.append({"type": "프로젝트", "title": p.name, "sub": p.status})
    for d in db.query(Deal).filter(Deal.company.ilike(like)).limit(5):
        results.append({"type": "파이프라인", "title": d.company, "sub": d.stage})
    for t in db.query(Task).filter(Task.title.ilike(like)).limit(5):
        results.append({"type": "할일", "title": t.title, "sub": "완료" if t.done else "미완료"})
    for i in db.query(Issue).filter(Issue.title.ilike(like)).limit(5):
        results.append({"type": "이슈", "title": i.title, "sub": i.status})
    return results


@app.get("/api/v1/kpi")
def kpi_summary(days: int = 14, db: Session = Depends(get_db)):
    from datetime import date, timedelta
    rows = (
        db.query(WorkLog)
        .filter(WorkLog.date >= str(date.today() - timedelta(days=days)))
        .order_by(WorkLog.date.asc())
        .all()
    )
    total_target = sum(r.target_qty or 0 for r in rows)
    total_actual = sum(r.actual_qty or 0 for r in rows)
    total_workers = sum(r.worker_count or 0 for r in rows)
    achievement = round(total_actual / total_target * 100, 1) if total_target else 0

    # 작업시간당 처리량
    total_hours = sum((r.work_hours or 8) * (r.worker_count or 1) for r in rows)
    productivity = round(total_actual / total_hours, 1) if total_hours else 0

    # 날짜별 집계
    from collections import defaultdict
    by_date: dict = defaultdict(lambda: {"target": 0, "actual": 0, "workers": 0})
    for r in rows:
        d = r.date or ""
        by_date[d]["target"] += r.target_qty or 0
        by_date[d]["actual"] += r.actual_qty or 0
        by_date[d]["workers"] += r.worker_count or 0

    trend = [{"date": d, **v} for d, v in sorted(by_date.items())]

    return {
        "total_target": total_target,
        "total_actual": total_actual,
        "total_workers": total_workers,
        "achievement": achievement,
        "productivity": productivity,
        "trend": trend,
    }


@app.get("/api/v1/weekly-report")
def weekly_report(db: Session = Depends(get_db)):
    leads_count = db.query(Lead).count()
    new_leads = db.query(Lead).filter(Lead.status == "신규").count()
    active_projects = db.query(Project).filter(Project.status == "진행중").count()
    done_tasks = db.query(Task).filter(Task.done.is_(True)).count()
    pending_tasks = db.query(Task).filter(Task.done.is_(False)).count()
    meetings_count = db.query(Meeting).count()
    open_issues = db.query(Issue).filter(Issue.status != "처리완료").count()
    total_revenue = db.query(func.sum(Project.revenue)).scalar() or 0
    today = datetime.now().strftime("%Y-%m-%d")

    report = f"""[ZENIEL WORKSPACE 주간 업무 보고]
작성일: {today}

1. 영업 현황
 - 전체 리드: {leads_count}건 (신규 {new_leads}건)
 - 진행 중 프로젝트: {active_projects}건
 - 누적 매출: {total_revenue:,.0f}원

2. 활동 현황
 - 진행한 미팅: {meetings_count}건
 - 완료된 할일: {done_tasks}건 / 미완료 {pending_tasks}건
 - 미해결 이슈: {open_issues}건

3. 비고
 - 특이사항 없음
"""
    return {"report": report}


@app.on_event("startup")
def seed_data():
    db = SessionLocal()
    try:
        if db.query(Lead).count() > 0:
            return

        today = datetime.now().date()

        db.add_all([
            Lead(company="대한물산", contact="김민수", phone="01012345678", email="kim@daehan.com", status="신규", source="홈페이지", memo="견적 문의"),
            Lead(company="서울테크", contact="이지은", phone="01023456789", email="lee@seoultech.com", status="접촉중", source="지인소개", memo="2차 미팅 예정"),
            Lead(company="한빛산업", contact="박준호", phone="01034567890", email="park@hanbit.com", status="미팅완료", source="전시회", memo=""),
            Lead(company="그린에너지", contact="최유진", phone="01045678901", email="choi@green.com", status="제안", source="콜드콜", memo="제안서 발송 완료"),
        ])

        db.add_all([
            Customer(company="대한물산", contact="김민수", phone="01012345678", email="kim@daehan.com", grade="A", memo="VIP 고객"),
            Customer(company="미래건설", contact="정수민", phone="01056789012", email="jung@mirae.com", grade="B", memo=""),
            Customer(company="한빛산업", contact="박준호", phone="01034567890", email="park@hanbit.com", grade="C", memo="신규 거래"),
        ])

        db.add_all([
            Deal(company="서울테크", contact="이지은", stage="접촉", expected_revenue=50000000, segment="IT", last_contact=str(today), next_action="견적서 발송"),
            Deal(company="그린에너지", contact="최유진", stage="제안", expected_revenue=120000000, segment="에너지", last_contact=str(today), next_action="협상 일정 조율"),
            Deal(company="한빛산업", contact="박준호", stage="발굴", expected_revenue=30000000, segment="제조", last_contact=str(today), next_action="초기 미팅"),
            Deal(company="미래건설", contact="정수민", stage="수주", expected_revenue=200000000, segment="건설", last_contact=str(today), next_action="계약 체결"),
        ])

        db.add_all([
            Project(name="대한물산 ERP 구축", type="구축", status="진행중", assignee="김민수", revenue=150000000, start_date=str(today - timedelta(days=30)), end_date=str(today + timedelta(days=60)), memo=""),
            Project(name="미래건설 현장관리 시스템", type="구축", status="완료", assignee="정수민", revenue=200000000, start_date=str(today - timedelta(days=120)), end_date=str(today - timedelta(days=10)), memo=""),
            Project(name="한빛산업 유지보수", type="유지보수", status="진행중", assignee="박준호", revenue=20000000, start_date=str(today - timedelta(days=10)), end_date=str(today + timedelta(days=355)), memo=""),
        ])
        db.commit()

        projects = db.query(Project).all()
        db.add_all([
            Contract(project_id=projects[0].id, signed_date=str(today - timedelta(days=30)), renewal_date=str(today + timedelta(days=335)), amount=150000000, memo="ERP 구축 계약"),
            Contract(project_id=projects[1].id, signed_date=str(today - timedelta(days=120)), renewal_date=None, amount=200000000, memo="현장관리 시스템 계약"),
        ])

        db.add_all([
            Site(name="서울 본사 현장", headcount=45, status="운영중", assignee="박준호", memo=""),
            Site(name="부산 물류센터", headcount=20, status="일부중단", assignee="최유진", memo="설비 점검 중"),
        ])

        db.add_all([
            Issue(title="ERP 연동 오류", severity="상", status="처리중", assignee="김민수", due_date=str(today + timedelta(days=3)), memo="API 응답 지연"),
            Issue(title="현장 출입 카드 재발급", severity="하", status="미처리", assignee="최유진", due_date=str(today + timedelta(days=7)), memo=""),
        ])

        db.add_all([
            Meeting(title="ERP 구축 킥오프", counterpart="대한물산", date=str(today - timedelta(days=25)), agenda="요구사항 정의", result="범위 확정", followup="설계 문서 공유"),
            Meeting(title="그린에너지 제안 미팅", counterpart="그린에너지", date=str(today - timedelta(days=2)), agenda="제안 내용 설명", result="긍정적 반응", followup="견적서 수정 후 재발송"),
        ])

        db.add_all([
            EmailLog(to_company="서울테크", subject="견적서 발송의 건", sent_at=str(today - timedelta(days=1)), status="회신대기", memo=""),
            EmailLog(to_company="그린에너지", subject="제안서 수정본 발송", sent_at=str(today), status="발송완료", memo=""),
        ])

        db.add_all([
            Task(title="ERP 설계 문서 검토", due_date=str(today + timedelta(days=2)), priority="상", assignee="김민수", done=False),
            Task(title="견적서 작성", due_date=str(today + timedelta(days=1)), priority="중", assignee="이지은", done=False),
            Task(title="현장 점검 보고서 제출", due_date=str(today - timedelta(days=1)), priority="중", assignee="최유진", done=True),
        ])

        db.add_all([
            Schedule(title="대한물산 정기 미팅", date=str(today + timedelta(days=2)), time="14:00", memo=""),
            Schedule(title="그린에너지 협상", date=str(today + timedelta(days=5)), time="10:30", memo=""),
        ])

        db.add_all([
            Insight(title="2026 상반기 영업 전략", content="신규 고객 발굴을 위한 콜드콜 비중을 늘리고 전시회 참가를 확대한다.", tags="전략, 영업"),
            Insight(title="ERP 시장 동향", content="중소기업 대상 클라우드 ERP 수요가 증가하는 추세.", tags="시장조사"),
        ])

        db.add_all([
            User(name="김영기", email="yg.kim80@gmail.com", role="admin"),
            User(name="이지은", email="lee@zeniel.com", role="member"),
        ])

        db.commit()
    finally:
        db.close()
