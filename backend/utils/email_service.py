import os
import secrets
import datetime

# Mock Email Service for Beta
# In robust production, integrate with SendGrid, SES, or Resend.

FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://rural-minds.vercel.app")

def generate_verification_token() -> str:
    """Generate a secure random token for email verification."""
    return secrets.token_urlsafe(32)


def send_verification_email(to_email: str, user_name: str, verification_token: str) -> bool:
    """
    Sends an email verification link to the new user.
    User must click the link to confirm their email before logging in.
    """
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        template_path = os.path.join(base_dir, "templates", "verification_email.html")
        
        # Check if template exists, otherwise use a basic message
        if os.path.exists(template_path):
            with open(template_path, "r", encoding="utf-8") as f:
                html_content = f.read()
        else:
            # Fallback basic HTML
            html_content = """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: 'Atkinson Hyperlegible', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #374BA6; color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="margin: 0;">¡Bienvenido a Rural Minds!</h1>
                </div>
                <div style="background: #F3F4F6; padding: 30px; border-radius: 0 0 12px 12px;">
                    <p style="font-size: 16px;">Hola <strong>{{user_name}}</strong>,</p>
                    <p style="font-size: 16px;">Gracias por unirte a <strong>Rural Minds</strong>. Para completar tu registro, confirma tu email haciendo clic en el botón:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{{verification_link}}" style="background: #374BA6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            Confirmar mi Email
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #666;">Este enlace es válido durante 24 horas.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="font-size: 12px; color: #999; text-align: center;">
                        Rural Minds. <em>Innovación con denominación de origen</em> © 2026<br>
                        Powered by Teamworkz
                    </p>
                </div>
            </body>
            </html>
            """
        
        # Build verification link
        verification_link = f"{FRONTEND_URL}/verify-email?token={verification_token}"
        
        # Replace placeholders
        html_content = html_content.replace("{{user_name}}", user_name or "Usuario")
        html_content = html_content.replace("{{verification_link}}", verification_link)
        
        # --- MOCK SENDING ---
        # In production: integrate with SendGrid, SES, or Resend
        print(f"\n{'='*50}")
        print(f"📧 [EMAIL SENT] To: {to_email}")
        print(f"📧 Subject: Confirma tu email - Rural Minds")
        print(f"📧 Verification Link: {verification_link}")
        print(f"{'='*50}\n")
        
        return True
    except Exception as e:
        print(f"Error sending verification email: {e}")
        return False


def send_welcome_email(to_email: str, user_name: str) -> bool:
    """
    Sends a welcome email after the user has verified their email.
    This is sent AFTER email confirmation, not during registration.
    """
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        template_path = os.path.join(base_dir, "templates", "welcome_email.html")
        
        with open(template_path, "r", encoding="utf-8") as f:
            html_content = f.read()
            
        onboarding_link = f"{FRONTEND_URL}/profile"
        
        html_content = html_content.replace("{{user_name}}", user_name or "Usuario")
        html_content = html_content.replace("{{onboarding_link}}", onboarding_link)
        
        # --- MOCK SENDING ---
        print(f"\n{'='*50}")
        print(f"🎉 [WELCOME EMAIL SENT] To: {to_email}")
        print(f"🎉 Subject: ¡Bienvenido a Rural Minds!")
        print(f"🎉 Onboarding Link: {onboarding_link}")
        print(f"{'='*50}\n")
        
        return True
    except Exception as e:
        print(f"Error sending welcome email: {e}")
        return False


def send_password_reset_email(to_email: str, user_name: str, reset_token: str) -> bool:
    """
    Sends a password reset email with a secure link.
    """
    try:
        reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
        
        # --- MOCK SENDING ---
        print(f"\n{'='*50}")
        print(f"🔑 [PASSWORD RESET EMAIL SENT] To: {to_email}")
        print(f"🔑 Subject: Restablecer contraseña - Rural Minds")
        print(f"🔑 Reset Link: {reset_link}")
        print(f"{'='*50}\n")
        
        return True
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        return False
