from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
import models, database, auth
import shutil
import os
import uuid
import datetime
from typing import List, Optional

router = APIRouter(
    prefix="/config",
    tags=["config"],
)

GLOBAL_ASSETS_DIR = "static/global-assets"
try:
    os.makedirs(GLOBAL_ASSETS_DIR, exist_ok=True)
except OSError:
    # Likely read-only file system (Vercel)
    # Use /tmp for temporary storage if absolutely needed, 
    # but for now we just suppress the crash to allow startup.
    if os.getenv("VERCEL"):
        GLOBAL_ASSETS_DIR = "/tmp/global-assets"
        try:
            os.makedirs(GLOBAL_ASSETS_DIR, exist_ok=True)
        except:
            pass
    else:
        print(f"Warning: Could not create {GLOBAL_ASSETS_DIR}")

# Helper for standardizing URLs
def get_asset_url(filename: str):
    return f"/static/global-assets/{filename}"

# --- System Config ---

@router.get("/system")
def get_system_config(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    configs = db.query(models.SystemConfig).all()
    # Ensure defaults exist if empty
    defaults = {
        "token_expiry_hours": {"value": "24", "description": "Hours before invitation/verification tokens expire", "type": "number"},
        "match_threshold": {"value": "75", "description": "Minimum score for ideal match", "type": "number"},
        "support_email": {"value": "soporte@ruralminds.es", "description": "Contact email for help", "type": "string"}
    }
    
    # Simple logic: if DB is missing keys, return defaults combined with DB
    current_keys = {c.key: c for c in configs}
    result = []
    
    for k, v in defaults.items():
        if k in current_keys:
            result.append(current_keys[k])
        else:
            # Create default in memory (not saving to avoid clutter until edited)
            result.append({
                "key": k,
                "value": v["value"],
                "description": v["description"],
                "data_type": v["type"]
            })
            
    # Add any extra keys in DB
    for k, c in current_keys.items():
        if k not in defaults:
            result.append(c)
            
    return result

@router.put("/system/{key}")
def update_system_config(
    key: str,
    payload: dict,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    value = payload.get("value")
    if value is None:
        raise HTTPException(status_code=400, detail="Missing value")
        
    config = db.query(models.SystemConfig).filter(models.SystemConfig.key == key).first()
    if not config:
        config = models.SystemConfig(key=key, value=str(value), description=payload.get("description"), data_type=payload.get("data_type", "string"))
        db.add(config)
    else:
        config.value = str(value)
        if payload.get("description"):
            config.description = payload.get("description")
            
    db.commit()
    return {"message": "Config updated", "key": key, "value": value}


# --- Email Templates ---

@router.get("/emails")
def get_email_templates(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    templates = db.query(models.EmailTemplate).all()
    # Return defaults if empty logic could be here too, but frontend will handle empty list or we seed DB later.
    return templates

@router.put("/emails/{key}")
def update_email_template(
    key: str,
    payload: dict,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    tmpl = db.query(models.EmailTemplate).filter(models.EmailTemplate.key == key).first()
    if not tmpl:
        tmpl = models.EmailTemplate(
            key=key,
            subject_template=payload.get("subject", ""),
            body_html_template=payload.get("body_html", ""),
            variables_schema=payload.get("variables_schema", {})
        )
        db.add(tmpl)
    else:
        tmpl.subject_template = payload.get("subject", tmpl.subject_template)
        tmpl.body_html_template = payload.get("body_html", tmpl.body_html_template)
        tmpl.variables_schema = payload.get("variables_schema", tmpl.variables_schema)
        
    db.commit()
    return {"message": "Template updated"}


# --- Master Resources ---

@router.get("/resources")
def get_resources(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    return db.query(models.MasterResource).order_by(models.MasterResource.updated_at.desc()).all()

@router.post("/resources/upload")
async def upload_resource(
    file: UploadFile = File(...),
    name: str = Form(...),
    resource_type: str = Form(...), # pdf, seal_template, guide
    key_identifier: Optional[str] = Form(None), # e.g., 'kit_bienvenida_aytos' to overwrite specific master
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.require_super_admin)
):
    # 1. Determine Filename
    # If key_identifier is provided, use it as filename base to ensure stable URL
    ext = file.filename.split('.')[-1]
    if key_identifier:
        filename = f"{key_identifier}.{ext}"
    else:
        filename = f"{uuid.uuid4()}.{ext}"
        
    file_location = os.path.join(GLOBAL_ASSETS_DIR, filename)
    
    # 2. Save File
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    public_url = get_asset_url(filename)
    
    # 3. Update/Create DB Record
    # If key_identifier used, find existing record with that name/identifier logic?
    # Actually, MasterResource doesn't have a unique key other than ID.
    # But for "Master" resources, we might want to overwrite by "name" or just create new version entry?
    # User requirement: " archivos deben tener una URL fija".
    # So if I upload "Kit Bienvenida", it should ideally overwrite "kit_bienvenida.pdf".
    
    # Let's check if a resource with this name exists, or just treat key_identifier as the unique slug.
    
    if key_identifier:
        # Find existing resource pointing to this file_path/identifier?
        # Or just create new record but logic handles the file overwrite.
        pass

    resource = models.MasterResource(
        id=uuid.uuid4(),
        name=name,
        resource_type=resource_type,
        file_path=file_location,
        public_url=public_url,
        updated_by=current_user.id,
        version=datetime.datetime.now().strftime("%Y%m%d-%H%M")
    )
    db.add(resource)
    db.commit()
    
    return resource
