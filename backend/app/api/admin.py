from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.all_models import User, AdminRequest, Station, Alert
from backend.app.schemas.all_schemas import (
    AdminRequestResponse,
    UserResponse,
    AdminStatsResponse
)
from backend.app.api.deps import require_admin, require_owner

router = APIRouter(prefix="/admin", tags=["Admin Panel"])

@router.get("/requests", response_model=List[AdminRequestResponse])
def list_admin_requests(
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    requests = db.query(AdminRequest).order_by(AdminRequest.requested_at.desc()).all()
    return requests

@router.post("/requests/{req_id}/approve", response_model=AdminRequestResponse)
def approve_admin_request(
    req_id: int,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    req = db.query(AdminRequest).filter(AdminRequest.id == req_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin request not found"
        )
    
    req.status = "approved"
    req.reviewed_at = datetime.now(timezone.utc)
    req.reviewed_by = owner.username

    # Also insert or activate in users table
    existing_user = db.query(User).filter(User.username == req.username).first()
    if not existing_user:
        new_admin = User(
            username=req.username,
            hashed_password=req.hashed_password,
            role="admin",
            is_active=True
        )
        db.add(new_admin)
    else:
        existing_user.role = "admin"
        existing_user.is_active = True

    db.commit()
    db.refresh(req)
    return req

@router.post("/requests/{req_id}/reject", response_model=AdminRequestResponse)
def reject_admin_request(
    req_id: int,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    req = db.query(AdminRequest).filter(AdminRequest.id == req_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin request not found"
        )
    
    req.status = "rejected"
    req.reviewed_at = datetime.now(timezone.utc)
    req.reviewed_by = owner.username
    db.commit()
    db.refresh(req)
    return req

@router.get("/users", response_model=List[UserResponse])
def list_users(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    owner: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    if user.id == owner.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Owner administrator cannot delete their own account"
        )
    db.delete(user)
    db.commit()
    return {"message": f"User {user.username} deleted successfully"}

@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    users_cnt = db.query(User).filter(User.role == "user").count()
    admins_cnt = db.query(User).filter(User.role.in_(["admin", "owner"])).count()
    pending_cnt = db.query(AdminRequest).filter(AdminRequest.status == "pending").count()
    stations_cnt = db.query(Station).count()
    alerts_cnt = db.query(Alert).filter(Alert.is_active == True).count()

    return AdminStatsResponse(
        total_accounts=users_cnt + admins_cnt,
        user_accounts=users_cnt,
        admin_accounts=admins_cnt,
        pending_requests=pending_cnt,
        registered_stations=stations_cnt,
        active_alerts=alerts_cnt,
        system_status="All operational (FastAPI, SQLite, RF ML Engine, IoT Telemetry)"
    )
