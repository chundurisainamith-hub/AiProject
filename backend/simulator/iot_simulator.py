import os
import sys
import time
import random
import json
import urllib.request
import urllib.error
from datetime import datetime

# Reference stations
STATIONS = [
    {"name": "Guwahati", "rain": 48.0, "soil": 62.0, "slope": 18.0, "vib": 1.1, "tilt": 0.4, "temp": 29.0, "hum": 78.0},
    {"name": "Dibrugarh", "rain": 35.0, "soil": 58.0, "slope": 8.0, "vib": 0.5, "tilt": 0.2, "temp": 27.0, "hum": 80.0},
    {"name": "Silchar", "rain": 88.0, "soil": 70.0, "slope": 22.0, "vib": 1.4, "tilt": 0.8, "temp": 28.0, "hum": 84.0},
    {"name": "Shillong", "rain": 95.0, "soil": 74.0, "slope": 28.0, "vib": 1.8, "tilt": 1.2, "temp": 21.0, "hum": 90.0},
    {"name": "Cherrapunji", "rain": 140.0, "soil": 88.0, "slope": 38.0, "vib": 3.2, "tilt": 2.1, "temp": 19.0, "hum": 95.0},
    {"name": "Tura", "rain": 60.0, "soil": 66.0, "slope": 26.0, "vib": 1.0, "tilt": 0.7, "temp": 25.0, "hum": 85.0},
    {"name": "Imphal", "rain": 42.0, "soil": 55.0, "slope": 12.0, "vib": 0.6, "tilt": 0.3, "temp": 26.0, "hum": 72.0},
    {"name": "Churachandpur", "rain": 115.0, "soil": 80.0, "slope": 35.0, "vib": 2.4, "tilt": 1.6, "temp": 24.0, "hum": 88.0},
    {"name": "Aizawl", "rain": 100.0, "soil": 76.0, "slope": 32.0, "vib": 2.0, "tilt": 1.4, "temp": 23.0, "hum": 89.0},
    {"name": "Lunglei", "rain": 72.0, "soil": 68.0, "slope": 29.0, "vib": 1.2, "tilt": 0.9, "temp": 25.0, "hum": 86.0},
    {"name": "Kohima", "rain": 78.0, "soil": 72.0, "slope": 30.0, "vib": 1.7, "tilt": 1.1, "temp": 20.0, "hum": 87.0},
    {"name": "Mokokchung", "rain": 40.0, "soil": 50.0, "slope": 15.0, "vib": 0.6, "tilt": 0.3, "temp": 22.0, "hum": 76.0},
    {"name": "Agartala", "rain": 30.0, "soil": 52.0, "slope": 6.0, "vib": 0.3, "tilt": 0.1, "temp": 30.0, "hum": 74.0},
    {"name": "Gangtok", "rain": 85.0, "soil": 71.0, "slope": 34.0, "vib": 2.1, "tilt": 1.5, "temp": 16.0, "hum": 91.0},
    {"name": "Itanagar", "rain": 55.0, "soil": 60.0, "slope": 24.0, "vib": 1.0, "tilt": 0.6, "temp": 24.0, "hum": 82.0},
    {"name": "Tawang", "rain": 65.0, "soil": 64.0, "slope": 40.0, "vib": 1.5, "tilt": 1.0, "temp": 9.0, "hum": 79.0}
]

API_URL = os.getenv("INGESTION_API_URL", "http://127.0.0.1:8000/api/readings")

def run_simulator(interval_sec: float = 4.0, iterations: int = 0):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Starting NER Landslide Guard IoT Telemetry Simulator...")
    print(f"Target ingestion endpoint: {API_URL}")
    print(f"Monitoring nodes: {len(STATIONS)} stations across 8 North Eastern states.")

    cycle = 0
    while True:
        cycle += 1
        print(f"\n--- Cycle {cycle} ---")
        for s in STATIONS:
            # Simulate realistic sensor noise & drift
            s["rain"] = max(0.0, round(s["rain"] + (random.random() - 0.48) * 3.5, 1))
            s["soil"] = min(100.0, max(15.0, round(s["soil"] + (random.random() - 0.49) * 1.8, 1)))
            s["vib"] = max(0.1, round(s["vib"] + (random.random() - 0.5) * 0.25, 2))
            s["tilt"] = max(0.05, round(s["tilt"] + (random.random() - 0.5) * 0.15, 2))
            s["temp"] = round(s["temp"] + (random.random() - 0.5) * 0.4, 1)
            s["hum"] = min(100.0, max(30.0, round(s["hum"] + (random.random() - 0.5) * 0.8, 1)))

            payload = {
                "station_name": s["name"],
                "rainfall_mm": s["rain"],
                "soil_moisture_pct": s["soil"],
                "slope_deg": s["slope"],
                "vibration_mms": s["vib"],
                "tilt_deg": s["tilt"],
                "temperature_c": s["temp"],
                "humidity_pct": s["hum"]
            }

            try:
                data_bytes = json.dumps(payload).encode("utf-8")
                req = urllib.request.Request(
                    API_URL,
                    data=data_bytes,
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=2.5) as res:
                    if res.status in (200, 201):
                        print(f"  ✓ [{s['name']}] rain={s['rain']}mm, soil={s['soil']}%, tilt={s['tilt']}°")
                    else:
                        print(f"  ✗ [{s['name']}] HTTP {res.status}")
            except urllib.error.HTTPError as e:
                print(f"  ✗ [{s['name']}] HTTP {e.code}: {e.read().decode('utf-8')}")
            except Exception as e:
                print(f"  ! Connection error for {s['name']}: {e}")

        if iterations > 0 and cycle >= iterations:
            break

        time.sleep(interval_sec)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="NER Landslide Guard IoT Telemetry Simulator")
    parser.add_argument("--interval", type=float, default=4.0, help="Interval in seconds between cycles")
    parser.add_argument("--iterations", type=int, default=0, help="Number of cycles to run (0 for infinite)")
    parser.add_argument("--url", type=str, default=API_URL, help="Ingestion API endpoint URL")
    args = parser.parse_args()
    API_URL = args.url
    run_simulator(interval_sec=args.interval, iterations=args.iterations)
