import os
import secrets
import resend
from typing import Optional

# Configuration
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://rural-minds.vercel.app")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "onboarding@resend.dev")

# Initialize Resend
resend.api_key = RESEND_API_KEY

# Check if we're in production mode (has API key)
# Check if we're in production mode (has API key)
IS_PRODUCTION = bool(RESEND_API_KEY)

from database import SessionLocal
from models import EmailTemplate
import re

def get_filled_template(key: str, default_subject: str, default_html: str, context: dict) -> tuple[str, str]:
    """
    Fetches template from DB or uses default.
    Substitutes {{variables}} in both subject and body.
    """
    db = SessionLocal()
    try:
        tmpl = db.query(EmailTemplate).filter(EmailTemplate.key == key).first()
        if tmpl:
            subject = tmpl.subject_template
            html = tmpl.body_html_template
        else:
            subject = default_subject
            html = default_html
    except Exception as e:
        print(f"⚠️ Template DB Error: {e}")
        subject = default_subject
        html = default_html
    finally:
        db.close()
        
    # Replace variables
    # We use simple string replacement or basic jinja-like {{var}}
    for k, v in context.items():
        placeholder = "{{" + k + "}}"
        # Use str(v) just in case
        clean_v = str(v)
        if subject:
            subject = subject.replace(placeholder, clean_v)
        if html:
            html = html.replace(placeholder, clean_v)
            
    return subject, html


def generate_verification_token() -> str:
    """Generate a secure random token for email verification."""
    return secrets.token_urlsafe(32)


def _send_email(to: str, subject: str, html: str, attachments: Optional[list] = None) -> bool:
    """
    Internal function to send email via Resend.
    Falls back to console logging if no API key is configured.
    """
    if IS_PRODUCTION:
        try:
            params = {
                "from": FROM_EMAIL,
                "to": [to],
                "subject": subject,
                "html": html,
            }
            if attachments:
                params["attachments"] = attachments
                
            response = resend.Emails.send(params)
            print(f"✅ Email sent to {to} | ID: {response.get('id', 'N/A')}")
            return True
        except Exception as e:
            print(f"❌ Resend error: {e}")
            return False
    else:
        # Development mode: print to console
        print(f"\n{'='*60}")
        print(f"📧 [DEV MODE - EMAIL NOT SENT]")
        print(f"📧 To: {to}")
        print(f"📧 Subject: {subject}")
        print(f"📧 Configure RESEND_API_KEY to send real emails")
        print(f"{'='*60}\n")
        return True


def send_verification_email(to_email: str, user_name: str, verification_token: str) -> bool:
    """
    Sends an email verification link to the new user.
    User must click the link to confirm their email before logging in.
    """
    verification_link = f"{FRONTEND_URL}/verify-email?token={verification_token}"
    
    # Default Template (Hardcoded)
    # Using {{variables}} instead of f-string interpolation for consistency with DB template format
    default_html = """
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: 'Atkinson Hyperlegible', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #374BA6 0%, #4B5CC4 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="margin: 0 0 10px 0; font-size: 28px;">¡Bienvenido a Rural Minds!</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 16px;">Innovación con denominación de origen</p>
        </div>
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 18px; color: #111; margin-top: 0;">Hola <strong>{{user_name}}</strong>,</p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Gracias por unirte a <strong>Rural Minds</strong>. Para activar tu cuenta y empezar a explorar oportunidades inclusivas, confirma tu email haciendo clic en el botón:
            </p>
            <div style="text-align: center; margin: 35px 0;">
                <a href="{{verification_link}}" style="background: #374BA6; color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(55,75,166,0.3);">
                    ✅ Confirmar mi Email
                </a>
            </div>
            <p style="font-size: 14px; color: #595959; margin-bottom: 0;">
                ⏰ Este enlace es válido durante <strong>24 horas</strong>.
            </p>
            <p style="font-size: 14px; color: #595959;">
                Si no creaste esta cuenta, puedes ignorar este mensaje.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="font-size: 12px; color: #595959; text-align: center; margin-bottom: 0;">
                Rural Minds. <em>Innovación con denominación de origen</em> © 2026<br>
                <span style="color: #374BA6;">Powered by Teamworkz</span>
            </p>
        </div>
    </body>
    </html>
    """
    
    subject, html_content = get_filled_template(
        key="verification",
        default_subject="Confirma tu email - Rural Minds",
        default_html=default_html,
        context={
            "user_name": user_name or 'Usuario',
            "verification_link": verification_link
        }
    )
    
    return _send_email(
        to=to_email,
        subject=subject,
        html=html_content
    )


def send_welcome_email(to_email: str, user_name: str) -> bool:
    """
    Sends a welcome email after the user has verified their email.
    """
    onboarding_link = f"{FRONTEND_URL}/profile"
    
    
    # Default Template
    default_html = """
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: 'Atkinson Hyperlegible', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: #374BA6; background: linear-gradient(135deg, #374BA6 0%, #4B5CC4 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="margin: 0 0 10px 0; font-size: 28px; color: #ffffff;">🎉 ¡Cuenta Activada!</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 16px; color: #f0f0f0;">Ya formas parte de Rural Minds</p>
        </div>
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 18px; color: #111; margin-top: 0;">Hola <strong>{{user_name}}</strong>,</p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Tu email ha sido verificado correctamente. ¡Bienvenido/a a la comunidad de <strong>Rural Minds</strong>!
            </p>
            <div style="background: #F3F4F6; padding: 20px; border-radius: 10px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #374BA6;">📋 Próximos pasos:</h3>
                <ol style="margin: 0; padding-left: 20px; color: #333; line-height: 1.8;">
                    <li>Completa tu <strong>Perfil de Accesibilidad</strong></li>
                    <li>Explora oportunidades que se adaptan a ti</li>
                    <li>Conecta con empresas inclusivas</li>
                </ol>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{onboarding_link}}" style="background: #F2D680; color: #0D1321; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block;">
                    Completar mi Perfil →
                </a>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="font-size: 12px; color: #595959; text-align: center; margin-bottom: 0;">
                Rural Minds. <em>Innovación con denominación de origen</em> © 2026<br>
                <span style="color: #374BA6;">Powered by Teamworkz</span>
            </p>
        </div>
    </body>
    </html>
    """
    
    subject, html_content = get_filled_template(
        key="welcome",
        default_subject="🎉 ¡Bienvenido a Rural Minds!",
        default_html=default_html,
        context={
            "user_name": user_name or 'Usuario',
            "onboarding_link": onboarding_link
        }
    )

    return _send_email(
        to=to_email,
        subject=subject,
        html=html_content
    )


def send_password_reset_email(to_email: str, user_name: str, reset_token: str) -> bool:
    """
    Sends a password reset email with a secure link.
    """
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    
    
    # Default Template
    default_html = """
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: 'Atkinson Hyperlegible', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: #374BA6; color: white; padding: 30px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="margin: 0;">🔑 Restablecer Contraseña</h1>
        </div>
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px;">
            <p style="font-size: 16px; color: #111;">Hola <strong>{{user_name}}</strong>,</p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta Rural Minds.
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{reset_link}}" style="background: #374BA6; color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block;">
                    Cambiar Contraseña
                </a>
            </div>
            <p style="font-size: 14px; color: #595959;">
                ⏰ Este enlace expira en <strong>1 hora</strong>.
            </p>
            <p style="font-size: 14px; color: #595959;">
                Si no solicitaste este cambio, ignora este email.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="font-size: 12px; color: #595959; text-align: center;">
                Rural Minds © 2026 | Powered by Teamworkz
            </p>
        </div>
    </body>
    </html>
    """
    
    subject, html_content = get_filled_template(
        key="password_reset",
        default_subject="Restablecer contraseña - Rural Minds",
        default_html=default_html,
        context={
            "user_name": user_name or 'Usuario',
            "reset_link": reset_link
        }
    )

    return _send_email(
        to=to_email,
        subject=subject,
        html=html_content
    )


def send_application_notification(to_email: str, candidate_name: str, project_title: str) -> bool:
    """
    Notifies enterprise when a candidate applies to their project.
    """
    dashboard_link = f"{FRONTEND_URL}/enterprise-dashboard"
    
    # Default Template
    default_html = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: 'Atkinson Hyperlegible', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: #374BA6; color: white; padding: 30px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="margin: 0;">📩 Nueva Candidatura</h1>
        </div>
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px;">
            <p style="font-size: 16px; color: #111;">
                ¡Tienes una nueva candidatura para tu proyecto!
            </p>
            <div style="background: #F3F4F6; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; color: #333;"><strong>Proyecto:</strong> {{project_title}}</p>
                <p style="margin: 0; color: #333;"><strong>Candidato:</strong> {{candidate_name}}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{dashboard_link}}" style="background: #374BA6; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Ver Candidatura
                </a>
            </div>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="font-size: 12px; color: #595959; text-align: center;">
                Rural Minds © 2026 | Powered by Teamworkz
            </p>
        </div>
    </body>
    </html>
    """
    
    subject, html_content = get_filled_template(
        key="new_application",
        default_subject=f"Nueva candidatura: {project_title} - Rural Minds",
        default_html=default_html,
        context={
            "project_title": project_title,
            "candidate_name": candidate_name,
            "dashboard_link": dashboard_link
        }
    )
    
    return _send_email(
        to=to_email,
        subject=subject,
        html=html_content
    )


def send_municipality_welcome_email(to_email: str, talent_name: str, municipality_name: str, guide_url: str = "#", contact_email: str = "#") -> bool:
    """
    Sends a welcome email when a talent adds a municipality to their target locations.
    """
    # Default Template
    default_html = """
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: 'Atkinson Hyperlegible', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: #374BA6; background: linear-gradient(135deg, #374BA6 0%, #4B5CC4 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="margin: 0 0 10px 0; font-size: 24px; color: #ffffff;">{{municipality_name}} te espera 🌿</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 16px; color: #f0f0f0;">Innovación con Denominación de Origen</p>
        </div>
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 18px; color: #111; margin-top: 0;">¡Hola <strong>{{talent_name}}</strong>!</p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Hemos visto que tienes interés en formar parte de nuestra comunidad en <strong>{{municipality_name}}</strong>. En Rural Minds, creemos que el talento no tiene fronteras, pero sí raíces, y nos encanta que consideres las nuestras para tu próximo paso profesional.
            </p>
            
            <h3 style="color: #374BA6; margin-top: 25px;">¿En qué puede ayudarte tu nuevo Ayuntamiento?</h3>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Moverse al entorno rural es una decisión valiente. Queremos facilitarte el aterrizaje:
            </p>
            
            <div style="background: #F3F4F6; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <ul style="margin: 0; padding-left: 20px; color: #333; line-height: 1.8;">
                    <li><strong>🏠 Vivienda:</strong> Recursos para encontrar tu hogar.</li>
                    <li><strong>🏫 Servicios:</strong> Fibra óptica, colegios, transporte.</li>
                    <li><strong>🤝 Integración:</strong> Te conectaremos con redes locales.</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0; display: flex; flex-direction: column; gap: 10px;">
                <a href="{{guide_url}}" style="background: #374BA6; color: white; padding: 16px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block;">
                    📖 Descargar Guía de Aterrizaje
                </a>
                <a href="mailto:{{contact_email}}" style="color: #374BA6; text-decoration: underline; font-size: 14px; margin-top: 10px; display: inline-block;">
                    Contactar con Agente de Desarrollo Local
                </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="font-size: 12px; color: #595959; text-align: center;">
                Gestión impulsada por Rural Minds & Teamworkz.
            </p>
        </div>
    </body>
    </html>
    """
    
    subject, html_content = get_filled_template(
        key="municipality_welcome",
        default_subject=f"{municipality_name} te espera: Innovación con Denominación de Origen 🌿",
        default_html=default_html,
        context={
            "talent_name": talent_name or 'Talento',
            "municipality_name": municipality_name,
            "guide_url": guide_url,
            "contact_email": contact_email
        }
    )

    return _send_email(
        to=to_email,
        subject=subject,
        html=html_content
    )


def send_invitation_email(to_email: str, entity_name: str, token: str) -> bool:
    """
    Sends an invitation email to a municipality or organization.
    The magic link allows them to register and set their password.
    """
    # Link to the registration page for invited users
    invite_link = f"{FRONTEND_URL}/register-municipality?token={token}"
    
    
    # Default Template
    default_html = """
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: 'Atkinson Hyperlegible', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: #374BA6; background: linear-gradient(135deg, #374BA6 0%, #4B5CC4 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="margin: 0 0 10px 0; font-size: 24px; color: #ffffff;">Invitación a Rural Minds</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 16px; color: #f0f0f0;">Plataforma de Talento e Innovación Rural</p>
        </div>
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 18px; color: #111; margin-top: 0;">Hola,</p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Has sido invitado para activar el perfil de <strong>{{entity_name}}</strong> en Rural Minds.
            </p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Haz clic en el siguiente botón para establecer tu contraseña y configurar tu ficha de municipio.
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="{{invite_link}}" style="background: #374BA6; color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(55,75,166,0.3);">
                    ✅ Activar acceso de {{entity_name}}
                </a>
            </div>
            
            <p style="font-size: 14px; color: #595959; text-align: center;">
                Este enlace expira en 48 horas.
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="font-size: 12px; color: #595959; text-align: center;">
                Rural Minds © 2026 | Powered by Teamworkz
            </p>
        </div>
    </body>
    </html>
    """
    
    subject, html_content = get_filled_template(
        key="invitation",
        default_subject=f"Activar acceso de {entity_name} - Rural Minds",
        default_html=default_html,
        context={
            "entity_name": entity_name,
            "invite_link": invite_link
        }
    )

    return _send_email(
        to=to_email,
        subject=subject,
        html=html_content
    )


def send_company_invitation_email(to_email: str, company_name: str, municipality_name: str, invite_url: str, signature: str = "Ayuntamiento") -> bool:
    """
    Sends an invitation email to a local company from a municipality.
    """
    
    # Updated to use template system
    
    # Default Template
    default_html = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: 'Atkinson Hyperlegible', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #0F5C2E 0%, #1a8f46 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="margin: 0 0 10px 0; font-size: 24px;">{municipality_name} te invita a liderar 🌿</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 16px;">Innovación con Denominación de Origen</p>
        </div>
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 18px; color: #111; margin-top: 0;">Estimado/a responsable de <strong>{{company_name}}</strong>,</p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Desde el Ayuntamiento de <strong>{{municipality_name}}</strong>, estamos impulsando una iniciativa pionera para fortalecer nuestro tejido empresarial y fijar el talento en nuestras calles: <strong>Rural Minds</strong>.
            </p>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Queremos que vuestra empresa sea parte activa de este cambio. Al unirse a nuestra red local, no solo accederán a profesionales cualificados de la zona, sino que contarán con el soporte de Teamworkz para asegurar que cada contratación sea un éxito de inclusión y productividad.
            </p>

            <h3 style="color: #0F5C2E; margin-top: 25px;">¿Qué ganáis como empresa local?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #333; line-height: 1.8;">
                <li><strong>🎯 Acceso a Talento Especializado:</strong> Perfiles con alta capacidad y adecuación sensorial.</li>
                <li><strong>🎖️ Sello de Excelencia:</strong> Reconocimiento público como empresa socialmente responsable.</li>
                <li><strong>📊 Métricas de Impacto:</strong> Datos reales sobre vuestra contribución al bienestar local.</li>
            </ul>

            <div style="text-align: center; margin: 35px 0;">
                <a href="{{invite_url}}" style="background: #374BA6; color: white; padding: 16px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(55,75,166,0.3);">
                    Aceptar invitación y registrar mi empresa
                </a>
            </div>
            
            <p style="font-size: 14px; color: #595959; text-align: center;">
                Unirse es gratuito para las empresas de nuestro municipio.
            </p>
            
            <p style="font-size: 16px; color: #333; margin-top: 30px;">
                Atentamente,<br>
                <strong>{{signature}}</strong>
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="font-size: 12px; color: #595959; text-align: center;">
                Rural Minds © 2026 | Powered by Teamworkz
            </p>
        </div>
    </body>
    </html>
    """

    subject, html_content = get_filled_template(
        key="company_invitation",
        default_subject=f"{municipality_name} te invita a liderar la Innovación con Denominación de Origen 🌿",
        default_html=default_html,
        context={
            "company_name": company_name,
            "municipality_name": municipality_name,
            "invite_url": invite_url,
            "signature": signature
        }
    )
    
    return _send_email(
        to=to_email,
        subject=subject,
        html=html_content
    )


def send_monthly_report_email(to_email: str, municipality_name: str, month_name: str, pdf_content: bytes) -> bool:
    """
    Sends the Monthly Impact Report as a PDF attachment.
    """
    import base64
    
    encoded_content = base64.b64encode(pdf_content).decode()
    
    attachments = [{
        "filename": f"Impacto_Rural_{municipality_name}_{month_name}.pdf",
        "content": encoded_content
    }]
    
    default_html = """
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: 'Atkinson Hyperlegible', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: #374BA6; color: white; padding: 40px 30px; border-radius: 16px 16px 0 0;">
            <h1 style="margin: 0;">📊 Resultados de Impacto Rural Minds</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">{{municipality_name}} | {{month_name}} 2026</p>
        </div>
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #111;">Estimados/as responsables del Ayuntamiento de <strong>{{municipality_name}}</strong>,</p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Adjuntamos el <strong>Informe de Impacto Mensual</strong> correspondiente a {{month_name}}. Este documento recopila el éxito de nuestra apuesta conjunta por la atracción de talento y el fortalecimiento del arraigo local.
            </p>
            
            <div style="background: #F3F4F6; padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #F2D680;">
                <p style="margin: 0; color: #374BA6; font-weight: bold;">Resumen del Periodo:</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #555;">
                    El informe detalla los nuevos residentes potenciales, las empresas colaboradoras más activas y el diagnóstico sensorial del municipio basado en las preferencias de los candidatos.
                </p>
            </div>
            
            <p style="font-size: 14px; color: #555;">
                Este reporte es una herramienta estratégica enviada automáticamente por el sistema para facilitar la justificación de impacto social en el pleno municipal.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #888; text-align: center;">
                Rural Minds & Teamworkz | Innovación con Denominación de Origen
            </p>
        </div>
    </body>
    </html>
    """
    
    subject, html_content = get_filled_template(
        key="monthly_report",
        default_subject=f"Resultados de Impacto Rural Minds - {month_name}",
        default_html=default_html,
        context={
            "municipality_name": municipality_name,
            "month_name": month_name
        }
    )
    
    return _send_email(
        to=to_email,
        subject=subject,
        html=html_content,
        attachments=attachments
    )
