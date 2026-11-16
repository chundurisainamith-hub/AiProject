import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.all_models import PredictionLog
from backend.app.schemas.all_schemas import PredictionRequest, PredictionResponse
from backend.app.services.ml_service import ml_service

router = APIRouter(prefix="/predict", tags=["AI Prediction"])

@router.post("", response_model=PredictionResponse)
def predict_landslide_risk(req: PredictionRequest, db: Session = Depends(get_db)):
    result = ml_service.predict(
        rainfall_intensity=req.rainfall_intensity,
        soil_moisture=req.soil_moisture,
        slope_angle=req.slope_angle,
        soil_type=req.soil_type,
        vibration=req.vibration,
        temperature=req.temperature,
        rainfall_7d=req.rainfall_7d
    )

    # Persist prediction query log
    try:
        log_entry = PredictionLog(
            rainfall_intensity=req.rainfall_intensity,
            soil_moisture=req.soil_moisture,
            slope_angle=req.slope_angle,
            soil_type=req.soil_type,
            vibration=req.vibration,
            temperature=req.temperature,
            rainfall_7d=req.rainfall_7d,
            ml_probability=result["predicted_probability"],
            rule_score=result["risk_score"],
            risk_level=result["risk_category"],
            top_factors=json.dumps([f["name"] for f in result["top_factors"]]),
            recommended_action=result["recommended_safety_measures"]
        )
        db.add(log_entry)
        db.commit()
    except Exception:
        db.rollback()

    return PredictionResponse(**result)
