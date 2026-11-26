import os
import sys

# Ensure project root is in sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from backend.app.database.session import Base, engine, SessionLocal
from backend.app.models.all_models import (
    User,
    AdminRequest,
    Station,
    SensorReading,
    Alert,
    HistoricalIncident,
    EmergencyFacility
)
from backend.app.core.security import get_password_hash
from backend.app.services.ml_service import calculate_rule_based_score, ACTIONS

# Reference stations from the original project specification
RAW_STATIONS = [
    ("Guwahati", "Assam", 26.14, 91.74, 48.0, 62.0, 18.0, 1.1, 0.4, 29.0, 78.0),
    ("Dibrugarh", "Assam", 27.48, 94.91, 35.0, 58.0, 8.0, 0.5, 0.2, 27.0, 80.0),
    ("Silchar", "Assam", 24.83, 92.78, 88.0, 70.0, 22.0, 1.4, 0.8, 28.0, 84.0),
    ("Shillong", "Meghalaya", 25.57, 91.88, 95.0, 74.0, 28.0, 1.8, 1.2, 21.0, 90.0),
    ("Cherrapunji", "Meghalaya", 25.30, 91.70, 140.0, 88.0, 38.0, 3.2, 2.1, 19.0, 95.0),
    ("Tura", "Meghalaya", 25.51, 90.22, 60.0, 66.0, 26.0, 1.0, 0.7, 25.0, 85.0),
    ("Imphal", "Manipur", 24.82, 93.94, 42.0, 55.0, 12.0, 0.6, 0.3, 26.0, 72.0),
    ("Churachandpur", "Manipur", 24.33, 93.68, 115.0, 80.0, 35.0, 2.4, 1.6, 24.0, 88.0),
    ("Aizawl", "Mizoram", 23.73, 92.72, 100.0, 76.0, 32.0, 2.0, 1.4, 23.0, 89.0),
    ("Lunglei", "Mizoram", 22.89, 92.73, 72.0, 68.0, 29.0, 1.2, 0.9, 25.0, 86.0),
    ("Kohima", "Nagaland", 25.67, 94.11, 78.0, 72.0, 30.0, 1.7, 1.1, 20.0, 87.0),
    ("Mokokchung", "Nagaland", 26.32, 94.52, 40.0, 50.0, 15.0, 0.6, 0.3, 22.0, 76.0),
    ("Agartala", "Tripura", 23.83, 91.28, 30.0, 52.0, 6.0, 0.3, 0.1, 30.0, 74.0),
    ("Gangtok", "Sikkim", 27.33, 88.61, 85.0, 71.0, 34.0, 2.1, 1.5, 16.0, 91.0),
    ("Itanagar", "Arunachal Pradesh", 27.08, 93.61, 55.0, 60.0, 24.0, 1.0, 0.6, 24.0, 82.0),
    ("Tawang", "Arunachal Pradesh", 27.59, 91.86, 65.0, 64.0, 40.0, 1.5, 1.0, 9.0, 79.0)
]

RAW_INCIDENTS = [
    ("2020-06-14", "Assam", "Dima Hasao", "Hill road section", 210.0, "Road blocked, houses damaged"),
    ("2021-07-02", "Meghalaya", "East Khasi Hills", "Hill slope near town", 260.0, "Houses damaged"),
    ("2021-09-11", "Mizoram", "Aizawl", "Residential hillside", 190.0, "Buildings damaged, casualties"),
    ("2022-06-17", "Assam", "Dima Hasao", "Rail and road corridor", 300.0, "Rail and road disrupted"),
    ("2022-08-05", "Manipur", "Noney", "Highway slope", 240.0, "Major casualties, highway blocked"),
    ("2023-06-20", "Sikkim", "Mangan", "Highway slope", 170.0, "Road cut, tourist stranding"),
    ("2024-05-28", "Mizoram", "Aizawl", "Quarry area", 230.0, "Casualties, houses destroyed"),
    ("2024-07-09", "Arunachal Pradesh", "Lower Subansiri", "National highway", 150.0, "Road blocked"),
    ("2025-06-02", "Nagaland", "Kohima", "Urban slope", 120.0, "Houses damaged"),
    ("2025-08-14", "Meghalaya", "West Garo Hills", "Village slope", 140.0, "Crop and road damage")
]

RAW_FACILITIES = [
    ("Meghalaya", "Civil Hospital Shillong", "hospital", "0364-2226348", 2.4),
    ("Meghalaya", "Cherrapunji Emergency Shelter Hall", "shelter", "03637-235222", 1.2),
    ("Mizoram", "Aizawl Civil Hospital & Trauma Centre", "hospital", "0389-2322318", 3.0),
    ("Mizoram", "State Relief Shelter Aizawl North", "shelter", "0389-2322238", 1.5),
    ("Sikkim", "STNM Multi-Speciality Hospital Gangtok", "hospital", "03592-202728", 3.5),
    ("Sikkim", "Gangtok Disaster Evacuation Ground", "shelter", "03592-201088", 1.8),
    ("Nagaland", "Naga Hospital Authority Kohima", "hospital", "0370-2290028", 2.2),
    ("Manipur", "Regional Institute of Medical Sciences Imphal", "hospital", "0385-2414629", 4.1),
    ("Assam", "Gauhati Medical College & Hospital", "hospital", "0361-2529457", 5.0),
    ("Arunachal Pradesh", "Tomo Riba State Hospital Naharlagun", "hospital", "0360-2244256", 6.2)
]

def seed_database(db: Session):
    Base.metadata.create_all(bind=engine)

    # 1. Seed default accounts if none exist
    if db.query(User).count() == 0:
        # Default owner admin
        owner = User(
            username="namith@adm.com",
            hashed_password=get_password_hash("sai2008"),
            role="owner",
            is_active=True
        )
        db.add(owner)

        # Default sample regular user
        user = User(
            username="analyst@ner.com",
            hashed_password=get_password_hash("nerpass123"),
            role="user",
            is_active=True
        )
        db.add(user)
        db.commit()

    # 2. Seed Stations and initial readings
    if db.query(Station).count() == 0:
        now = datetime.now(timezone.utc)
        for i, item in enumerate(RAW_STATIONS):
            name, state, lat, lon, rain, soil, slope, vib, tilt, temp, hum = item
            station = Station(
                name=name,
                state=state,
                latitude=lat,
                longitude=lon,
                status="degraded" if i % 7 == 5 else "online",
                created_at=now - timedelta(days=30),
                updated_at=now
            )
            db.add(station)
            db.commit()
            db.refresh(station)

            # Add historical sensor readings (7 days of data for charts)
            for d in range(7, 0, -1):
                past_time = now - timedelta(days=d)
                m_factor = [0.4, 0.7, 0.5, 1.1, 0.9, 1.3, 1.0][7 - d]
                past_reading = SensorReading(
                    station_id=station.id,
                    rainfall_mm=round(rain * m_factor, 1),
                    soil_moisture_pct=round(min(100.0, soil * (0.8 + 0.2 * m_factor)), 1),
                    slope_deg=slope,
                    vibration_mms=round(vib * m_factor, 2),
                    tilt_deg=round(tilt * m_factor, 2),
                    temperature_c=temp,
                    humidity_pct=hum,
                    timestamp=past_time
                )
                db.add(past_reading)

            # Latest reading
            latest_reading = SensorReading(
                station_id=station.id,
                rainfall_mm=rain,
                soil_moisture_pct=soil,
                slope_deg=slope,
                vibration_mms=vib,
                tilt_deg=tilt,
                temperature_c=temp,
                humidity_pct=hum,
                timestamp=now
            )
            db.add(latest_reading)

            # If High or Critical, generate alert
            score, cat = calculate_rule_based_score(rain, soil, slope, vib, tilt)
            if cat in ["MODERATE", "HIGH", "CRITICAL"]:
                alert = Alert(
                    station_id=station.id,
                    station_name=station.name,
                    state=station.state,
                    level=cat,
                    title=f"Geotechnical Alert: Elevated landslide hazard at {station.name}",
                    message=f"Slope displacement rate at {station.name} reached {tilt}° with rainfall {rain} mm/24h and soil moisture {soil}%.",
                    action=ACTIONS[cat],
                    is_active=True,
                    timestamp=now - timedelta(minutes=(i + 1) * 14)
                )
                db.add(alert)

        db.commit()

    # 3. Seed historical incidents
    if db.query(HistoricalIncident).count() == 0:
        for dt, st, dis, loc, rain, dmg in RAW_INCIDENTS:
            inc = HistoricalIncident(
                incident_date=dt,
                state=st,
                district=dis,
                location=loc,
                rainfall_before_mm=rain,
                damage_desc=dmg
            )
            db.add(inc)
        db.commit()

    # 4. Seed emergency facilities
    if db.query(EmergencyFacility).count() == 0:
        for st, name, ftype, contact, dist in RAW_FACILITIES:
            fac = EmergencyFacility(
                state=st,
                name=name,
                type=ftype,
                contact=contact,
                distance_km=dist
            )
            db.add(fac)
        db.commit()

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
        print("Database initialized and seeded successfully.")
    finally:
        db.close()
