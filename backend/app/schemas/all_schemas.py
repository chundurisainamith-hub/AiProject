from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# Auth Schemas
class LoginRequest(BaseModel):
    username: str
    password: str
    login_type: Optional[str] = "user"

class ResetPasswordRequest(BaseModel):
    username: str
    new_password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    message: Optional[str] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    role: str
    is_active: bool
    created_at: datetime

class AdminRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    status: str
    requested_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None

# Station Schemas
class StationBase(BaseModel):
    name: str
    state: str
    latitude: float
    longitude: float
    status: Optional[str] = "online"

class StationCreate(StationBase):
    pass

class StationUpdate(BaseModel):
    name: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = None

class ReadingBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    rainfall_mm: float
    soil_moisture_pct: float
    slope_deg: float
    vibration_mms: float
    tilt_deg: float
    temperature_c: float
    humidity_pct: float
    timestamp: datetime

class StationResponse(StationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime
    latest_reading: Optional[ReadingBrief] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = "LOW"
    ai_probability: Optional[float] = 0.0

# Sensor Reading Schemas
class ReadingCreate(BaseModel):
    station_id: Optional[int] = None
    station_name: Optional[str] = None
    rainfall_mm: float
    soil_moisture_pct: float
    slope_deg: float
    vibration_mms: float
    tilt_deg: float
    temperature_c: float
    humidity_pct: float

class ReadingResponse(ReadingBrief):
    model_config = ConfigDict(from_attributes=True)
    id: int
    station_id: int

# Prediction Schemas
class PredictionRequest(BaseModel):
    rainfall_intensity: float = Field(..., ge=0, le=500, description="Rainfall intensity in mm/h")
    soil_moisture: float = Field(..., ge=0, le=100, description="Soil moisture in %")
    slope_angle: float = Field(..., ge=0, le=90, description="Slope angle in degrees")
    soil_type: str = Field("Clay", description="Soil type (Clay, Silty loam, Sandy, Laterite, Rocky)")
    vibration: float = Field(..., ge=0, le=50, description="Ground vibration in mm/s")
    temperature: float = Field(..., ge=-20, le=60, description="Ambient temperature in °C")
    rainfall_7d: float = Field(..., ge=0, le=2000, description="7-day cumulative rainfall in mm")

class ContributingFactor(BaseModel):
    name: str
    impact_score: float
    percentage: float

class PredictionResponse(BaseModel):
    predicted_probability: float
    risk_score: float
    risk_category: str
    top_factors: List[ContributingFactor]
    recommended_safety_measures: str
    model_type: str
    disclaimer: str

# Alert Schemas
class AlertCreate(BaseModel):
    station_id: Optional[int] = None
    station_name: str
    state: str
    level: str
    title: str
    message: str
    action: str

class AlertUpdate(BaseModel):
    level: Optional[str] = None
    title: Optional[str] = None
    message: Optional[str] = None
    action: Optional[str] = None
    is_active: Optional[bool] = None

class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    station_id: Optional[int] = None
    station_name: str
    state: str
    level: str
    title: str
    message: str
    action: str
    is_active: bool
    timestamp: datetime

# Incident Schemas
class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    incident_date: str
    state: str
    district: str
    location: str
    rainfall_before_mm: float
    damage_desc: str

# Emergency Facility
class FacilityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    station_id: Optional[int] = None
    state: str
    name: str
    type: str
    contact: str
    distance_km: float

# Stats Schemas
class StatsResponse(BaseModel):
    monitored_locations: int
    high_risk_zones: int
    active_warnings: int
    rainfall_stations: int
    avg_rainfall_24h: float
    avg_soil_moisture: float
    avg_vibration: float
    avg_tilt: float
    avg_temp: float
    avg_humidity: float
    high_risk_stations: List[str]

class AdminStatsResponse(BaseModel):
    total_accounts: int
    user_accounts: int
    admin_accounts: int
    pending_requests: int
    registered_stations: int
    active_alerts: int
    system_status: str
