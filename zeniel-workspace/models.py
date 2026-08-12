from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from database import Base


class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    company = Column(String)
    contact = Column(String)
    phone = Column(String)
    email = Column(String)
    status = Column(String, default="신규")
    source = Column(String)
    memo = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    company = Column(String)
    contact = Column(String)
    phone = Column(String)
    email = Column(String)
    grade = Column(String, default="B")
    memo = Column(Text)


class Deal(Base):
    __tablename__ = "deals"
    id = Column(Integer, primary_key=True, index=True)
    company = Column(String)
    contact = Column(String)
    stage = Column(String, default="발굴")
    expected_revenue = Column(Float, default=0)
    segment = Column(String)
    last_contact = Column(String)
    next_action = Column(String)
    memo = Column(Text)


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String)
    status = Column(String, default="진행중")
    assignee = Column(String)
    revenue = Column(Float, default=0)
    start_date = Column(String)
    end_date = Column(String)
    memo = Column(Text)


class Contract(Base):
    __tablename__ = "contracts"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    signed_date = Column(String)
    renewal_date = Column(String)
    amount = Column(Float, default=0)
    memo = Column(Text)


class Site(Base):
    __tablename__ = "sites"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    headcount = Column(Integer, default=0)
    status = Column(String, default="운영중")
    assignee = Column(String)
    memo = Column(Text)


class Issue(Base):
    __tablename__ = "issues"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    severity = Column(String, default="중")
    status = Column(String, default="미처리")
    assignee = Column(String)
    due_date = Column(String)
    memo = Column(Text)


class Meeting(Base):
    __tablename__ = "meetings"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    counterpart = Column(String)
    date = Column(String)
    agenda = Column(Text)
    result = Column(Text)
    followup = Column(String)


class EmailLog(Base):
    __tablename__ = "emails"
    id = Column(Integer, primary_key=True, index=True)
    to_company = Column(String)
    subject = Column(String)
    sent_at = Column(String)
    status = Column(String, default="발송완료")
    memo = Column(Text)


class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    due_date = Column(String)
    priority = Column(String, default="중")
    assignee = Column(String)
    done = Column(Boolean, default=False)


class Schedule(Base):
    __tablename__ = "schedules"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    date = Column(String)
    time = Column(String)
    memo = Column(Text)


class Insight(Base):
    __tablename__ = "insights"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(Text)
    tags = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String)
    role = Column(String, default="member")


class WorkLog(Base):
    __tablename__ = "worklogs"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True)
    site = Column(String)
    work_type = Column(String)
    target_qty = Column(Integer, default=0)
    actual_qty = Column(Integer, default=0)
    worker_count = Column(Integer, default=0)
    work_hours = Column(Float, default=8.0)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(Text)
    category = Column(String, default="일반")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class FeedPost(Base):
    __tablename__ = "feed_posts"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(Text)
    author = Column(String, default="관리자")
    category = Column(String, default="공지")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FeedComment(Base):
    __tablename__ = "feed_comments"
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("feed_posts.id"), index=True)
    content = Column(Text)
    author = Column(String, default="관리자")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class WeeklyReport(Base):
    __tablename__ = "weekly_reports"
    id = Column(Integer, primary_key=True, index=True)
    week_label = Column(String, index=True)   # e.g. "2026-W27"
    title = Column(String)                     # e.g. "전략사업팀 주간보고"
    team = Column(String, default="전략사업팀")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class WeeklyReportItem(Base):
    __tablename__ = "weekly_report_items"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("weekly_reports.id"), index=True)
    category = Column(String)
    sort_order = Column(Integer, default=0)
    done_items = Column(Text)
    plan_items = Column(Text)


class HourlyVolume(Base):
    __tablename__ = "hourly_volumes"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True)
    hour = Column(Integer)
    site = Column(String)
    target = Column(Integer, default=0)
    actual = Column(Integer, default=0)
    worker_count = Column(Integer, default=0)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TBM(Base):
    __tablename__ = "tbm_records"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True)
    site = Column(String)
    team = Column(String)
    leader = Column(String)
    safety_topic = Column(Text)
    work_plan = Column(Text)
    attendees = Column(Text)
    attendee_count = Column(Integer, default=0)
    status = Column(String, default="완료")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SafetyEdu(Base):
    __tablename__ = "safety_edu"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True)
    site = Column(String)
    title = Column(String)
    instructor = Column(String)
    participant_count = Column(Integer, default=0)
    completed = Column(Integer, default=0)  # 0=False, 1=True
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Staffing(Base):
    __tablename__ = "staffing"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True)
    site = Column(String)
    regular = Column(Integer, default=0)
    contract = Column(Integer, default=0)
    dispatch = Column(Integer, default=0)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SafetyChecklist(Base):
    __tablename__ = "safety_checklists"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True)
    site = Column(String)
    check_type = Column(String)       # 일일 / 주간 / 월간
    responses = Column(Text)          # JSON: [{item, ok, note}]
    completed_by = Column(String)
    overall_ok = Column(Integer, default=1)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SafetyGuide(Base):
    __tablename__ = "safety_guides"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String)         # 법령 / 사내지침 / 매뉴얼 / 기타
    title = Column(String)
    content = Column(Text)
    file_url = Column(String)
    revision = Column(String)         # 개정번호 (예: Rev.3)
    effective_date = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
