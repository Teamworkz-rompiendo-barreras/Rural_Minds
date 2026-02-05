from typing import List, Optional, Any
from pydantic import BaseModel
from datetime import datetime
import uuid

# --- Token ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- Organization (formerly Tenant) ---
class OrganizationBase(BaseModel):
    name: str
    branding_logo_url: Optional[str] = None
    primary_color_override: Optional[str] = "#0F5C2E"
    industry: Optional[str] = None
    size: Optional[str] = None
    subscription_plan: Optional[str] = "starter"
    org_type: Optional[str] = "enterprise"
    municipality_id: Optional[uuid.UUID] = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    branding_logo_url: Optional[str] = None
    primary_color_override: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    subscription_plan: Optional[str] = None
    org_type: Optional[str] = None
    municipality_id: Optional[uuid.UUID] = None

class Organization(OrganizationBase):
    id: uuid.UUID
    created_at: datetime
    
    class Config:
        orm_mode = True

# --- Users ---
class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "enterprise"

class UserPublic(UserBase):
    id: uuid.UUID
    role: str
    status: str
    organization_id: Optional[uuid.UUID] = None
    organization: Optional[Organization] = None

    class Config:
        orm_mode = True

# --- Accessibility Profiles (formerly TalentProfile) ---
class AccessibilityProfileBase(BaseModel):
    prefers_reduced_motion: bool = False
    high_contrast_enabled: bool = False
    preferred_font_size: int = 16
    sensory_needs: Optional[dict] = {}

class AccessibilityProfileUpdate(AccessibilityProfileBase):
    pass

class AccessibilityProfile(AccessibilityProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    
    class Config:
        orm_mode = True

# --- Articles (Learning) ---
class ArticleBase(BaseModel):
    title: str
    summary: str
    content: str
    author: str
    category: str
    tags: List[str] = []
    image_url: Optional[str] = None

class ArticleCreate(ArticleBase):
    pass

class Article(ArticleBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        orm_mode = True

# --- Adjustments/Analytics ---
class MetricResponse(BaseModel):
    inclusion_score: int
    hiring_velocity: str
    retention_rate: str
    neurodivergent_hires: int
    active_challenges: int
    accommodations_provided: int
    roi_estimated: str

# --- Talent Profile ---
class TalentProfileBase(BaseModel):
    bio: Optional[str] = None
    skills: Optional[List[str]] = []
    preferences: Optional[dict] = {}
    neurodivergent_traits: Optional[List[str]] = []
    work_style: Optional[str] = None
    communication_preferences: Optional[dict] = {}
    
    # Location Module
    residence_location_id: Optional[uuid.UUID] = None
    is_willing_to_move: Optional[bool] = False
    target_locations: Optional[List[str]] = []

class TalentProfileCreate(TalentProfileBase):
    pass

class TalentProfile(TalentProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    
    class Config:
        orm_mode = True

    class Config:
        orm_mode = True

# --- Municipality Details ---
class MunicipalityDetailsBase(BaseModel):
    slogan: Optional[str] = None
    description: Optional[str] = None
    internet_speed: Optional[str] = None
    connectivity_info: Optional[str] = None
    climate_co2: Optional[str] = None
    services: Optional[dict] = {}
    gallery_urls: Optional[List[str]] = []

class MunicipalityDetails(MunicipalityDetailsBase):
    id: uuid.UUID
    location_id: uuid.UUID
    
    class Config:
        orm_mode = True

    class Config:
        orm_mode = True

# --- Invitations ---
class InvitationBase(BaseModel):
    email: str
    entity_name: str
    role: str = "municipality"

class InvitationCreate(InvitationBase):
    pass

class Invitation(InvitationBase):
    id: uuid.UUID
    status: str
    expires_at: datetime
    created_at: datetime
    
    class Config:
        orm_mode = True

# --- Challenges ---
class ChallengeBase(BaseModel):
    title: str
    description: str
    requirements: Optional[List[str]] = []
    skills_needed: Optional[List[str]] = []
    location_type: Optional[str] = "remote"
    compensation: Optional[str] = None
    deadline: Optional[datetime] = None
    is_public: bool = True

class ChallengeCreate(ChallengeBase):
    pass

class ChallengeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    skills_needed: Optional[List[str]] = None
    location_type: Optional[str] = None
    compensation: Optional[str] = None
    deadline: Optional[datetime] = None
    status: Optional[str] = None
    is_public: Optional[bool] = None

class Challenge(ChallengeBase):
    id: uuid.UUID
    status: str = "open"
    creator_id: Optional[uuid.UUID] = None
    tenant_id: Optional[uuid.UUID] = None
    created_at: datetime
    
    # Matching Output
    match_score: Optional[float] = None
    adjustments: Optional[List[str]] = None
    
    class Config:
        orm_mode = True

# --- Applications ---
class ApplicationBase(BaseModel):
    cover_letter: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None

class Application(ApplicationBase):
    id: uuid.UUID
    user_id: uuid.UUID
    challenge_id: uuid.UUID
    status: str = "pending"
    created_at: datetime
    
    class Config:
        orm_mode = True

# --- Solutions (Accessibility Catalog) ---
class SolutionBase(BaseModel):
    title: str
    category: str
    description: str
    implementation_guide: Optional[str] = None
    impact_level: Optional[str] = "medium"
    cost_estimate: Optional[str] = "$"
    image_url: Optional[str] = None

class SolutionCreate(SolutionBase):
    pass

class Solution(SolutionBase):
    id: uuid.UUID
    created_at: datetime
    
    class Config:
        orm_mode = True

# --- Messages ---
class MessageBase(BaseModel):
    content: Optional[str] = None
    message_type: str = "text" # text, voice, attachment, system
    attachment_url: Optional[str] = None
    attachment_label: Optional[str] = None

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: uuid.UUID
    application_id: uuid.UUID
    sender_id: uuid.UUID
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

# --- Legal Consents ---
class LegalConsentBase(BaseModel):
    document_type: str
    version: str
    consents: dict = {}
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class LegalConsentCreate(LegalConsentBase):
    pass

class LegalConsent(LegalConsentBase):
    id: uuid.UUID
    user_id: uuid.UUID
    accepted_at: datetime
    
    class Config:
        orm_mode = True

# --- Onboarding Tasks ---
class OnboardingTaskBase(BaseModel):
    task_text: str
    is_completed: bool = False

class OnboardingTaskCreate(OnboardingTaskBase):
    pass

class OnboardingTaskUpdate(BaseModel):
    is_completed: bool

class OnboardingTask(OnboardingTaskBase):
    id: uuid.UUID
    application_id: uuid.UUID
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True
