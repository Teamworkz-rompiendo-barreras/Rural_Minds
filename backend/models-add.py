
# --- Municipality Extension Models (Phase 8/14) ---
class MunicipalityDetails(Base):
    """Extended profile for Municipality Organizations."""
    __tablename__ = "municipality_details"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    location_id = Column(GUID, ForeignKey("organizations.id")) # Linking to Org for now
    slogan = Column(String, nullable=True)
    description = Column(String, nullable=True)
    population = Column(Integer, nullable=True)
    hero_image_url = Column(String, nullable=True)
    # Add other wizard fields here as needed
    
class MunicipalityResource(Base):
    """Resources/Services for a Municipality."""
    __tablename__ = "municipality_resources"
    
    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    location_id = Column(GUID, ForeignKey("organizations.id"))
    adl_contact_email = Column(String, nullable=True)
    housing_guide_url = Column(String, nullable=True)
    coworking_spaces_count = Column(Integer, default=0)
    fiber_speed_mbps = Column(Integer, default=0)
