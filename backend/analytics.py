import logging
import datetime

# Configure logging
logging.basicConfig(
    filename='analytics.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def log_event(event_type: str, user_id: int, details: dict = None):
    """
    Log an analytics event.
    
    Args:
        event_type (str): Type of event (e.g., 'challenge_created', 'login')
        user_id (int): ID of the user performing the action
        details (dict, optional): Additional context
    """
    payload = {
        "event": event_type,
        "user_id": user_id,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "details": details or {}
    }
    logging.info(f"ANALYTICS: {payload}")
