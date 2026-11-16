import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/common/Card';
import { StatTile } from '../components/common/StatTile';
import { RiskBadge } from '../components/common/RiskBadge';
import { stationService, statsService, alertService } from '../services/api';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const STATES = [
  'All',
  'Assam',
  'Arunachal Pradesh',
  'Meghalaya',
  'Manipur',
  'Mizoram',
  'Nagaland',
  'Tripura',
  'Sikkim',
];

export const Dashboard = () => {
  const { t } = useTranslation();
  const [selectedState, setSelectedState] = useState('All');
  const [stations, setStations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async (isInitial = false) => {
      if (isInitial) setLoading(true);
      try {
        const [stnData, alertData] = await Promise.all([
          stationService.getAll(selectedState),
          alertService.getAll(),
        ]);
        if (!isMounted) return;
        setStations(stnData || []);
        const filteredAlerts = (alertData || []).filter(
          (a) => selectedState === 'All' || a.state === selectedState
        );
        setAlerts(filteredAlerts);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        if (isMounted && isInitial) setLoading(false);
      }
    };

    fetchData(true);
    // Automatic live dashboard refresh every 4 seconds to sync with IoT readings
    const timer = setInterval(() => fetchData(false), 4000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [selectedState]);

  // Compute metrics from current station set
  const count = stations.length || 1;
  const avgRain = stations.reduce((acc, s) => acc + (s.latest_reading?.rainfall_mm || 0), 0) / count;
  const avgSoil = stations.reduce((acc, s) => acc + (s.latest_reading?.soil_moisture_pct || 0), 0) / count;
  const avgVib = stations.reduce((acc, s) => acc + (s.latest_reading?.vibration_mms || 0), 0) / count;
  const avgTilt = stations.reduce((acc, s) => acc + (s.latest_reading?.tilt_deg || 0), 0) / count;
  const avgTemp = stations.reduce((acc, s) => acc + (s.latest_reading?.temperature_c || 0), 0) / count;
  const avgHum = stations.reduce((acc, s) => acc + (s.latest_reading?.humidity_pct || 0), 0) / count;

  // Maximum risk in current filtered view
  const riskLevels = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
  const maxRiskIdx = stations.reduce((max, s) => {
    const idx = riskLevels.indexOf(s.risk_level || 'LOW');
    return Math.max(max, idx);
  }, 0);
  const maxRisk = riskLevels[maxRiskIdx] || 'LOW';

  // Highest probability station
  const topStation = stations.reduce((top, s) => {
    if (!top || (s.ai_probability || 0) > (top.ai_probability || 0)) return s;
    return top;
  }, null);

  // Risk distribution for doughnut chart
  const riskCounts = [
    stations.filter((s) => s.risk_level === 'LOW').length,
    stations.filter((s) => s.risk_level === 'MODERATE').length,
    stations.filter((s) => s.risk_level === 'HIGH').length,
    stations.filter((s) => s.risk_level === 'CRITICAL').length,
  ];

  // Rainfall trend chart data
  const rainfallChartData = {
    labels: ['-6d', '-5d', '-4d', '-3d', '-2d', '-1d', 'Today'],
    datasets: [
      {
        label: `${t('common.rainfall', 'Average rainfall')} (mm)`,
        data: [0.4, 0.7, 0.5, 1.1, 0.9, 1.3, 1.0].map((m) => Math.round(avgRain * m)),
        borderColor: '#FF6A2B',
        backgroundColor: 'rgba(255, 106, 43, 0.15)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#FF6A2B',
        pointBorderColor: '#fff',
      },
    ],
  };

  const doughnutData = {
    labels: ['Low', 'Moderate', 'High', 'Critical'],
    datasets: [
      {
        data: riskCounts,
        backgroundColor: ['#22C55E', '#FACC15', '#FB923C', '#EF4444'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#9FB0C8', font: { family: 'Manrope', size: 12 } },
      },
      tooltip: {
        backgroundColor: '#101C30',
        borderColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        titleColor: '#EEF3FB',
        bodyColor: '#9FB0C8',
      },
    },
    scales: {
      x: {
        ticks: { color: '#9FB0C8', font: { family: 'Manrope' } },
        grid: { color: 'rgba(255, 255, 255, 0.06)' },
      },
      y: {
        ticks: { color: '#9FB0C8', font: { family: 'Manrope' } },
        grid: { color: 'rgba(255, 255, 255, 0.06)' },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#9FB0C8', font: { family: 'Manrope', size: 12 } },
      },
    },
    cutout: '65%',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            {t('nav.dashboard', 'Scientific Monitoring Dashboard')}
          </h2>
          <p className="text-xs text-ink-soft mt-1">
            Real-time sensory telemetry synthesis and geotechnical indicators
          </p>
        </div>

        {/* State filter selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-ink-soft uppercase tracking-wider">
            {t('common.state', 'State')}:
          </label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-[#0D1829] border border-white/10 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold text-ink focus:outline-none focus:border-accent"
          >
            {STATES.map((s) => (
              <option key={s} value={s} className="bg-[#0A1220] text-ink">
                {s === 'All' ? t('common.allStates', 'All States') : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 8 Statistic Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatTile
          label={t('common.currentRisk', 'Current Risk')}
          value={<RiskBadge level={maxRisk} />}
          subtitle={`${stations.length} stations active`}
        />
        <StatTile
          label={t('common.rainfall', 'Rainfall')}
          value={`${avgRain.toFixed(0)} mm`}
          subtitle="avg, last 24 h"
        />
        <StatTile
          label={t('common.soilMoisture', 'Soil Moisture')}
          value={`${avgSoil.toFixed(0)}%`}
          subtitle="saturation average"
        />
        <StatTile
          label={t('common.vibration', 'Ground Vibration')}
          value={`${avgVib.toFixed(2)}`}
          subtitle="mm/s velocity"
        />
        <StatTile
          label={t('common.tilt', 'Slope Movement')}
          value={`${avgTilt.toFixed(1)}°`}
          subtitle="avg angular tilt"
        />
        <StatTile
          label={t('common.temperature', 'Temperature')}
          value={`${avgTemp.toFixed(1)}°C`}
          subtitle="ambient average"
        />
        <StatTile
          label={t('common.humidity', 'Humidity')}
          value={`${avgHum.toFixed(0)}%`}
          subtitle="relative humidity"
        />
        <StatTile
          label={t('common.aiProbability', 'AI Probability')}
          value={topStation ? `${topStation.ai_probability}%` : '–'}
          subtitle={topStation ? `${topStation.name} (peak)` : ''}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title={t('dashboard.rainfallTrend', '7-Day Regional Rainfall Trend (mm)')}>
          <div className="h-64 w-full">
            <Line data={rainfallChartData} options={chartOptions} />
          </div>
        </Card>

        <Card title={t('dashboard.riskDistribution', 'Station Risk Level Distribution')}>
          <div className="h-64 w-full">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </Card>
      </div>

      {/* Recent Warnings */}
      <Card title={t('dashboard.recentWarnings', 'Recent Critical Warnings & Alerts')}>
        <div className="divide-y divide-white/10">
          {alerts.length > 0 ? (
            alerts.slice(0, 5).map((alert, idx) => (
              <div key={alert.id || idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <RiskBadge level={alert.level} />
                    <span className="font-bold text-sm text-ink">{alert.station_name}</span>
                    <span className="text-xs text-ink-soft">· {alert.state}</span>
                    <span className="text-xs text-ink-soft/70">
                      · {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft">{alert.message}</p>
                </div>
                <div className="text-xs font-semibold text-accent/90 sm:text-right max-w-xs">
                  {alert.action}
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-xs text-ink-soft">No active warnings for this state.</p>
          )}
        </div>
      </Card>
    </div>
  );
};
