import os
import secrets
import resend
from typing import Optional

# Configuration
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://rural-minds.vercel.app")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "Rural Minds <noreply@ruralminds.es>")

# Initialize Resend
resend.api_key = RESEND_API_KEY

# Check if we're in production mode (has API key)
IS_PRODUCTION = bool(RESEND_API_KEY)


def generate_verification_token() -> str:
    """Generate a secure random token for email verification."""
    return secrets.token_urlsafe(32)


def _send_email(to: str, subject: str, html: str) -> bool:
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
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: 'Atkinson Hyperlegible', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #374BA6 0%, #4B5CC4 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="margin: 0 0 10px 0; font-size: 28px;">¡Bienvenido a Rural Minds!</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 16px;">Innovación con denominación de origen</p>
        </div>
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 18px; color: #333; margin-top: 0;">Hola <strong>{user_name or 'Usuario'}</strong>,</p>
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
                Gracias por unirte a <strong>Rural Minds</strong>. Para activar tu cuenta y empezar a explorar oportunidades inclusivas, confirma tu email haciendo clic en el botón:
            </p>
            <div style="text-align: center; margin: 35px 0;">
                <a href="{verification_link}" style="background: #374BA6; color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(55,75,166,0.3);">
                    ✅ Confirmar mi Email
                </a>
            </div>
            <p style="font-size: 14px; color: #888; margin-bottom: 0;">
                ⏰ Este enlace es válido durante <strong>24 horas</strong>.
            </p>
            <p style="font-size: 14px; color: #888;">
                Si no creaste esta cuenta, puedes ignorar este mensaje.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #aaa; text-align: center; margin-bottom: 0;">
                Rural Minds. <em>Innovación con denominación de origen</em> © 2026<br>
                <span style="color: #374BA6;">Powered by Teamworkz</span>
            </p>
        </div>
    </body>
    </html>
    """
    
    return _send_email(
        to=to_email,
        subject="Confirma tu email - Rural Minds",
        html=html_content
    )


def send_welcome_email(to_email: str, user_name: str) -> bool:
    """
    Sends a welcome email after the user has verified their email.
    """
    onboarding_link = f"{FRONTEND_URL}/profile"
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: 'Atkinson Hyperlegible', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #374BA6 0%, #4B5CC4 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="margin: 0 0 10px 0; font-size: 28px;">🎉 ¡Cuenta Activada!</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 16px;">Ya formas parte de Rural Minds</p>
        </div>
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 18px; color: #333; margin-top: 0;">Hola <strong>{user_name or 'Usuario'}</strong>,</p>
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
                Tu email ha sido verificado correctamente. ¡Bienvenido/a a la comunidad de <strong>Rural Minds</strong>!
            </p>
            <div style="background: #F3F4F6; padding: 20px; border-radius: 10px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #374BA6;">📋 Próximos pasos:</h3>
                <ol style="margin: 0; padding-left: 20px; color: #555; line-height: 1.8;">
                    <li>Completa tu <strong>Perfil de Accesibilidad</strong></li>
                    <li>Explora oportunidades que se adaptan a ti</li>
                    <li>Conecta con empresas inclusivas</li>
                </ol>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{onboarding_link}" style="background: #F2D680; color: #0D1321; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block;">
                    Completar mi Perfil →
                </a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #aaa; text-align: center; margin-bottom: 0;">
                Rural Minds. <em>Innovación con denominación de origen</em> © 2026<br>
                <span style="color: #374BA6;">Powered by Teamworkz</span>
            </p>
        </div>
    </body>
    </html>
    """
    
    return _send_email(
        to=to_email,
        subject="🎉 ¡Bienvenido a Rural Minds!",
        html=html_content
    )


def send_password_reset_email(to_email: str, user_name: str, reset_token: str) -> bool:
    """
    Sends a password reset email with a secure link.
    """
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: 'Atkinson Hyperlegible', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: #374BA6; color: white; padding: 30px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="margin: 0;">🔑 Restablecer Contraseña</h1>
        </div>
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px;">
            <p style="font-size: 16px; color: #333;">Hola <strong>{user_name or 'Usuario'}</strong>,</p>
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta Rural Minds.
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="background: #374BA6; color: white; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; display: inline-block;">
                    Cambiar Contraseña
                </a>
            </div>
            <p style="font-size: 14px; color: #888;">
                ⏰ Este enlace expira en <strong>1 hora</strong>.
            </p>
            <p style="font-size: 14px; color: #888;">
                Si no solicitaste este cambio, ignora este email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #aaa; text-align: center;">
                Rural Minds © 2026 | Powered by Teamworkz
            </p>
        </div>
    </body>
    </html>
    """
    
    return _send_email(
        to=to_email,
        subject="Restablecer contraseña - Rural Minds",
        html=html_content
    )


def send_application_notification(to_email: str, candidate_name: str, project_title: str) -> bool:
    """
    Notifies enterprise when a candidate applies to their project.
    """
    dashboard_link = f"{FRONTEND_URL}/enterprise-dashboard"
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"></head>
    <body style="font-family: 'Atkinson Hyperlegible', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: #374BA6; color: white; padding: 30px; text-align: center; border-radius: 16px 16px 0 0;">
            <h1 style="margin: 0;">📩 Nueva Candidatura</h1>
        </div>
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 16px 16px;">
            <p style="font-size: 16px; color: #333;">
                ¡Tienes una nueva candidatura para tu proyecto!
            </p>
            <div style="background: #F3F4F6; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Proyecto:</strong> {project_title}</p>
                <p style="margin: 0;"><strong>Candidato:</strong> {candidate_name}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{dashboard_link}" style="background: #374BA6; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Ver Candidatura
                </a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #aaa; text-align: center;">
                Rural Minds © 2026 | Powered by Teamworkz
            </p>
        </div>
    </body>
    </html>
    """
    
    return _send_email(
        to=to_email,
        subject=f"Nueva candidatura: {project_title} - Rural Minds",
        html=html_content
    )
