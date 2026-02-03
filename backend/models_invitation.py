from sqlalchemy import Column, String, DateTime, Enum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import uuid
import enum
import datetime
import sqlalchemy.types as types

# Reusing GUID from models.py logic (or importing if refactored)
# For now, quick re-definition or better yet, import from models if possible without circular deps.
# Creating a duplicate GUID helper to avoid circular imports if I can't easily extract it.
class GUID(types.TypeDecorator):
    """Platform-independent GUID type."""
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

class InvitationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"

class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, index=True)
    entity_name = Column(String) # Name of municipality or company
    role = Column(String) # "municipality", "enterprise"
    token = Column(String, unique=True, index=True)
    expires_at = Column(DateTime)
    status = Column(String, default=InvitationStatus.PENDING)
    
    invited_by_org_id = Column(GUID, nullable=True) # ID of the organization sending the invite
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
