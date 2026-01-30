import os

# Mock Email Service for Beta
# In robust production, integrate with SendGrid, SES, or Resend.

def send_welcome_email(to_email: str, user_name: str):
    """
    Sends a welcome email to the new user.
    Loads HTML template and replaces placeholders.
    """
    try:
        # Resolve path relative to this file
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        template_path = os.path.join(base_dir, "templates", "welcome_email.html")
        
        with open(template_path, "r", encoding="utf-8") as f:
            html_content = f.read()
            
        # Replace placeholders
        # In production, use Jinja2
        onboarding_link = "https://rural-minds.vercel.app/profile" # Deep link to profile wizard
        
        html_content = html_content.replace("{{user_name}}", user_name)
        html_content = html_content.replace("{{onboarding_link}}", onboarding_link)
        
        # --- MOCK SENDING ---
        print(f"--- [EMAIL SENT] To: {to_email} ---")
        print(f"Subject: Bienvenida a Rural Minds")
        # print(html_content) # Uncomment to debug HTML
        print("-------------------------------------")
        
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False
