import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StatTile } from '../components/common/StatTile';
import { statsService } from '../services/api';
import {
  MapPin,
  AlertTriangle,
  CloudRain,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export const Home = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    monitored_locations: 16,
    high_risk_zones: 5,
    active_warnings: 8,
    rainfall_stations: 16,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await statsService.getSummary();
        if (data) {
          setStats(data);
        }
      } catch (err) {
        console.warn('Using baseline statistics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#14233D] to-[#0A1220] border border-white/10 p-6 sm:p-12 shadow-2xl">
        {/* Mountain Silhouette SVG Background matching original HTML */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-80 h-44 sm:h-64">
          <svg viewBox="0 0 1200 300" preserveAspectRatio="none" className="w-full h-full">
            <path
              d="M0 300V190l120-70 110 60 140-110 130 90 150-100 160 120 120-70 150 80 120-60v270z"
              fill="#0F1C33"
            />
            <path
              d="M0 300V230l150-60 120 50 170-80 150 70 180-60 140 50 290-40v140z"
              fill="#0A1424"
            />
          </svg>
        </div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-accent/15 text-accent border border-accent/30">
            <Cpu className="w-3.5 h-3.5" />
            <span>AI & IoT Geotechnical Monitoring Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-ink tracking-tight leading-none">
            NER LANDSLIDE <span className="text-accent">GUARD</span>
          </h1>

          <div className="text-lg sm:text-xl font-bold text-ink-soft">
            {t('home.tagline', 'AI-Powered Landslide Prediction and Early Warning System')}
          </div>

          <p className="text-sm sm:text-base text-ink-soft leading-relaxed max-w-2xl">
            {t(
              'home.desc',
              'Real-time automated geotechnical monitoring of rainfall intensity, soil saturation, slope displacement and ground vibration across all 8 North Eastern states: Assam, Arunachal Pradesh, Meghalaya, Manipur, Mizoram, Nagaland, Tripura and Sikkim.'
            )}
          </p>

          {/* Quick Action CTA Buttons */}
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-extrabold shadow-lg shadow-accent/25 transition-all duration-200"
            >
              <span>{t('nav.dashboard', 'Explore Dashboard')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/map"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-ink border border-white/10 text-sm font-extrabold backdrop-blur-md transition-all duration-200"
            >
              <MapPin className="w-4 h-4 text-accent" />
              <span>{t('nav.map', 'View Risk Map')}</span>
            </Link>

            <Link
              to="/response"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-ink border border-white/10 text-sm font-extrabold backdrop-blur-md transition-all duration-200"
            >
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span>{t('nav.response', 'Emergency Information')}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4 Summary Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label={t('home.monitoredLocations', 'Monitored Locations')}
          value={stats.monitored_locations || 16}
          subtitle={t('home.acrossStates', 'across 8 NE states')}
          icon={MapPin}
        />
        <StatTile
          label={t('home.highRiskZones', 'High-Risk Zones')}
          value={stats.high_risk_zones || 5}
          subtitle={t('home.highCritical', 'High + Critical')}
          icon={AlertTriangle}
          className="border-orange-500/30"
        />
        <StatTile
          label={t('home.activeWarnings', 'Active Warnings')}
          value={stats.active_warnings || 8}
          subtitle={t('home.modAbove', 'Moderate and above')}
          icon={ShieldAlert}
          className="border-yellow-500/30"
        />
        <StatTile
          label={t('home.rainfallStations', 'Rainfall Stations')}
          value={stats.rainfall_stations || 16}
          subtitle={t('home.simGauges', 'Automated telemetry gauges')}
          icon={CloudRain}
        />
      </div>

      {/* Note */}
      <div className="p-3.5 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-[#FACC15] flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#FACC15] shrink-0"></span>
        <span>
          Simulated demonstration telemetry & AI risk estimation — not validated meteorological forecasts or certified disaster announcements.
        </span>
      </div>
    </div>
  );
};
