from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import models, schemas, auth, database
import uuid

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

@router.post("/register", response_model=schemas.Token)
def register(
    org_data: schemas.OrganizationCreate, 
    user_data: schemas.UserCreate, 
    db: Session = Depends(database.get_db)
):
    # 1. Create Organization
    existing_org = db.query(models.Organization).filter(models.Organization.name == org_data.name).first()
    if existing_org:
        raise HTTPException(status_code=400, detail="Organization name already taken")
        
    new_org = models.Organization(
        id=uuid.uuid4(),
        **org_data.model_dump()
    )
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    
    # 2. Create Admin User
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User email already registered")
        
    hashed_pwd = auth.get_password_hash(user_data.password)
    new_user = models.User(
        id=uuid.uuid4(),
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_pwd,
        role="super_admin",
        organization_id=new_org.id
    )
    db.add(new_user)
    db.commit()
    
    # 3. Generate Token
    access_token = auth.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        # Custom Error Message Standard
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión caducada o credenciales inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
