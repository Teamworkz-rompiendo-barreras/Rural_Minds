
from typing import List, Optional, Any
from pydantic import BaseModel
from datetime import datetime
import uuid

# Re-defining dependencies for appending to schemas.py
# Using replace_file_content to append the Message schemas

class MessageBase(BaseModel):
    content: Optional[str] = None
    message_type: str = "text"
    attachment_url: Optional[str] = None
    attachment_label: Optional[str] = None

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: uuid.UUID
    application_id: uuid.UUID
    sender_id: uuid.UUID
    is_read: bool
    created_at: datetime
    
    class Config:
        orm_mode = True

