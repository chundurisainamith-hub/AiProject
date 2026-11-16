from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.all_models import Alert, User
from backend.app.schemas.all_schemas import AlertCreate, AlertUpdate, AlertResponse
from backend.app.api.deps import require_admin

router = APIRouter(prefix="/alerts", tags=["Disaster Early Warnings"])

LEVEL_ORDER = {"LOW": 0, "MODERATE": 1, "HIGH": 2, "CRITICAL": 3}

@router.get("", response_model=List[AlertResponse])
def get_alerts(
    min_level: Optional[str] = Query(None, description="Minimum alert severity level"),
    state: Optional[str] = Query(None, description="Filter by state"),
    active_only: bool = Query(True, description="Only show active alerts"),
    db: Session = Depends(get_db)
):
    state_val = state if isinstance(state, str) else None
    min_lvl_val = min_level if isinstance(min_level, str) else None
    active_val = active_only if isinstance(active_only, bool) else True

    query = db.query(Alert)
    if active_val:
        query = query.filter(Alert.is_active == True)
    if state_val and state_val.lower() != "all":
        query = query.filter(Alert.state.ilike(f"%{state_val}%"))

    alerts = query.order_by(Alert.timestamp.desc()).all()

    if min_lvl_val and min_lvl_val.upper() in LEVEL_ORDER:
        threshold = LEVEL_ORDER[min_lvl_val.upper()]
        alerts = [a for a in alerts if LEVEL_ORDER.get(a.level.upper(), 0) >= threshold]

    return alerts

@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert(
    req: AlertCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    alert = Alert(
        station_id=req.station_id,
        station_name=req.station_name,
        state=req.state,
        level=req.level.upper(),
        title=req.title,
        message=req.message,
        action=req.action,
        is_active=True
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

@router.put("/{alert_id}", response_model=AlertResponse)
def update_alert(
    alert_id: int,
    req: AlertUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if req.level is not None:
        alert.level = req.level.upper()
    if req.title is not None:
        alert.title = req.title
    if req.message is not None:
        alert.message = req.message
    if req.action is not None:
        alert.action = req.action
    if req.is_active is not None:
        alert.is_active = req.is_active

    db.commit()
    db.refresh(alert)
    return alert
