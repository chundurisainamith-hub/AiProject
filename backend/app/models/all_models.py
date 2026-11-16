from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user", nullable=False)  # "user", "admin", "owner"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

class AdminRequest(Base):
    __tablename__ = "admin_requests"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    status = Column(String(20), default="pending", nullable=False)  # "pending", "approved", "rejected"
    requested_at = Column(DateTime(timezone=True), default=utcnow)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(String(120), nullable=True)

class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    state = Column(String(50), index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(String(20), default="online", nullable=False)  # "online", "degraded", "offline"
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    readings = relationship("SensorReading", back_populates="station", cascade="all, delete-orphan")

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), index=True, nullable=False)
    rainfall_mm = Column(Float, nullable=False)
    soil_moisture_pct = Column(Float, nullable=False)
    slope_deg = Column(Float, nullable=False)
    vibration_mms = Column(Float, nullable=False)
    tilt_deg = Column(Float, nullable=False)
    temperature_c = Column(Float, nullable=False)
    humidity_pct = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utcnow, index=True)

    station = relationship("Station", back_populates="readings")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=True)
    station_name = Column(String(100), nullable=False)
    state = Column(String(50), nullable=False)
    level = Column(String(20), nullable=False)  # "LOW", "MODERATE", "HIGH", "CRITICAL"
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    action = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utcnow, index=True)

class HistoricalIncident(Base):
    __tablename__ = "historical_incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_date = Column(String(20), nullable=False)
    state = Column(String(50), index=True, nullable=False)
    district = Column(String(100), nullable=False)
    location = Column(String(150), nullable=False)
    rainfall_before_mm = Column(Float, nullable=False)
    damage_desc = Column(Text, nullable=False)

class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    rainfall_intensity = Column(Float, nullable=False)
    soil_moisture = Column(Float, nullable=False)
    slope_angle = Column(Float, nullable=False)
    soil_type = Column(String(50), nullable=False)
    vibration = Column(Float, nullable=False)
    temperature = Column(Float, nullable=False)
    rainfall_7d = Column(Float, nullable=False)
    ml_probability = Column(Float, nullable=False)
    rule_score = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)
    top_factors = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utcnow)

class EmergencyFacility(Base):
    __tablename__ = "emergency_facilities"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=True)
    state = Column(String(50), index=True, nullable=False)
    name = Column(String(150), nullable=False)
    type = Column(String(50), nullable=False)  # "shelter", "hospital", "evacuation_route"
    contact = Column(String(100), nullable=False)
    distance_km = Column(Float, nullable=False)
