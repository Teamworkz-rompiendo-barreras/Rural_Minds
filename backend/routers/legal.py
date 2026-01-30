
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import models, schemas, auth, database
from datetime import datetime

router = APIRouter(
    tags=["legal"],
)

@router.post("/api/legal/consent", response_model=schemas.LegalConsent)
async def record_legal_consent(
    consent_data: schemas.LegalConsentCreate,
    request: Request,
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(database.get_db)
):
    """
    Records a user's acceptance of a legal document (ToS, Privacy Policy, etc.).
    Captures IP and User Agent for audit trail relative to GDPR compliance.
    """
    
    # Enrich data with request metadata if not provided explicitly (though frontend might want to be explicit)
    ip = request.client.host
    user_agent = request.headers.get("user-agent")
    
    # Override or fill if missing in payload
    if not consent_data.ip_address:
         consent_data.ip_address = ip # Should be anonymized in production storage logic if needed
    if not consent_data.user_agent:
        consent_data.user_agent = user_agent

    new_consent = models.LegalConsent(
        user_id=current_user.id,
        document_type=consent_data.document_type,
        version=consent_data.version,
        consents=consent_data.consents,
        ip_address=consent_data.ip_address,
        user_agent=consent_data.user_agent
    )
    
    db.add(new_consent)
    db.commit()
    db.refresh(new_consent)
    
    return new_consent

@router.get("/api/legal/history", response_model=List[schemas.LegalConsent])
def get_legal_history(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Returns the history of legal consents for the current user.
    """
    return db.query(models.LegalConsent).filter(models.LegalConsent.user_id == current_user.id).order_by(models.LegalConsent.accepted_at.desc()).all()
