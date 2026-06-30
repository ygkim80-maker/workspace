from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class LeadBase(BaseModel):
    company: Optional[str] = None
    contact: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = "신규"
    source: Optional[str] = None
    memo: Optional[str] = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(LeadBase):
    pass


class LeadOut(LeadBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None


class CustomerBase(BaseModel):
    company: Optional[str] = None
    contact: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    grade: Optional[str] = "B"
    memo: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(CustomerBase):
    pass


class CustomerOut(CustomerBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class DealBase(BaseModel):
    company: Optional[str] = None
    contact: Optional[str] = None
    stage: Optional[str] = "발굴"
    expected_revenue: Optional[float] = 0
    segment: Optional[str] = None
    last_contact: Optional[str] = None
    next_action: Optional[str] = None
    memo: Optional[str] = None


class DealCreate(DealBase):
    pass


class DealUpdate(DealBase):
    pass


class DealOut(DealBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ProjectBase(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = "진행중"
    assignee: Optional[str] = None
    revenue: Optional[float] = 0
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    memo: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(ProjectBase):
    pass


class ProjectOut(ProjectBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ContractBase(BaseModel):
    project_id: Optional[int] = None
    signed_date: Optional[str] = None
    renewal_date: Optional[str] = None
    amount: Optional[float] = 0
    memo: Optional[str] = None


class ContractCreate(ContractBase):
    pass


class ContractUpdate(ContractBase):
    pass


class ContractOut(ContractBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class SiteBase(BaseModel):
    name: Optional[str] = None
    headcount: Optional[int] = 0
    status: Optional[str] = "운영중"
    assignee: Optional[str] = None
    memo: Optional[str] = None


class SiteCreate(SiteBase):
    pass


class SiteUpdate(SiteBase):
    pass


class SiteOut(SiteBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class IssueBase(BaseModel):
    title: Optional[str] = None
    severity: Optional[str] = "중"
    status: Optional[str] = "미처리"
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    memo: Optional[str] = None


class IssueCreate(IssueBase):
    pass


class IssueUpdate(IssueBase):
    pass


class IssueOut(IssueBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class MeetingBase(BaseModel):
    title: Optional[str] = None
    counterpart: Optional[str] = None
    date: Optional[str] = None
    agenda: Optional[str] = None
    result: Optional[str] = None
    followup: Optional[str] = None


class MeetingCreate(MeetingBase):
    pass


class MeetingUpdate(MeetingBase):
    pass


class MeetingOut(MeetingBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class EmailLogBase(BaseModel):
    to_company: Optional[str] = None
    subject: Optional[str] = None
    sent_at: Optional[str] = None
    status: Optional[str] = "발송완료"
    memo: Optional[str] = None


class EmailLogCreate(EmailLogBase):
    pass


class EmailLogUpdate(EmailLogBase):
    pass


class EmailLogOut(EmailLogBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class TaskBase(BaseModel):
    title: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = "중"
    assignee: Optional[str] = None
    done: Optional[bool] = False


class TaskCreate(TaskBase):
    pass


class TaskUpdate(TaskBase):
    pass


class TaskOut(TaskBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ScheduleBase(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    memo: Optional[str] = None


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(ScheduleBase):
    pass


class ScheduleOut(ScheduleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class InsightBase(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[str] = None


class InsightCreate(InsightBase):
    pass


class InsightUpdate(InsightBase):
    pass


class InsightOut(InsightBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None


class UserBase(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = "member"


class UserCreate(UserBase):
    pass


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
