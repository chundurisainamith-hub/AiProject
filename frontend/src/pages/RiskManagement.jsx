import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/common/Card';
import { RiskBadge } from '../components/common/RiskBadge';
import { stationService } from '../services/api';
import {
  ShieldCheck,
  AlertTriangle,
  Hospital,
  Home,
  PhoneCall,
  CheckCircle2,
  Info,
  Compass
} from 'lucide-react';

export const RiskManagement = () => {
  const { t } = useTranslation();
  const [highRiskStations, setHighRiskStations] = useState([]);

  useEffect(() => {
    const fetchHighRisk = async () => {
      try {
        const data = await stationService.getAll();
        const top = (data || []).filter(
          (s) => s.risk_level === 'HIGH' || s.risk_level === 'CRITICAL'
        );
        setHighRiskStations(top);
      } catch (err) {
        console.error('Error fetching high risk stations:', err);
      }
    };
    fetchHighRisk();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-accent" />
          <span>{t('nav.response', 'Risk Management & Emergency Response')}</span>
        </h2>
        <div className="mt-1 p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-[#FACC15]">
          Operational disaster preparedness protocols, immediate high-risk zones, and standardized NDMA slope safety actions.
        </div>
      </div>

      {/* High-Risk Areas Now & Evacuation Infrastructure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* High Risk Areas Now */}
        <Card title="Immediate High-Risk Areas" subtitle="Slope sections requiring immediate vigilance">
          <div className="space-y-2.5">
            {highRiskStations.length > 0 ? (
              highRiskStations.map((stn) => (
                <div
                  key={stn.id}
                  className="p-3 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <RiskBadge level={stn.risk_level} />
                    <div>
                      <div className="text-sm font-bold text-ink">{stn.name}</div>
                      <div className="text-xs text-ink-soft">
                        {stn.state} · 24h Rain: {stn.latest_reading?.rainfall_mm || 0} mm
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-accent">
                      {stn.ai_probability || 0}% Risk
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-ink-soft py-4">No stations currently at HIGH or CRITICAL level.</p>
            )}
          </div>
        </Card>

        {/* Shelters, Hospitals & Routes Architecture */}
        <Card title="Evacuation Shelters, Hospitals & Routes" subtitle="Georeferenced emergency facilities">
          <div className="space-y-3 text-xs text-ink-soft">
            <p className="leading-relaxed">
              Standard district disaster management procedure dictates pre-assigning relief halls and tertiary medical centers for designated vulnerable hill corridors.
            </p>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-[#0D1829] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hospital className="w-4 h-4 text-accent" />
                  <div>
                    <span className="font-bold text-ink block">Civil Hospitals & Trauma Centers</span>
                    <span className="text-[11px] text-ink-soft">Populated from SDMA district medical rosters</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent/20 text-accent">
                  Emergency Medical
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#0D1829] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-[#FACC15]" />
                  <div>
                    <span className="font-bold text-ink block">Community Relief Shelters</span>
                    <span className="text-[11px] text-ink-soft">Safe high ground evacuation structures</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                  Designated Refuge
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
              <span className="font-bold text-ink">Emergency Dispatch:</span>
              <span className="font-mono font-bold text-accent">National 112 · NDMA 1078</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Safety Protocol: Before / During / After */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* BEFORE */}
        <Card
          className="border-t-4 border-t-[#38BDF8]"
          title="BEFORE: Preparedness"
          subtitle="Proactive precautions"
        >
          <ul className="space-y-2.5 text-xs text-ink-soft list-disc list-inside">
            <li>Identify safe high-ground locations away from steep slopes and ravines.</li>
            <li>Prepare a family emergency go-bag with essentials, first-aid, food and documents.</li>
            <li>Monitor daily weather warnings and rainfall advisories regularly.</li>
            <li>Inspect surrounding hill slopes for new ground cracks, tilting poles or muddy runoff.</li>
          </ul>
        </Card>

        {/* DURING */}
        <Card
          className="border-t-4 border-t-[#FB923C]"
          title="DURING: Emergency Action"
          subtitle="Immediate survival measures"
        >
          <ul className="space-y-2.5 text-xs text-ink-soft list-disc list-inside">
            <li>Move sideways out of the landslide debris path quickly, never run downhill.</li>
            <li>Stay completely away from hill streams, culverts and swollen gullies.</li>
            <li>Follow official evacuation orders issued by local police or disaster wardens.</li>
            <li>Contact emergency services on 112 immediately if trapped or isolated.</li>
          </ul>
        </Card>

        {/* AFTER */}
        <Card
          className="border-t-4 border-t-[#22C55E]"
          title="AFTER: Recovery & Safety"
          subtitle="Post-slide stabilization"
        >
          <ul className="space-y-2.5 text-xs text-ink-soft list-disc list-inside">
            <li>Stay well away from the slide zone; secondary and tertiary slides often follow.</li>
            <li>Avoid entering damaged buildings, retaining walls or cracked roadways.</li>
            <li>Report structural damages, broken gas/power lines and road cuts to authorities.</li>
            <li>Assist injured or elderly neighbours after ensuring your own safety.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
