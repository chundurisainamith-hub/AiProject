from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database.session import get_db
from backend.app.models.all_models import Station, SensorReading, Alert
from backend.app.schemas.all_schemas import StatsResponse
from backend.app.services.ml_service import calculate_rule_based_score

router = APIRouter(prefix="/stats", tags=["Aggregated Statistics"])

@router.get("", response_model=StatsResponse)
def get_system_stats(
    state: Optional[str] = Query(None, description="Filter by state"),
    db: Session = Depends(get_db)
):
    state_val = state if isinstance(state, str) else None
    station_query = db.query(Station)
    if state_val and state_val.lower() != "all":
        station_query = station_query.filter(Station.state.ilike(f"%{state_val}%"))
    stations = station_query.all()

    station_ids = [s.id for s in stations]

    latest_readings = []
    high_risk_zones = 0
    high_risk_names = []

    for s in stations:
        latest = (
            db.query(SensorReading)
            .filter(SensorReading.station_id == s.id)
            .order_by(SensorReading.timestamp.desc())
            .first()
        )
        if latest:
            latest_readings.append(latest)
            score, cat = calculate_rule_based_score(
                rainfall_24h=latest.rainfall_mm,
                soil_moisture=latest.soil_moisture_pct,
                slope=latest.slope_deg,
                vibration=latest.vibration_mms,
                tilt=latest.tilt_deg
            )
            if cat in ["HIGH", "CRITICAL"]:
                high_risk_zones += 1
                high_risk_names.append(f"{s.name} ({s.state})")

    n = len(latest_readings) or 1
    avg_rain = sum(r.rainfall_mm for r in latest_readings) / n
    avg_soil = sum(r.soil_moisture_pct for r in latest_readings) / n
    avg_vib = sum(r.vibration_mms for r in latest_readings) / n
    avg_tilt = sum(r.tilt_deg for r in latest_readings) / n
    avg_temp = sum(r.temperature_c for r in latest_readings) / n
    avg_hum = sum(r.humidity_pct for r in latest_readings) / n

    alert_query = db.query(Alert).filter(Alert.is_active == True)
    if state_val and state_val.lower() != "all":
        alert_query = alert_query.filter(Alert.state.ilike(f"%{state_val}%"))
    active_warnings = alert_query.count()

    return StatsResponse(
        monitored_locations=len(stations),
        high_risk_zones=high_risk_zones,
        active_warnings=active_warnings,
        rainfall_stations=len(stations),
        avg_rainfall_24h=round(avg_rain, 1),
        avg_soil_moisture=round(avg_soil, 1),
        avg_vibration=round(avg_vib, 2),
        avg_tilt=round(avg_tilt, 2),
        avg_temp=round(avg_temp, 1),
        avg_humidity=round(avg_hum, 1),
        high_risk_stations=high_risk_names
    )
