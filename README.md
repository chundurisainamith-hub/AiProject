# NER LANDSLIDE GUARD
## Full-Stack AI Landslide Prediction, Risk Monitoring and Early Warning Platform

An enterprise-grade, responsive AI/ML and IoT geotechnical risk monitoring platform designed specifically for the North Eastern Region of India (Assam, Arunachal Pradesh, Meghalaya, Manipur, Mizoram, Nagaland, Tripura, and Sikkim).

---

## 1. System Overview & UI/UX Identity

NER Landslide Guard preserves the visual hierarchy, dark glassmorphism design, and color scheme of the reference project while upgrading it to a robust full-stack architecture:

- **Background:** `#0A1220` (Dark Navy)
- **Secondary Background:** `#101C30` (Charcoal Slate)
- **Primary Accent:** `#FF6A2B` (Emergency Safety Orange)
- **Primary Ink Text:** `#EEF3FB`
- **Secondary Ink Text:** `#9FB0C8`
- **Glassmorphism Panels:** `rgba(255, 255, 255, 0.06)` with subtle `rgba(255, 255, 255, 0.12)` borders and `10px` backdrop blur.

### Four-Tier Color-Coded Risk Standard:
- **LOW:** `#22C55E` (Green) — Normal baseline conditions.
- **MODERATE:** `#FACC15` (Yellow) — Increased monitoring required.
- **HIGH:** `#FB923C` (Orange) — Slope saturation; prepare for evacuation.
- **CRITICAL:** `#EF4444` (Red) — Structural failure imminent; evacuate immediately.

---

## 2. Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router DOM v6, Chart.js, react-chartjs-2, Leaflet & CartoDB Dark Matter tiles, react-i18next (6 Indian regional languages), Lucide React icons.
- **Backend API:** Python 3.11, FastAPI, Pydantic v2 schemas, SQLAlchemy 2.0 ORM, Uvicorn ASGI server.
- **Security & RBAC:** JWT bearer access tokens, Bcrypt password hashing, backend permission enforcement.
- **AI/ML Engine:** Scikit-learn Random Forest Classifier + pure NumPy vectorized fallback inference + calibrated logistic scoring.
- **Geotechnical Formula:** Geotechnical weighted risk assessment normalized over 24-hour rainfall, soil moisture, slope gradient, ground vibration, and angular tilt.
- **IoT & Hardware:** RESTful ingestion pipeline (`POST /api/readings`) ready for ESP32 and Arduino edge telemetry, accompanied by an automated multi-node Python simulator.
- **Databases:** SQLite for local development (`ner_landslide_guard.db`) and PostgreSQL in production via SQLAlchemy.

---

## 3. Multi-Tier Authentication System

Authentication is handled securely on the backend (`POST /api/auth/login`). Plain passwords or credentials are never stored in `localStorage`.

### User Login Tab:
- Username must end with `@NER.com` (case-insensitive).
- Validation: If the domain is invalid, returns: `"Login failed: username must end with @NER.com"`.
- First-time login: Automatically registers the valid account with the entered password.
- Password constraint: Minimum 6 characters. Passwords are hashed with bcrypt.
- Subsequent logins: Requires the same password. If incorrect: `"Login failed: incorrect password"`.

### Admin Login Tab:
- Username must end with `@adm.com`.
- Validation: If the domain is invalid, returns: `"Login failed: admin username must end with @adm.com"`.
- **First Admin (Owner):** The very first administrator who registers becomes the permanent platform `OWNER`.
- **Subsequent Admins:** Placed in a `PENDING` approval queue in the database. Returns: `"Request sent to the admin. You can sign in once it is accepted."`.
- **Owner Review:** The platform Owner can accept or reject requests in the Admin Panel.
- **Status Guard:** Rejected admins display `"Your admin request was rejected."`; pending admins display `"Your request is still waiting for approval."`.
- **Hidden Admin Navigation:** The Admin Panel navigation item is only rendered for authenticated administrators and owners.

---

## 4. Platform Pages (10 Dedicated Routes)

1. **Home (`/`):** Layered mountain hero illustration, high-impact branding, quick action buttons, and 4 summary statistic cards sourced from the backend.
2. **Dashboard (`/dashboard`):** 8 live geotechnical metric cards (Current Risk, Rainfall, Soil Moisture, Vibration, Tilt, Temperature, Humidity, AI Probability), 7-day rainfall trend line chart, risk distribution doughnut chart, recent critical alerts, and interactive state filtering.
3. **Live Risk Map (`/map`):** Interactive Leaflet map of Northeast India with genuine GeoJSON administrative boundaries for all 8 states, 16 color-coded circular monitoring markers, station search, state and risk filters, zoom and re-center controls, and a detailed station inspection panel.
4. **AI Prediction (`/predict`):** Form accepting 7 geotechnical factors (Rainfall intensity, Soil moisture, Slope angle, Soil type, Vibration, Temperature, 7-day rainfall), querying `POST /api/predict`, rendering probability percentage, geotechnical risk score, top factor attribution bars, and safety recommendations.
5. **IoT Monitoring (`/iot`):** Live telemetry table of 16 sensor nodes updating in real time, Online/Degraded health indicators, historical trend chart, and state filtering.
6. **Early Warnings (`/alerts`):** Graded bulletin feed, minimum alert level filter, national emergency numbers (112, NDMA 1078), and multi-channel notification architecture blueprint (SMS, Email, Push).
7. **Historical Data (`/history`):** Searchable and sortable database of documented landslide incidents across Northeast India with pre-incident rainfall charts and state distribution breakdown.
8. **Risk Management (`/response`):** Current high-risk hazard zones, designated shelters and trauma center rosters, and comprehensive Before / During / After slope survival guidelines.
9. **About Project (`/about`):** Problem statement, technical stack summary, limitations disclaimer, and a visual 7-stage architecture diagram:
   `IoT Sensors → Data Ingestion → Database → AI Prediction → Risk Assessment → Alert Engine → User Dashboard`
10. **Admin Panel (`/admin`):** Restricted to authenticated staff. Allows the Owner to approve/reject pending admin requests, inspect platform user accounts, perform CRUD operations on physical monitoring stations (Add, Edit, Delete), and review system status.

---

## 5. Multilingual Support (6 Indian Languages)

Implemented with `react-i18next` and persistent across page refreshes:
1. **English** (`en`)
2. **Hindi** (`hi` - हिन्दी)
3. **Tamil** (`ta` - தமிழ்)
4. **Telugu** (`te` - తెలుగు)
5. **Malayalam** (`ml` - മലയാളം)
6. **Kannada** (`kn` - ಕನ್ನಡ)

---

## 6. Local Quickstart Instructions

### Prerequisites
- Node.js v18+ / v20+
- Python 3.10+ / 3.11+
- Git

### Step 1: Clone & Configure Environment
```bash
git clone https://github.com/your-username/ner-landslide-guard.git
cd ner-landslide-guard

# Copy environment variables
cp .env.example .env
```

### Step 2: Backend Setup & Execution
#### Windows PowerShell:
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Start FastAPI backend on http://127.0.0.1:8000
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### macOS / Linux Terminal:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start FastAPI backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Step 3: Frontend Setup & Execution
In a second terminal window:
```powershell
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** in your browser.

### Step 4: Run IoT Sensor Telemetry Simulator (Optional)
In a third terminal window, start the live sensor telemetry stream:
```powershell
python backend/simulator/iot_simulator.py
```

### Step 5: Run Automated Pytest Test Suite
```powershell
pytest backend/tests/test_api.py -v
```

---

## 7. Pre-Seeded Default Accounts

| Role | Username | Password | Notes |
|---|---|---|---|
| **Owner Admin** | `owner@adm.com` | `admin123` | Can approve/reject pending admins & manage stations |
| **User Operator** | `analyst@ner.com` | `nerpass123` | Standard monitoring operator access |

*New valid usernames ending in `@NER.com` automatically register upon first sign-in.*
*New administrator accounts ending in `@adm.com` submit an approval request to `owner@adm.com`.*

---

## 8. Docker Deployment

To launch the full stack with PostgreSQL database using Docker Compose:

```bash
docker-compose up --build -d
```
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/health
- PostgreSQL: localhost:5432

---

## 9. Cloud Production Deployment

### Frontend on Vercel:
1. Connect your repository to [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Framework Preset: `Vite`.
4. Set Environment Variable:
   - `VITE_API_URL`: Your deployed backend URL (e.g. `https://ner-backend.onrender.com/api`).
5. Deploy.

### Backend on Render / Railway:
1. Create a new Web Service pointing to the repository root.
2. Build Command: `pip install -r backend/requirements.txt`
3. Start Command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. Environment Variables:
   - `DATABASE_URL`: `postgresql://<user>:<password>@<host>:<port>/<dbname>`
   - `SECRET_KEY`: A strong, randomly generated secret string.
   - `BACKEND_CORS_ORIGINS`: `["https://your-frontend.vercel.app"]`
