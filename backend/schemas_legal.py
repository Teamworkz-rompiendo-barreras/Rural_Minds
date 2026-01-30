
from typing import List, Optional, Any
from pydantic import BaseModel
from datetime import datetime
import uuid

# To be appended to backend/schemas.py

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
