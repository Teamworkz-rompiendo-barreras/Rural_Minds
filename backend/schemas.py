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

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    branding_logo_url: Optional[str] = None
    primary_color_override: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    subscription_plan: Optional[str] = None

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

class UserPublic(UserBase):
    id: uuid.UUID
    role: str
    status: str
    organization_id: Optional[uuid.UUID] = None

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
