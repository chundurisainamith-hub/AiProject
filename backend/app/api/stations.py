from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.all_models import Station, SensorReading, User
from backend.app.schemas.all_schemas import (
    StationCreate,
    StationUpdate,
    StationResponse,
    ReadingBrief
)
from backend.app.services.ml_service import calculate_rule_based_score, ml_service
from backend.app.api.deps import require_admin

router = APIRouter(prefix="/stations", tags=["Monitoring Stations"])

def attach_station_telemetry(station: Station, db: Session) -> StationResponse:
    latest = (
        db.query(SensorReading)
        .filter(SensorReading.station_id == station.id)
        .order_by(SensorReading.timestamp.desc())
        .first()
    )

    brief = None
    risk_score = 0.15
    risk_level = "LOW"
    ai_prob = 15.0

    if latest:
        brief = ReadingBrief.model_validate(latest)
        score, cat = calculate_rule_based_score(
            rainfall_24h=latest.rainfall_mm,
            soil_moisture=latest.soil_moisture_pct,
            slope=latest.slope_deg,
            vibration=latest.vibration_mms,
            tilt=latest.tilt_deg
        )
        risk_score = score
        risk_level = cat
        # AI prob estimation from ML model
        pred = ml_service.predict(
            rainfall_intensity=latest.rainfall_mm / 6.0,
            soil_moisture=latest.soil_moisture_pct,
            slope_angle=latest.slope_deg,
            soil_type="Clay",
            vibration=latest.vibration_mms,
            temperature=latest.temperature_c,
            rainfall_7d=latest.rainfall_mm * 3.5
        )
        ai_prob = pred["predicted_probability"]

    return StationResponse(
        id=station.id,
        name=station.name,
        state=station.state,
        latitude=station.latitude,
        longitude=station.longitude,
        status=station.status,
        created_at=station.created_at,
        updated_at=station.updated_at,
        latest_reading=brief,
        risk_score=risk_score,
        risk_level=risk_level,
        ai_probability=ai_prob
    )

@router.get("", response_model=List[StationResponse])
def get_stations(
    state: Optional[str] = Query(None, description="Filter by state"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level"),
    search: Optional[str] = Query(None, description="Search by name"),
    db: Session = Depends(get_db)
):
    state_val = state if isinstance(state, str) else None
    search_val = search if isinstance(search, str) else None
    risk_val = risk_level if isinstance(risk_level, str) else None

    query = db.query(Station)
    if state_val and state_val.lower() != "all":
        query = query.filter(Station.state.ilike(f"%{state_val}%"))
    if search_val:
        query = query.filter(Station.name.ilike(f"%{search_val}%"))

    stations = query.all()
    results = [attach_station_telemetry(s, db) for s in stations]

    if risk_val and risk_val.lower() != "all":
        results = [r for r in results if r.risk_level.upper() == risk_val.upper()]

    return results

@router.get("/{station_id}", response_model=StationResponse)
def get_station(station_id: int, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    return attach_station_telemetry(station, db)

@router.post("", response_model=StationResponse, status_code=status.HTTP_201_CREATED)
def create_station(
    req: StationCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(Station).filter(Station.name.ilike(req.name.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Station with name '{req.name}' already exists"
        )
    station = Station(
        name=req.name.strip(),
        state=req.state.strip(),
        latitude=req.latitude,
        longitude=req.longitude,
        status=req.status or "online"
    )
    db.add(station)
    db.commit()
    db.refresh(station)

    # Add baseline reading
    reading = SensorReading(
        station_id=station.id,
        rainfall_mm=35.0,
        soil_moisture_pct=55.0,
        slope_deg=20.0,
        vibration_mms=0.8,
        tilt_deg=0.5,
        temperature_c=24.0,
        humidity_pct=78.0
    )
    db.add(reading)
    db.commit()

    return attach_station_telemetry(station, db)

@router.put("/{station_id}", response_model=StationResponse)
def update_station(
    station_id: int,
    req: StationUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")

    if req.name is not None:
        station.name = req.name.strip()
    if req.state is not None:
        station.state = req.state.strip()
    if req.latitude is not None:
        station.latitude = req.latitude
    if req.longitude is not None:
        station.longitude = req.longitude
    if req.status is not None:
        station.status = req.status

    db.commit()
    db.refresh(station)
    return attach_station_telemetry(station, db)

@router.delete("/{station_id}")
def delete_station(
    station_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    station = db.query(Station).filter(Station.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    db.delete(station)
    db.commit()
    return {"message": f"Station '{station.name}' removed successfully"}
