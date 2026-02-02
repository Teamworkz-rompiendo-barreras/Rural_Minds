from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import models, schemas, auth, database
import uuid
import datetime
from utils.email_service import send_verification_email, send_welcome_email, generate_verification_token, send_password_reset_email

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

# Token validity: 24 hours
VERIFICATION_TOKEN_EXPIRE_HOURS = 24
RESET_TOKEN_EXPIRE_MINUTES = 30


@router.post("/register", response_model=dict)
def register(
    payload: dict,
    db: Session = Depends(database.get_db)
):
    """
    Register a new user with email verification requirement.
    User must confirm email before being able to log in.
    """
    org_data = payload.get("org_data", {})
    user_data = payload.get("user_data", {})
    
    # Validate required fields
    if not user_data.get("email") or not user_data.get("password"):
        raise HTTPException(status_code=400, detail="Email y contraseña son obligatorios")
    
    # 1. Check if organization name already exists
    if org_data.get("name"):
        existing_org = db.query(models.Organization).filter(
            models.Organization.name == org_data["name"]
        ).first()
        if existing_org:
            raise HTTPException(status_code=400, detail="El nombre de la organización ya está registrado")
    
    # 2. Check if user email already exists
    existing_user = db.query(models.User).filter(
        models.User.email == user_data["email"]
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Este email ya está registrado")
    
    # 3. Create Organization
    new_org = models.Organization(
        id=uuid.uuid4(),
        name=org_data.get("name", f"Org-{user_data['email'].split('@')[0]}"),
        subscription_plan=org_data.get("subscription_plan", "starter")
    )
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    
    # 4. Generate verification token
    verification_token = generate_verification_token()
    token_expires = datetime.datetime.utcnow() + datetime.timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS)
    
    # 5. Hash password and create user
    hashed_pwd = auth.get_password_hash(user_data["password"])
    
    # Secure Role Assignment: Never allow super_admin via public registration
    target_role = user_data.get("role", "talent")
    if target_role not in ["enterprise", "talent"]:
        target_role = "enterprise"
    
    new_user = models.User(
        id=uuid.uuid4(),
        email=user_data["email"],
        full_name=user_data.get("full_name", user_data["email"].split("@")[0]),
        hashed_password=hashed_pwd,
        role=target_role,
        organization_id=new_org.id,
        status="pending",  # Cannot login until verified
        email_verified=False,
        verification_token=verification_token,
        verification_token_expires=token_expires
    )
    db.add(new_user)
    db.commit()
    
    # 6. Send Verification Email
    send_verification_email(
        to_email=new_user.email,
        user_name=new_user.full_name,
        verification_token=verification_token
    )
    
    return {
        "message": "Registro exitoso. Por favor, revisa tu email para confirmar tu cuenta.",
        "email": new_user.email,
        "needs_verification": True
    }


@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(database.get_db)):
    """
    Verify user's email using the token sent via email.
    Activates the user account upon successful verification.
    """
    # Find user with this verification token
    user = db.query(models.User).filter(
        models.User.verification_token == token
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Token de verificación inválido o ya utilizado"
        )
    
    # Check if token has expired
    if user.verification_token_expires and user.verification_token_expires < datetime.datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="El enlace de verificación ha expirado. Por favor, solicita uno nuevo."
        )
    
    # Mark email as verified and activate user
    user.email_verified = True
    user.status = "active"
    user.verification_token = None  # Clear token after use
    user.verification_token_expires = None
    db.commit()
    
    # Send Welcome Email now that account is verified
    send_welcome_email(to_email=user.email, user_name=user.full_name)
    
    return {
        "message": "¡Email verificado correctamente! Ya puedes iniciar sesión.",
        "email": user.email,
        "verified": True
    }


@router.post("/resend-verification")
def resend_verification(email: str, db: Session = Depends(database.get_db)):
    """
    Resend verification email if the user hasn't verified yet.
    """
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        # Don't reveal if email exists
        return {"message": "Si el email existe, recibirás un nuevo enlace de verificación."}
    
    if user.email_verified:
        return {"message": "Este email ya está verificado. Puedes iniciar sesión."}
    
    # Generate new token
    new_token = generate_verification_token()
    user.verification_token = new_token
    user.verification_token_expires = datetime.datetime.utcnow() + datetime.timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS)
    db.commit()
    
    # Send new verification email
    send_verification_email(
        to_email=user.email,
        user_name=user.full_name,
        verification_token=new_token
    )
    
    return {"message": "Se ha enviado un nuevo enlace de verificación a tu email."}


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    """
    Authenticate user. Requires email to be verified before allowing login.
    """
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email no registrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña incorrecta",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if email is verified
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Por favor, confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta está deshabilitada. Contacta con soporte.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/forgot-password")
def forgot_password(email: str, db: Session = Depends(database.get_db)):
    """
    Trigger password reset flow. Sends email with reset token.
    """
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        # Security: fake success to avoid email enumeration
        return {"message": "Si el email existe, recibirás instrucciones para restablecer tu contraseña."}
    
    # Generate token
    token = generate_verification_token() # Reusing uuid generator
    user.verification_token = token
    user.verification_token_expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
    db.commit()
    
    # Send Email
    send_password_reset_email(
        to_email=user.email,
        user_name=user.full_name,
        reset_token=token
    )
    
    return {"message": "Si el email existe, recibirás instrucciones para restablecer tu contraseña."}


@router.post("/reset-password")
def reset_password(payload: dict, db: Session = Depends(database.get_db)):
    """
    Reset password using valid token.
    payload: { "token": "...", "new_password": "..." }
    """
    token = payload.get("token")
    new_password = payload.get("new_password")
    
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Faltan datos requeridos")
        
    user = db.query(models.User).filter(models.User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
        
    if user.verification_token_expires < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token expirado")
        
    # Update password
    user.hashed_password = auth.get_password_hash(new_password)
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()
    
    return {"message": "Contraseña actualizada correctamente. Ya puedes iniciar sesión."}
