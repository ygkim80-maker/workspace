from datetime import datetime, timedelta

from fastapi import Depends, FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

import models
from database import Base, SessionLocal, engine, get_db
from models import (Contract, Customer, Deal, Document, EmailLog, FeedComment, FeedPost,
                     HourlyVolume, Insight, Issue, Lead, Meeting, Project, Schedule, Site,
                     TBM, Task, User, WeeklyReport, WeeklyReportItem, WorkLog)
from routers import (contracts, customers, documents, emails, feed, hourly, insights, issues,
                      leads, meetings, pipeline, projects, schedules, sites, tasks, tbm,
                      weekly_reports, worklogs, safety_edu, staffing, safety_mgmt)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="물류 현장 — ZENIEL")
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

STAGES = ["발굴", "접촉", "제안", "협상", "수주", "탈락"]

for r in (leads.router, customers.router, pipeline.router, projects.router, contracts.router,
          sites.router, issues.router, meetings.router, emails.router, tasks.router,
          schedules.router, insights.router, worklogs.router, documents.router, feed.router,
          weekly_reports.router, hourly.router, tbm.router,
          safety_edu.router, staffing.router,
          safety_mgmt.checklist_router, safety_mgmt.guide_router):
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
        td = lambda d: str(today - timedelta(days=d))
        tf = lambda d: str(today + timedelta(days=d))

        # ── 영업 CRM ──
        db.add_all([
            Lead(company="쿠팡 풀필먼트", contact="박성훈", phone="01011112222", email="park@coupang.com", status="접촉중", source="지인소개", memo="MFC 운영 위탁 협의"),
            Lead(company="CJ대한통운", contact="김지영", phone="01033334444", email="kim@cjlogistics.com", status="제안", source="전시회", memo="3PL 계약 확대 논의"),
            Lead(company="롯데글로벌로지스", contact="이준호", phone="01055556666", email="lee@lotte.com", status="신규", source="홈페이지", memo="신규 터미널 운영 문의"),
            Lead(company="한진택배", contact="최민지", phone="01077778888", email="choi@hanjin.com", status="미팅완료", source="콜드콜", memo="운영 개선 제안"),
        ])
        db.add_all([
            Customer(company="쿠팡 풀필먼트", contact="박성훈", phone="01011112222", email="park@coupang.com", grade="A", memo="주력 고객사"),
            Customer(company="CJ대한통운", contact="김지영", phone="01033334444", email="kim@cjlogistics.com", grade="A", memo="장기 파트너"),
            Customer(company="롯데글로벌로지스", contact="이준호", phone="01055556666", email="lee@lotte.com", grade="B", memo=""),
        ])
        db.add_all([
            Deal(company="쿠팡 풀필먼트", contact="박성훈", stage="협상", expected_revenue=480000000, segment="이커머스", last_contact=td(1), next_action="계약서 검토"),
            Deal(company="CJ대한통운", contact="김지영", stage="제안", expected_revenue=360000000, segment="택배", last_contact=td(3), next_action="단가 협의"),
            Deal(company="롯데글로벌로지스", contact="이준호", stage="접촉", expected_revenue=120000000, segment="물류", last_contact=td(5), next_action="현장 방문"),
            Deal(company="한진택배", contact="최민지", stage="발굴", expected_revenue=80000000, segment="택배", last_contact=td(7), next_action="제안서 발송"),
        ])

        # ── 프로젝트 ──
        db.add_all([
            Project(name="부산 물류센터 운영", type="운영", status="진행중", assignee="박준호", revenue=480000000, start_date=td(90), end_date=tf(275), memo="쿠팡 위탁"),
            Project(name="인천 터미널 분류 운영", type="운영", status="진행중", assignee="이민철", revenue=360000000, start_date=td(60), end_date=tf(305), memo="CJ 위탁"),
            Project(name="서울 MFC 구축", type="구축", status="진행중", assignee="김영기", revenue=150000000, start_date=td(30), end_date=tf(60), memo="롯데 발주"),
            Project(name="대구 센터 유지보수", type="유지보수", status="완료", assignee="최유진", revenue=24000000, start_date=td(120), end_date=td(10), memo=""),
        ])
        db.commit()

        projects = db.query(Project).all()
        db.add_all([
            Contract(project_id=projects[0].id, signed_date=td(90), renewal_date=tf(275), amount=480000000, memo="쿠팡 위탁 운영 계약"),
            Contract(project_id=projects[1].id, signed_date=td(60), renewal_date=tf(305), amount=360000000, memo="CJ 터미널 운영"),
        ])

        # ── 현장 ──
        db.add_all([
            Site(name="부산 물류센터", headcount=87, status="운영중", assignee="박준호", memo="쿠팡 위탁 · 3개 조 운영"),
            Site(name="인천 터미널", headcount=54, status="운영중", assignee="이민철", memo="CJ 위탁 · 주간/야간"),
            Site(name="서울 MFC", headcount=32, status="구축중", assignee="김영기", memo="오픈 예정"),
            Site(name="대구 물류센터", headcount=28, status="일부중단", assignee="최유진", memo="설비 점검 중"),
        ])

        # ── 이슈 ──
        db.add_all([
            Issue(title="컨베이어 2호 라인 점검 필요", severity="상", status="처리중", assignee="박준호", due_date=tf(2), memo="소음 발생, 정비팀 출동 요청"),
            Issue(title="TBM 미서명자 3명 확인", severity="상", status="미처리", assignee="이민철", due_date=tf(1), memo="금일 내 서명 완료 요청"),
            Issue(title="야간 조 인원 부족 (2명)", severity="중", status="처리중", assignee="박준호", due_date=tf(3), memo="파견사 긴급 요청"),
            Issue(title="스캐너 3번 오류", severity="하", status="처리완료", assignee="최유진", due_date=td(1), memo="재부팅으로 해결"),
        ])

        # ── 미팅 ──
        db.add_all([
            Meeting(title="쿠팡 월간 운영 회의", counterpart="쿠팡 풀필먼트", date=td(3), agenda="물량 목표 및 인원 협의", result="8월 목표 12,000건/일 합의", followup="SLA 보고서 제출"),
            Meeting(title="CJ 운영 점검", counterpart="CJ대한통운", date=td(7), agenda="3분기 성과 점검", result="달성률 94% 확인", followup="4분기 인원 계획 제출"),
        ])

        # ── 할일 ──
        db.add_all([
            Task(title="8월 TBM 일지 취합·보고", due_date=tf(1), priority="상", assignee="박준호", done=False),
            Task(title="인천 터미널 안전점검 보고서", due_date=tf(3), priority="상", assignee="이민철", done=False),
            Task(title="파견 인원 계획서 제출", due_date=tf(5), priority="중", assignee="김영기", done=False),
            Task(title="대구 설비 점검 완료 보고", due_date=td(1), priority="중", assignee="최유진", done=True),
            Task(title="주간보고 작성", due_date=tf(2), priority="중", assignee="박준호", done=False),
        ])

        # ── 일정 ──
        db.add_all([
            Schedule(title="쿠팡 담당자 현장 방문", date=tf(3), time="10:00", memo="부산 물류센터"),
            Schedule(title="전사 안전교육 (정기)", date=tf(7), time="09:00", memo="전 현장 필수 참석"),
            Schedule(title="CJ 4분기 계획 미팅", date=tf(10), time="14:00", memo=""),
        ])

        # ── 인사이트 ──
        db.add_all([
            Insight(title="MFC 운영 효율화 방안", content="인력 배치를 시간대별 물량에 맞게 유동 운영하면 인시생산성 15% 향상 가능.", tags="운영, 효율화"),
            Insight(title="택배 성수기 대비 전략", content="11~12월 물량 급증 대비 파견 인원 조기 확보 필요. 9월 중 계약 완료 목표.", tags="성수기, 인력"),
        ])

        # ── 사용자 ──
        db.add_all([
            User(name="김영기", email="yg.kim80@gmail.com", role="admin"),
            User(name="박준호", email="park@zeniel.com", role="member"),
            User(name="이민철", email="lee@zeniel.com", role="member"),
        ])

        # ── 시간대별 물량 (최근 7일) ──
        import random
        sites = ["부산 물류센터", "인천 터미널"]
        hours = [9, 12, 15, 18]
        hour_targets = {9: 2800, 12: 3200, 15: 3500, 18: 2500}
        for dd in range(6, -1, -1):
            d = str(today - timedelta(days=dd))
            for site in sites:
                workers_base = 45 if site == "부산 물류센터" else 28
                for h in hours:
                    t = hour_targets[h]
                    rate = random.uniform(0.88, 1.05)
                    db.add(HourlyVolume(
                        date=d, hour=h, site=site,
                        target=t, actual=int(t * rate),
                        worker_count=workers_base + random.randint(-3, 3),
                    ))

        # ── WorkLog (최근 14일) ──
        work_types = ["입고분류", "출고분류", "배송준비", "반품처리"]
        for dd in range(13, -1, -1):
            d = str(today - timedelta(days=dd))
            for site in sites:
                wc = 45 if site == "부산 물류센터" else 28
                t = random.randint(10000, 14000)
                a = int(t * random.uniform(0.87, 1.02))
                db.add(WorkLog(date=d, site=site, work_type=random.choice(work_types),
                               target_qty=t, actual_qty=a, worker_count=wc,
                               work_hours=8.0, notes=""))

        # ── TBM 기록 (최근 5일) ──
        safety_topics = [
            "고소작업 시 안전벨트 착용 의무화 및 추락 방지망 확인",
            "지게차 후진 시 후방 확인 및 보행자 통로 침범 금지",
            "컨베이어 작동 중 이물질 제거 금지, 긴급정지 버튼 위치 숙지",
            "무거운 화물 이동 시 2인 1조 작업 및 허리 보호대 착용",
            "폭염 대비 수시 수분 섭취, 야외 작업 30분 초과 금지",
        ]
        teams = [("부산 물류센터", "박준호"), ("인천 터미널", "이민철")]
        for dd in range(4, -1, -1):
            d = str(today - timedelta(days=dd))
            for site, leader in teams:
                names = ["김철수", "이영희", "박민준", "최지수", "정대호", "강민서", "윤성훈"]
                attendees = random.sample(names, random.randint(5, 7))
                db.add(TBM(
                    date=d, site=site, team="주간 1조", leader=leader,
                    safety_topic=random.choice(safety_topics),
                    work_plan="금일 목표 물량 달성 및 무재해 운영",
                    attendees=str(attendees), attendee_count=len(attendees),
                    status="완료",
                ))

        # ── 팀 피드 ──
        db.add_all([
            FeedPost(title="[긴급] 부산 센터 컨베이어 점검 안내", content="금일 15:00~16:00 2호 라인 정비로 일시 중단됩니다. 해당 시간 대체 라인으로 운영하세요.", author="박준호", category="공지"),
            FeedPost(title="8월 2주차 물량 달성 현황", content="부산: 87,340건 (목표 94.1%)\n인천: 52,180건 (목표 96.2%)\n전체 우수한 성과입니다.", author="김영기", category="업무공유"),
            FeedPost(title="안전교육 일정 안내", content="8월 18일(월) 09:00 전 현장 정기 안전교육 실시 예정입니다. 필수 참석 바랍니다.", author="이민철", category="공지"),
        ])

        db.commit()
    finally:
        db.close()
