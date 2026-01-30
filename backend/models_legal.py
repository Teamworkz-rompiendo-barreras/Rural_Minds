
from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Enum, Boolean, Float
from sqlalchemy.orm import relationship
from database import Base
import datetime
from models import GUID 
import uuid

# To be appended to backend/models.py
class LegalConsent(Base):
    __tablename__ = "legal_consents"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    
    document_type = Column(String) # "privacy_policy", "terms_conditions", "sensory_sharing"
    version = Column(String) # "1.0", "2026-Q1"
    
    # Granular consents stored as JSON for flexibility
    # e.g., {"share_profile": true, "training_emails": false}
    consents = Column(JSON, default=dict)
    
    ip_address = Column(String, nullable=True) # Anonymized if possible
    user_agent = Column(String, nullable=True)
    
    accepted_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", backref="legal_agreements")
