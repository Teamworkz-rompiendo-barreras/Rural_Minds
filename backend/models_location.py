from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from database import Base
import uuid
import sqlalchemy.types as types

# Reusing GUID helper if needed, or importing it if we move it to a utils file.
# For now, redefining strictly what's needed or importing from models if possible.
# But circular imports are bad. Let's assume we can use the GUID type if we move it 
# or just copy it for now to avoid refactoring everything immediately.
# Actually, models.py has the GUID class. 
# Better approach: Create a `backend/database_utils.py` or similar? 
# or just put Location in `models.py` directly? 
# The user request mentioned "[NEW] backend/models_location.py" in my plan.
# I will try to keep it separate but might need to duplicate GUID or move it.
# Let's move GUID to `database.py` or a new `types.py`?
# To save time and complexity, I will put `Location` in `models.py` directly OR 
# duplicate the GUID class in `models_location.py` for now (easiest).

class GUID(types.TypeDecorator):
    """Platform-independent GUID type."""
    impl = types.CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(UUID())
        else:
            return dialect.type_descriptor(types.CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return str(uuid.UUID(value))
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                value = uuid.UUID(value)
            return value

class Location(Base):
    __tablename__ = "locations"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    municipality = Column(String, index=True)
    province = Column(String, index=True)
    autonomous_community = Column(String)
    
    # Geospatial data for radius search
    latitude = Column(types.Float, nullable=True)
    longitude = Column(types.Float, nullable=True)

class MunicipalityResource(Base):
    __tablename__ = "municipality_resources"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    location_id = Column(GUID, index=True) # Foreign key logic to be handled by app or implicit
    landing_guide_url = Column(String, nullable=True)
    adl_contact_email = Column(String, nullable=True)
    
    # Ideally define relationship if Locations were in same file or using string reference
    # location = relationship("Location", back_populates="resources")

class MunicipalityDetails(Base):
    __tablename__ = "municipality_details"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    location_id = Column(GUID, index=True) # Foreign App Key
    
    # Branding
    slogan = Column(String, nullable=True)
    description = Column(String, nullable=True)
    
    # Vital Stats
    population = Column(types.Integer, nullable=True)
    altitude = Column(types.Integer, nullable=True)
    average_climate = Column(String, nullable=True)
    
    # Infrastructure (Semaphore)
    internet_speed = Column(String, nullable=True) # e.g. "1Gbps Fibra"
    has_fiber_600 = Column(types.Boolean, default=False)
    
    connectivity_info = Column(String, nullable=True) # e.g. "45 min a Madrid"
    environment_type = Column(String, nullable=True) # Montaña, Costa, Valle, Interior
    
    # Sensory Pulse
    noise_level = Column(String, nullable=True) # Silencio profundo, etc.
    light_pollution = Column(String, nullable=True) # Baja, Media, Alta
    life_pace = Column(String, nullable=True) # Tranquilo, Vibrante, etc.
    
    mobile_coverage = Column(String, nullable=True) # 4G, 5G
    has_coworking = Column(types.Boolean, default=False)
    
    climate_co2 = Column(String, nullable=True) # e.g. "Baja densidad"
    
    # Services JSON
    # { "health": "...", "education": "...", "coworking": "...", "commerce": "..." }
    services = Column(types.JSON, default=dict)
    has_essential_services = Column(types.Boolean, default=False) # Farmacia, Super, Salud < 15min
    
    # Gallery
    gallery_urls = Column(types.JSON, default=list) # ["url1", "url2"]
    
    status = Column(String, default="draft") # draft, active

