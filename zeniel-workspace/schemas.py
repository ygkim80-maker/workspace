from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


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


class WorkLogBase(BaseModel):
    date: Optional[str] = None
    site: Optional[str] = None
    work_type: Optional[str] = None
    target_qty: Optional[int] = 0
    actual_qty: Optional[int] = 0
    worker_count: Optional[int] = 0
    work_hours: Optional[float] = 8.0
    notes: Optional[str] = None

class WorkLogCreate(WorkLogBase): pass
class WorkLogUpdate(WorkLogBase): pass
class WorkLogOut(WorkLogBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None


class DocumentBase(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = "일반"

class DocumentCreate(DocumentBase): pass
class DocumentUpdate(DocumentBase): pass
class DocumentOut(DocumentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class FeedPostBase(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    author: Optional[str] = "관리자"
    category: Optional[str] = "공지"

class FeedPostCreate(FeedPostBase): pass
class FeedPostUpdate(FeedPostBase): pass
class FeedPostOut(FeedPostBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None


class FeedCommentBase(BaseModel):
    post_id: Optional[int] = None
    content: Optional[str] = None
    author: Optional[str] = "관리자"

class FeedCommentCreate(FeedCommentBase): pass
class FeedCommentOut(FeedCommentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None


class HourlyVolumeBase(BaseModel):
    date: Optional[str] = None
    hour: Optional[int] = 9
    site: Optional[str] = None
    target: Optional[int] = 0
    actual: Optional[int] = 0
    worker_count: Optional[int] = 0
    notes: Optional[str] = None

class HourlyVolumeCreate(HourlyVolumeBase): pass
class HourlyVolumeUpdate(HourlyVolumeBase): pass
class HourlyVolumeOut(HourlyVolumeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None


class TBMBase(BaseModel):
    date: Optional[str] = None
    site: Optional[str] = None
    team: Optional[str] = None
    leader: Optional[str] = None
    safety_topic: Optional[str] = None
    work_plan: Optional[str] = None
    attendees: Optional[str] = "[]"
    attendee_count: Optional[int] = 0
    status: Optional[str] = "완료"

class TBMCreate(TBMBase): pass
class TBMUpdate(TBMBase): pass
class TBMOut(TBMBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None


from typing import List

class WeeklyReportItemBase(BaseModel):
    category: Optional[str] = None
    sort_order: Optional[int] = 0
    done_items: Optional[str] = "[]"   # JSON string
    plan_items: Optional[str] = "[]"

class WeeklyReportItemCreate(WeeklyReportItemBase): pass
class WeeklyReportItemUpdate(WeeklyReportItemBase): pass
class WeeklyReportItemOut(WeeklyReportItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    report_id: Optional[int] = None


class WeeklyReportBase(BaseModel):
    week_label: Optional[str] = None
    title: Optional[str] = None
    team: Optional[str] = "전략사업팀"

class WeeklyReportCreate(WeeklyReportBase): pass
class WeeklyReportUpdate(WeeklyReportBase): pass
class WeeklyReportOut(WeeklyReportBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: Optional[List[WeeklyReportItemOut]] = []


class SafetyEduBase(BaseModel):
    date: Optional[str] = None
    site: Optional[str] = None
    title: Optional[str] = None
    instructor: Optional[str] = None
    participant_count: Optional[int] = 0
    completed: Optional[bool] = False
    notes: Optional[str] = None

class SafetyEduCreate(SafetyEduBase): pass
class SafetyEduUpdate(SafetyEduBase): pass
class SafetyEduOut(SafetyEduBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None

    @field_validator('completed', mode='before')
    @classmethod
    def coerce_bool(cls, v):
        if isinstance(v, int):
            return bool(v)
        return v


class StaffingBase(BaseModel):
    date: Optional[str] = None
    site: Optional[str] = None
    regular: Optional[int] = 0
    contract: Optional[int] = 0
    dispatch: Optional[int] = 0
    notes: Optional[str] = None

class StaffingCreate(StaffingBase): pass
class StaffingUpdate(StaffingBase): pass
class StaffingOut(StaffingBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None


class SafetyChecklistBase(BaseModel):
    date: Optional[str] = None
    site: Optional[str] = None
    check_type: Optional[str] = '일일'
    responses: Optional[str] = '[]'
    completed_by: Optional[str] = None
    overall_ok: Optional[int] = 1
    notes: Optional[str] = None

class SafetyChecklistCreate(SafetyChecklistBase): pass
class SafetyChecklistUpdate(SafetyChecklistBase): pass
class SafetyChecklistOut(SafetyChecklistBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None


class SafetyGuideBase(BaseModel):
    category: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    file_url: Optional[str] = None
    revision: Optional[str] = None
    effective_date: Optional[str] = None

class SafetyGuideCreate(SafetyGuideBase): pass
class SafetyGuideUpdate(SafetyGuideBase): pass
class SafetyGuideOut(SafetyGuideBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CardDeliveryBase(BaseModel):
    date: Optional[str] = None
    branch: Optional[str] = None
    card_company: Optional[str] = None
    received: Optional[int] = 0
    delivered: Optional[int] = 0
    pending: Optional[int] = 0
    returned: Optional[int] = 0
    notes: Optional[str] = None

class CardDeliveryCreate(CardDeliveryBase): pass
class CardDeliveryUpdate(CardDeliveryBase): pass
class CardDeliveryOut(CardDeliveryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None


class BranchStaffBase(BaseModel):
    date: Optional[str] = None
    branch: Optional[str] = None
    total: Optional[int] = 0
    absent: Optional[int] = 0
    resigned: Optional[int] = 0
    new_hire: Optional[int] = 0
    shortage: Optional[int] = 0
    notes: Optional[str] = None

class BranchStaffCreate(BranchStaffBase): pass
class BranchStaffUpdate(BranchStaffBase): pass
class BranchStaffOut(BranchStaffBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None


class BranchIssueBase(BaseModel):
    date: Optional[str] = None
    branch: Optional[str] = None
    category: Optional[str] = '기타'
    severity: Optional[str] = '중'
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = '미처리'

class BranchIssueCreate(BranchIssueBase): pass
class BranchIssueUpdate(BranchIssueBase): pass
class BranchIssueOut(BranchIssueBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
