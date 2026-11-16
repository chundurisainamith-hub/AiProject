import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/common/Card';
import {
  Info,
  Radio,
  Cpu,
  Database,
  Layers,
  ArrowRight,
  ShieldAlert,
  Server,
  Code2
} from 'lucide-react';

export const AboutProject = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight flex items-center gap-2">
          <Info className="w-6 h-6 text-accent" />
          <span>{t('nav.about', 'About NER Landslide Guard')}</span>
        </h2>
        <p className="text-xs text-ink-soft">
          Comprehensive technical blueprint, system architecture, and machine learning methodology
        </p>
      </div>

      {/* Project Overview & Problem Statement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Problem Statement">
          <p className="text-xs text-ink-soft leading-relaxed">
            The North Eastern Region (NER) of India—comprising Assam, Arunachal Pradesh, Meghalaya, Manipur, Mizoram, Nagaland, Tripura, and Sikkim—features steep young tectonic topography and intense monsoon rainfall. Landslides frequently sever vital transport arteries, damage infrastructure, and endanger vulnerable communities without timely geotechnical warning.
          </p>
        </Card>

        <Card title="Project Objectives">
          <ul className="space-y-2 text-xs text-ink-soft list-disc list-inside">
            <li>Synthesize multi-modal sensory inputs (precipitation, soil saturation, vibration, tilt).</li>
            <li>Deploy machine learning (Random Forest) for predictive slope instability scoring.</li>
            <li>Provide graded early warning bulletins (Low, Moderate, High, Critical) in real time.</li>
            <li>Deliver an accessible multilingual portal across 6 Indian regional languages.</li>
          </ul>
        </Card>
      </div>

      {/* System Architecture Flow Diagram */}
      <Card title="System Architecture & Data Pipeline">
        <p className="text-xs text-ink-soft mb-4">
          End-to-end data processing workflow from edge telemetry acquisition to multi-channel public dissemination:
        </p>

        {/* Visual Architecture Flow Diagram */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 items-center text-center">
          <div className="p-3 rounded-2xl bg-[#0D1829] border border-white/10 space-y-1">
            <Radio className="w-5 h-5 text-accent mx-auto" />
            <div className="text-[11px] font-extrabold text-ink">IoT Sensors</div>
            <div className="text-[10px] text-ink-soft">ESP32 / Gauges</div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0D1829] border border-white/10 space-y-1">
            <Server className="w-5 h-5 text-accent mx-auto" />
            <div className="text-[11px] font-extrabold text-ink">Data Ingestion</div>
            <div className="text-[10px] text-ink-soft">REST / MQTT</div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0D1829] border border-white/10 space-y-1">
            <Database className="w-5 h-5 text-accent mx-auto" />
            <div className="text-[11px] font-extrabold text-ink">Database</div>
            <div className="text-[10px] text-ink-soft">SQLAlchemy ORM</div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0D1829] border border-white/10 space-y-1">
            <Cpu className="w-5 h-5 text-accent mx-auto" />
            <div className="text-[11px] font-extrabold text-ink">AI Prediction</div>
            <div className="text-[10px] text-ink-soft">Random Forest</div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0D1829] border border-white/10 space-y-1">
            <Layers className="w-5 h-5 text-accent mx-auto" />
            <div className="text-[11px] font-extrabold text-ink">Risk Scoring</div>
            <div className="text-[10px] text-ink-soft">Geotech Formula</div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0D1829] border border-white/10 space-y-1">
            <ShieldAlert className="w-5 h-5 text-accent mx-auto" />
            <div className="text-[11px] font-extrabold text-ink">Alert Engine</div>
            <div className="text-[10px] text-ink-soft">Graded Dispatch</div>
          </div>

          <div className="p-3 rounded-2xl bg-accent text-white space-y-1 shadow-lg shadow-accent/25">
            <Code2 className="w-5 h-5 text-white mx-auto" />
            <div className="text-[11px] font-extrabold text-white">Dashboard</div>
            <div className="text-[10px] text-white/80">React 18 / Vite</div>
          </div>
        </div>
      </Card>

      {/* Technology Stack Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card title="Frontend Architecture">
          <ul className="space-y-1.5 text-xs text-ink-soft">
            <li><b>Framework:</b> React 18 & Vite</li>
            <li><b>Styling:</b> Tailwind CSS & Glassmorphism</li>
            <li><b>Mapping:</b> Leaflet & OpenStreetMap GeoJSON</li>
            <li><b>Visuals:</b> Chart.js & react-chartjs-2</li>
            <li><b>Internationalization:</b> react-i18next (6 scripts)</li>
          </ul>
        </Card>

        <Card title="Backend & Database">
          <ul className="space-y-1.5 text-xs text-ink-soft">
            <li><b>API Engine:</b> Python 3.11 & FastAPI</li>
            <li><b>Validation:</b> Pydantic v2 schemas</li>
            <li><b>Authentication:</b> JWT & Bcrypt password hashing</li>
            <li><b>ORM:</b> SQLAlchemy 2.0 with migrations</li>
            <li><b>Storage:</b> SQLite (Local) / PostgreSQL (Prod)</li>
          </ul>
        </Card>

        <Card title="AI & IoT Ecosystem">
          <ul className="space-y-1.5 text-xs text-ink-soft">
            <li><b>Model:</b> Scikit-learn Random Forest Classifier</li>
            <li><b>Heuristics:</b> Weighted Geotechnical Formula</li>
            <li><b>Hardware Nodes:</b> ESP32 / Arduino Microcontrollers</li>
            <li><b>Telemetry:</b> HTTP REST & MQTT Ready</li>
            <li><b>Simulation:</b> Python multi-node telemetry script</li>
          </ul>
        </Card>
      </div>

      {/* Data Status and Project Limitations */}
      <Card title="Data Status & Limitations" className="border-yellow-500/30">
        <div className="space-y-2 text-xs text-ink-soft leading-relaxed">
          <div className="flex items-center gap-2 text-[#FACC15] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#FACC15]"></span>
            <span>Simulated Research & Demonstration Status</span>
          </div>
          <p>
            All telemetry metrics, historical incident records, and prediction estimates in this application are simulated for demonstration purposes. State boundaries and station coordinates are georeferenced for geospatial illustration.
          </p>
          <p>
            Operational field implementation requires formal integration with Survey of India GIS layers, Geological Survey of India (GSI) slope susceptibility indices, and calibrated telemetric rain gauge arrays.
          </p>
        </div>
      </Card>
    </div>
  );
};
