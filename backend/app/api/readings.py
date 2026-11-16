from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.all_models import Station, SensorReading, Alert
from backend.app.schemas.all_schemas import ReadingCreate, ReadingResponse
from backend.app.services.ml_service import calculate_rule_based_score, ACTIONS

router = APIRouter(prefix="/readings", tags=["IoT Sensor Telemetry"])

@router.post("", response_model=ReadingResponse, status_code=status.HTTP_201_CREATED)
def ingest_reading(req: ReadingCreate, db: Session = Depends(get_db)):
    station = None
    if req.station_id:
        station = db.query(Station).filter(Station.id == req.station_id).first()
    elif req.station_name:
        station = db.query(Station).filter(Station.name.ilike(req.station_name.strip())).first()

    if not station:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target monitoring station could not be identified"
        )

    reading = SensorReading(
        station_id=station.id,
        rainfall_mm=round(req.rainfall_mm, 2),
        soil_moisture_pct=round(min(100.0, max(0.0, req.soil_moisture_pct)), 1),
        slope_deg=round(req.slope_deg, 1),
        vibration_mms=round(req.vibration_mms, 2),
        tilt_deg=round(req.tilt_deg, 2),
        temperature_c=round(req.temperature_c, 1),
        humidity_pct=round(min(100.0, max(0.0, req.humidity_pct)), 1),
        timestamp=datetime.now(timezone.utc)
    )
    db.add(reading)

    # Automatic alert evaluation
    score, cat = calculate_rule_based_score(
        rainfall_24h=reading.rainfall_mm,
        soil_moisture=reading.soil_moisture_pct,
        slope=reading.slope_deg,
        vibration=reading.vibration_mms,
        tilt=reading.tilt_deg
    )

    if cat in ["HIGH", "CRITICAL"]:
        existing_alert = (
            db.query(Alert)
            .filter(Alert.station_id == station.id, Alert.is_active == True)
            .first()
        )
        if not existing_alert:
            new_alert = Alert(
                station_id=station.id,
                station_name=station.name,
                state=station.state,
                level=cat,
                title=f"{cat} Hazard Warning: Elevated geotechnical motion at {station.name}",
                message=f"Telemetry indicates rainfall {reading.rainfall_mm}mm, soil moisture {reading.soil_moisture_pct}%, and tilt {reading.tilt_deg}°.",
                action=ACTIONS[cat],
                is_active=True
            )
            db.add(new_alert)

    station.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(reading)
    return reading

@router.get("", response_model=List[ReadingResponse])
def get_latest_readings(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    readings = (
        db.query(SensorReading)
        .order_by(SensorReading.timestamp.desc())
        .limit(limit)
        .all()
    )
    return readings

@router.get("/{station_id}/history", response_model=List[ReadingResponse])
def get_station_reading_history(
    station_id: int,
    limit: int = Query(30, ge=1, le=200),
    db: Session = Depends(get_db)
):
    readings = (
        db.query(SensorReading)
        .filter(SensorReading.station_id == station_id)
        .order_by(SensorReading.timestamp.desc())
        .limit(limit)
        .all()
    )
    return readings
