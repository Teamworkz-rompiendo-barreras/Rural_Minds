
from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Enum, Boolean, Float
from sqlalchemy.orm import relationship
from database import Base
import datetime
import uuid
import sqlalchemy.types as types
from sqlalchemy.dialects.postgresql import UUID

# Re-import GUID from models to ensure consistency if this was a separate file,
# but since I am appending to models.py or just providing the schema, I will assume
# this code goes into models.py or a new file.
# I will use the replace_file_content tool to append this to models.py

class Message(Base):
    __tablename__ = "messages"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    application_id = Column(GUID, ForeignKey("applications.id"), nullable=False, index=True)
    sender_id = Column(GUID, ForeignKey("users.id"), nullable=False)
    
    content = Column(String, nullable=True) # Text content
    message_type = Column(String, default="text") # text, voice, attachment, system
    
    attachment_url = Column(String, nullable=True)
    attachment_label = Column(String, nullable=True) # Accessibility label
    
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    application = relationship("Application", backref="messages")
    sender = relationship("User")

