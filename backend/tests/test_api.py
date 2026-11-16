import pytest
from fastapi import HTTPException
from backend.app.database.session import SessionLocal, Base, engine
from backend.app.database.seed import seed_database
from backend.app.models.all_models import User, AdminRequest, Station, SensorReading
from backend.app.schemas.all_schemas import (
    LoginRequest,
    PredictionRequest,
    ReadingCreate,
    StationCreate,
    StationUpdate
)
from backend.app.api.auth import login
from backend.app.api.predictions import predict_landslide_risk
from backend.app.api.stations import get_stations, create_station, update_station, delete_station
from backend.app.api.readings import ingest_reading
from backend.app.api.alerts import get_alerts
from backend.app.api.incidents import get_historical_incidents
from backend.app.api.stats import get_system_stats
from backend.app.api.admin import get_admin_stats, list_admin_requests, approve_admin_request, reject_admin_request
from backend.app.api.deps import require_admin

@pytest.fixture(scope="module", autouse=True)
def init_db():
    db = SessionLocal()
    seed_database(db)
    db.close()
    yield

def test_user_login_invalid_domain():
    db = SessionLocal()
    try:
        with pytest.raises(HTTPException) as exc_info:
            login(LoginRequest(username="baduser@gmail.com", password="password123", login_type="user"), db=db)
        assert exc_info.value.status_code == 400
        assert "Login failed: username must end with @NER.com" in exc_info.value.detail
    finally:
        db.close()

def test_user_login_short_password():
    db = SessionLocal()
    try:
        with pytest.raises(HTTPException) as exc_info:
            login(LoginRequest(username="analyst@ner.com", password="123", login_type="user"), db=db)
        assert exc_info.value.status_code == 400
        assert "Password must be at least 6 characters" in exc_info.value.detail
    finally:
        db.close()

def test_user_login_first_time_creates_account():
    db = SessionLocal()
    try:
        # Clean up if exists
        test_user = "pilot_inspector_99@ner.com"
        existing = db.query(User).filter(User.username == test_user).first()
        if existing:
            db.delete(existing)
            db.commit()

        res = login(LoginRequest(username=test_user, password="validPassword123", login_type="user"), db=db)
        assert res.access_token is not None
        assert res.role == "user"
        assert res.username == test_user
    finally:
        db.close()

def test_user_login_subsequent_wrong_password():
    db = SessionLocal()
    try:
        with pytest.raises(HTTPException) as exc_info:
            login(LoginRequest(username="analyst@ner.com", password="wrongPassword!", login_type="user"), db=db)
        assert exc_info.value.status_code == 400
        assert "Login failed: incorrect password" in exc_info.value.detail
    finally:
        db.close()

def test_user_login_subsequent_correct_password():
    db = SessionLocal()
    try:
        res = login(LoginRequest(username="analyst@ner.com", password="nerpass123", login_type="user"), db=db)
        assert res.access_token is not None
        assert res.role == "user"
    finally:
        db.close()

def test_admin_login_invalid_domain():
    db = SessionLocal()
    try:
        with pytest.raises(HTTPException) as exc_info:
            login(LoginRequest(username="officer@ner.com", password="password123", login_type="admin"), db=db)
        assert exc_info.value.status_code == 400
        assert "Login failed: admin username must end with @adm.com" in exc_info.value.detail
    finally:
        db.close()

def test_admin_owner_login():
    db = SessionLocal()
    try:
        res = login(LoginRequest(username="owner@adm.com", password="admin123", login_type="admin"), db=db)
        assert res.access_token is not None
        assert res.role == "owner"
    finally:
        db.close()

def test_admin_secondary_creates_pending_request():
    db = SessionLocal()
    try:
        sub_admin = "new_sub_admin_33@adm.com"
        # Clean up if exists
        db.query(AdminRequest).filter(AdminRequest.username == sub_admin).delete()
        db.commit()

        with pytest.raises(HTTPException) as exc_info:
            login(LoginRequest(username=sub_admin, password="adminPassword123", login_type="admin"), db=db)
        assert exc_info.value.status_code in [202, 403]
        assert "Request sent to the admin" in exc_info.value.detail
    finally:
        db.close()

def test_predict_endpoint():
    db = SessionLocal()
    try:
        req = PredictionRequest(
            rainfall_intensity=35.0,
            soil_moisture=70.0,
            slope_angle=30.0,
            soil_type="Clay",
            vibration=1.5,
            temperature=22.0,
            rainfall_7d=280.0
        )
        res = predict_landslide_risk(req, db=db)
        assert res.predicted_probability >= 0.0
        assert res.risk_category in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
        assert res.risk_score >= 0.0
        assert len(res.top_factors) > 0
        assert res.recommended_safety_measures is not None
    finally:
        db.close()

def test_get_stations():
    db = SessionLocal()
    try:
        stations = get_stations(db=db)
        assert len(stations) >= 16
        names = [s.name for s in stations]
        assert "Shillong" in names
        assert "Guwahati" in names
        assert "Cherrapunji" in names
        assert "Gangtok" in names
        # Check telemetry fields
        first = stations[0]
        assert first.risk_level in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
        assert first.latest_reading is not None
    finally:
        db.close()

def test_iot_telemetry_ingestion():
    db = SessionLocal()
    try:
        req = ReadingCreate(
            station_name="Shillong",
            rainfall_mm=125.0,
            soil_moisture_pct=85.0,
            slope_deg=28.0,
            vibration_mms=2.1,
            tilt_deg=1.5,
            temperature_c=19.5,
            humidity_pct=94.0
        )
        res = ingest_reading(req, db=db)
        assert res.rainfall_mm == 125.0
        assert res.soil_moisture_pct == 85.0
    finally:
        db.close()

def test_get_alerts():
    db = SessionLocal()
    try:
        alerts = get_alerts(db=db)
        assert len(alerts) > 0
    finally:
        db.close()

def test_get_incidents():
    db = SessionLocal()
    try:
        incidents = get_historical_incidents(db=db)
        assert len(incidents) >= 10
    finally:
        db.close()

def test_get_stats():
    db = SessionLocal()
    try:
        stats = get_system_stats(db=db)
        assert stats.monitored_locations >= 16
        assert stats.rainfall_stations >= 16
    finally:
        db.close()

def test_get_admin_stats():
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.role == "owner").first()
        admin_stats = get_admin_stats(admin=admin_user, db=db)
        assert admin_stats.total_accounts >= 2
        assert admin_stats.registered_stations >= 16
    finally:
        db.close()

def test_admin_approval_and_login_flow():
    db = SessionLocal()
    try:
        owner = db.query(User).filter(User.role == "owner").first()
        test_admin = "deputy_test_admin@adm.com"
        db.query(User).filter(User.username == test_admin).delete()
        db.query(AdminRequest).filter(AdminRequest.username == test_admin).delete()
        db.commit()

        # Step 1: Submit admin login -> creates pending request
        with pytest.raises(HTTPException) as exc_info:
            login(LoginRequest(username=test_admin, password="adminPassword999", login_type="admin"), db=db)
        assert exc_info.value.status_code == 202

        # Step 2: Owner approves request
        req = db.query(AdminRequest).filter(AdminRequest.username == test_admin).first()
        assert req is not None
        approved = approve_admin_request(req.id, owner=owner, db=db)
        assert approved.status == "approved"

        # Step 3: Newly approved admin successfully logs in
        login_res = login(LoginRequest(username=test_admin, password="adminPassword999", login_type="admin"), db=db)
        assert login_res.access_token is not None
        assert login_res.role == "admin"
        assert login_res.username == test_admin
    finally:
        db.close()

def test_admin_rejection_flow():
    db = SessionLocal()
    try:
        owner = db.query(User).filter(User.role == "owner").first()
        reject_admin = "rejected_test_candidate@adm.com"
        db.query(User).filter(User.username == reject_admin).delete()
        db.query(AdminRequest).filter(AdminRequest.username == reject_admin).delete()
        db.commit()

        with pytest.raises(HTTPException):
            login(LoginRequest(username=reject_admin, password="password123", login_type="admin"), db=db)

        req = db.query(AdminRequest).filter(AdminRequest.username == reject_admin).first()
        assert req is not None
        rejected = reject_admin_request(req.id, owner=owner, db=db)
        assert rejected.status == "rejected"

        # Rejection message on subsequent login attempt
        with pytest.raises(HTTPException) as exc_info:
            login(LoginRequest(username=reject_admin, password="password123", login_type="admin"), db=db)
        assert exc_info.value.status_code == 403
        assert "Your admin request was rejected." in exc_info.value.detail
    finally:
        db.close()

def test_station_crud_lifecycle():
    db = SessionLocal()
    try:
        owner = db.query(User).filter(User.role == "owner").first()
        # Create station
        stn_req = StationCreate(
            name="Zunheboto Ridge",
            state="Nagaland",
            latitude=25.97,
            longitude=94.52,
            status="online"
        )
        created = create_station(stn_req, admin=owner, db=db)
        assert created.id is not None
        assert created.name == "Zunheboto Ridge"
        assert created.state == "Nagaland"
        assert created.latest_reading is not None

        # Update station
        upd_req = StationUpdate(status="degraded")
        updated = update_station(created.id, upd_req, admin=owner, db=db)
        assert updated.status == "degraded"

        # Delete station
        del_res = delete_station(created.id, admin=owner, db=db)
        assert "removed successfully" in del_res["message"]

        # Confirm deleted
        found = db.query(Station).filter(Station.id == created.id).first()
        assert found is None
    finally:
        db.close()

def test_non_admin_forbidden_station_crud():
    db = SessionLocal()
    try:
        normal_user = db.query(User).filter(User.role == "user").first()
        with pytest.raises(HTTPException) as exc_info:
            require_admin(normal_user)
        assert exc_info.value.status_code == 403
        assert "Administrator access required" in exc_info.value.detail
    finally:
        db.close()
