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
