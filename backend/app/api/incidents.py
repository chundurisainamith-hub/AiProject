from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.all_models import HistoricalIncident, EmergencyFacility
from backend.app.schemas.all_schemas import IncidentResponse, FacilityResponse

router = APIRouter(tags=["Historical Incidents & Risk Management"])

@router.get("/incidents", response_model=List[IncidentResponse])
def get_historical_incidents(
    state: Optional[str] = Query(None, description="Filter by state"),
    search: Optional[str] = Query(None, description="Search district, location, damage"),
    db: Session = Depends(get_db)
):
    state_val = state if isinstance(state, str) else None
    search_val = search if isinstance(search, str) else None

    query = db.query(HistoricalIncident)
    if state_val and state_val.lower() != "all":
        query = query.filter(HistoricalIncident.state.ilike(f"%{state_val}%"))
    if search_val:
        search_fmt = f"%{search_val}%"
        query = query.filter(
            HistoricalIncident.district.ilike(search_fmt) |
            HistoricalIncident.location.ilike(search_fmt) |
            HistoricalIncident.damage_desc.ilike(search_fmt)
        )
    return query.order_by(HistoricalIncident.incident_date.desc()).all()

@router.get("/facilities", response_model=List[FacilityResponse])
def get_emergency_facilities(
    state: Optional[str] = Query(None, description="Filter by state"),
    db: Session = Depends(get_db)
):
    query = db.query(EmergencyFacility)
    if state and state.lower() != "all":
        query = query.filter(EmergencyFacility.state.ilike(f"%{state}%"))
    return query.all()
