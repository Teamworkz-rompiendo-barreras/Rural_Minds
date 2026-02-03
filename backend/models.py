from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Enum, Boolean, Float
from sqlalchemy.orm import relationship, backref
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import datetime
import enum
import uuid

# Helper to define UUID type differently for SQLite vs Postgres if needed
# For this implementation using the standard uuid library and String storage for SQLite compatibility,
# or explicit UUID if the driver supports it. 
# We'll use a custom type or String for SQLite simplicity, but interface as UUID.
import sqlalchemy.types as types
# Import the new Location model to register it with Base
# But wait, if I defined it in another file, I need to make sure Base is the same.
# Both use `database.Base`.

from models_location import Location

class GUID(types.TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's UUID type, otherwise uses CHAR(36), storing as stringified hex values.
    """
    impl = types.CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(UUID())
        else:
            return dialect.type_descriptor(types.CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return str(uuid.UUID(value))
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                value = uuid.UUID(value)
            return value

class UserRole(str, enum.Enum):
    TALENT = "talent"
    ENTERPRISE = "enterprise"
    TERRITORY_ADMIN = "territory_admin"
    SUPER_ADMIN = "super_admin"

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, unique=True, index=True)
    
    # Branding
    branding_logo_url = Column(String, nullable=True) # Renamed from logo_url
    primary_color_override = Column(String, default="#0F5C2E") # Renamed from primary_color
    
    industry = Column(String, nullable=True)
    size = Column(String, nullable=True)
    subscription_plan = Column(String, default="starter")
    
    # New fields for RuralMinds
    org_type = Column(String, default="enterprise") # enterprise, municipality
    municipality_id = Column(GUID, ForeignKey("organizations.id"), nullable=True) # If enterprise, links to municipality
    location_id = Column(GUID, ForeignKey("locations.id"), nullable=True) # Link to geographic location
    
    parent = relationship("Organization", remote_side=[id], backref="companies")
    location = relationship("Location") # Relationship
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    users = relationship("User", back_populates="organization")
    # challenges = relationship("Challenge", back_populates="organization") # Updating Challenge later if needed

class User(Base):
    __tablename__ = "users"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    organization_id = Column(GUID, ForeignKey("organizations.id"), nullable=True)
    
    full_name = Column(String, nullable=True) # New field
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default=UserRole.TALENT)
    status = Column(String, default="pending") # active, pending, disabled
    
    # Email Verification
    email_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True) # UUID token for email confirmation
    verification_token_expires = Column(DateTime, nullable=True)
    
    organization = relationship("Organization", back_populates="users")
    
    accessibility_profile = relationship("AccessibilityProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    # challenges_created = relationship("Challenge", back_populates="creator")
    # applications = relationship("Application", back_populates="user")

class AccessibilityProfile(Base):
    __tablename__ = "accessibility_profiles"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(GUID, ForeignKey("users.id"), unique=True)
    
    prefers_reduced_motion = Column(Boolean, default=False)
    high_contrast_enabled = Column(Boolean, default=False)
    preferred_font_size = Column(Integer, default=16)
    
    sensory_needs = Column(JSON, default=dict) # Structured needs
    
    user = relationship("User", back_populates="accessibility_profile")

class AdjustmentsLog(Base):
    __tablename__ = "adjustments_log"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    organization_id = Column(GUID, ForeignKey("organizations.id"))
    user_id = Column(GUID, ForeignKey("users.id"))
    
    adjustment_type = Column(String)
    impact_metric = Column(Float, nullable=True) # 1-10
    status = Column(String, default="requested") # requested, approved, implemented
    
    feedback_score = Column(Float, nullable=True)
    feedback_date = Column(DateTime, nullable=True)
    notes = Column(String, nullable=True)
    
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

# Keeping other models simpler for now, but migrating IDs to GUID if referenced
class Article(Base):
    __tablename__ = "articles"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String, index=True)
    summary = Column(String)
    content = Column(String)
    author = Column(String)
    category = Column(String, index=True)
    tags = Column(JSON, default=list)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Challenge(Base):
    __tablename__ = "challenges"
    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String, index=True)
    description = Column(String)
    requirements = Column(JSON, default=list)
    sensory_requirements = Column(JSON, default=dict) # New field for matching
    skills_needed = Column(JSON, default=list)
    location_type = Column(String, default="remote")  # remote, hybrid, onsite
    compensation = Column(String, nullable=True)
    deadline = Column(DateTime, nullable=True)
    status = Column(String, default="open")  # open, closed, in_progress
    is_public = Column(Boolean, default=True) # New field for visibility
    
    tenant_id = Column(GUID, ForeignKey("organizations.id"), nullable=True)
    creator_id = Column(GUID, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    tenant = relationship("Organization")
    creator = relationship("User", backref="challenges_created")
    applications = relationship("Application", back_populates="challenge")

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(GUID, ForeignKey("users.id"))
    challenge_id = Column(GUID, ForeignKey("challenges.id"))
    
    cover_letter = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, accepted, rejected
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", backref=backref("applications", cascade="all, delete-orphan"))
    challenge = relationship("Challenge", back_populates="applications")

class TalentProfile(Base):
    __tablename__ = "talent_profiles"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(GUID, ForeignKey("users.id"), unique=True)
    
    bio = Column(String, nullable=True)
    skills = Column(JSON, default=list)
    preferences = Column(JSON, default=dict)
    neurodivergent_traits = Column(JSON, default=list)
    work_style = Column(String, nullable=True)
    communication_preferences = Column(JSON, default=dict)

    # Location Module
    residence_location_id = Column(GUID, ForeignKey("locations.id"), nullable=True)
    is_willing_to_move = Column(Boolean, default=False)
    target_locations = Column(JSON, default=list) # List of Location IDs or names

    residence_location = relationship("Location")
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", backref=backref("talent_profile", cascade="all, delete-orphan"))

class AuditLog(Base):
    """Tracks admin-relevant events and errors for support/auditing."""
    __tablename__ = "audit_logs"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    organization_id = Column(GUID, ForeignKey("organizations.id"), nullable=True)
    user_id = Column(GUID, ForeignKey("users.id"), nullable=True)
    
    event_type = Column(String) # "error", "info", "warning", "security"
    message = Column(String)
    details = Column(JSON, default=dict) # Additional context (e.g., file size, stack trace)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# Subscription Plan Limits
PLAN_USER_LIMITS = {
    "starter": 50,
    "growth": 250,
    "enterprise": None  # Unlimited
}

class Solution(Base):
    __tablename__ = "solutions"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String, index=True)
    category = Column(String, index=True) # e.g., "visual", "auditory", "cognitive"
    description = Column(String)
    implementation_guide = Column(String) # Markdown/Text
    impact_level = Column(String) # low, medium, high
    cost_estimate = Column(String) # $, $$, $$$
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    application_id = Column(GUID, ForeignKey("applications.id"), nullable=False, index=True)
    sender_id = Column(GUID, ForeignKey("users.id"), nullable=False)
    
    content = Column(String, nullable=True) # Text content
    message_type = Column(String, default="text") # text, voice, attachment, system
    
    attachment_url = Column(String, nullable=True)
    attachment_label = Column(String, nullable=True) # Accessibility label
    
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    application = relationship("Application", backref="messages")
    sender = relationship("User")

class LegalConsent(Base):
    __tablename__ = "legal_consents"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    
    document_type = Column(String) # "privacy_policy", "terms_conditions", "sensory_sharing"
    version = Column(String) # "1.0", "2026-Q1"
    
    consents = Column(JSON, default=dict)
    
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    
    accepted_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", backref=backref("legal_consents", cascade="all, delete-orphan"))
    

class OnboardingTask(Base):
    __tablename__ = "onboarding_tasks"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    application_id = Column(GUID, ForeignKey("applications.id"), nullable=False, index=True)
    
    task_text = Column(String)
    is_completed = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    application = relationship("Application", backref="onboarding_tasks")

