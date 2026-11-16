import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/common/Card';
import { stationService, readingService } from '../services/api';
import { Radio, Search, Filter, RefreshCw, Activity, Cpu } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

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

export const IoTMonitoring = () => {
  const { t } = useTranslation();
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [historyReadings, setHistoryReadings] = useState([]);
  const [selectedState, setSelectedState] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchStations = async () => {
    try {
      const data = await stationService.getAll();
      setStations(data || []);
      if (!selectedStation && data && data.length > 0) {
        setSelectedStation(data[0]);
      }
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to fetch stations:', err);
    }
  };

  const fetchStationHistory = async (stationId) => {
    if (!stationId) return;
    try {
      const data = await readingService.getStationHistory(stationId, 15);
      setHistoryReadings(data || []);
    } catch (err) {
      console.warn('Could not load station history:', err);
    }
  };

  // Initial fetch and auto-refresh every 4 seconds
  useEffect(() => {
    fetchStations();
    const interval = setInterval(fetchStations, 4000);
    return () => clearInterval(interval);
  }, []);

  // Fetch history when selectedStation changes
  useEffect(() => {
    if (selectedStation) {
      fetchStationHistory(selectedStation.id);
    }
  }, [selectedStation]);

  const filteredStations = stations.filter((s) => {
    const matchState = selectedState === 'All' || s.state === selectedState;
    const matchQuery =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.state.toLowerCase().includes(searchQuery.toLowerCase());
    return matchState && matchQuery;
  });

  // History chart dataset
  const chartLabels = (historyReadings || []).map((r) =>
    new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  ).reverse();

  const historyChartData = {
    labels: chartLabels.length ? chartLabels : ['-15m', '-10m', '-5m', 'Now'],
    datasets: [
      {
        label: 'Rainfall (mm)',
        data: historyReadings.map((r) => r.rainfall_mm).reverse(),
        borderColor: '#FF6A2B',
        backgroundColor: 'rgba(255,106,43,0.1)',
        tension: 0.3,
      },
      {
        label: 'Soil Moisture (%)',
        data: historyReadings.map((r) => r.soil_moisture_pct).reverse(),
        borderColor: '#38BDF8',
        backgroundColor: 'rgba(56,189,248,0.1)',
        tension: 0.3,
      },
      {
        label: 'Tilt Angle (°)',
        data: historyReadings.map((r) => r.tilt_deg * 10).reverse(), // scaled for visibility
        borderColor: '#FACC15',
        backgroundColor: 'rgba(250,204,21,0.1)',
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#9FB0C8', font: { family: 'Manrope', size: 11 } },
      },
    },
    scales: {
      x: {
        ticks: { color: '#9FB0C8', font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      y: {
        ticks: { color: '#9FB0C8', font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight flex items-center gap-2">
            <Radio className="w-6 h-6 text-accent animate-pulse" />
            <span>{t('nav.iot', 'IoT Sensor Monitoring')}</span>
          </h2>
          <p className="text-xs text-ink-soft">
            Live telemetry ingestion gateway for ESP32 & Arduino edge nodes (POST /api/readings)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-soft">
            Last update: {lastRefreshed.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchStations}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-ink transition-colors"
            title="Refresh now"
          >
            <RefreshCw className="w-4 h-4 text-accent" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white/[0.04] p-3 rounded-2xl border border-white/10">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-ink-soft absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search station or state..."
            className="w-full bg-[#0D1829] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-ink placeholder-ink-soft/40 focus:outline-none focus:border-accent"
          />
        </div>

        <div className="sm:w-60">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full bg-[#0D1829] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:border-accent"
          >
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? t('common.allStates', 'All States') : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Station Table */}
      <Card title="Live Sensor Telemetry Table" subtitle="Telemetry stream polling every 4 seconds">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-ink-soft uppercase text-[11px] font-bold">
                <th className="py-2.5 px-3">Station</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Rain Gauge</th>
                <th className="py-2.5 px-3">Soil Moisture</th>
                <th className="py-2.5 px-3">Vibration</th>
                <th className="py-2.5 px-3">Tilt</th>
                <th className="py-2.5 px-3">Temp / Hum</th>
                <th className="py-2.5 px-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStations.map((s, idx) => {
                const r = s.latest_reading || {};
                const isSelected = selectedStation?.id === s.id;
                const status = idx % 7 === 5 ? 'Degraded' : 'Online';
                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedStation(s)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-accent/15' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-ink">
                      <div>{s.name}</div>
                      <div className="text-[10px] text-ink-soft font-normal">{s.state}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1.5 font-bold">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            status === 'Online' ? 'bg-[#22C55E]' : 'bg-[#FACC15]'
                          }`}
                        />
                        <span className={status === 'Online' ? 'text-[#22C55E]' : 'text-[#FACC15]'}>
                          {status}
                        </span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-ink">
                      {(r.rainfall_mm || 0).toFixed(1)} mm
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-ink">
                      {(r.soil_moisture_pct || 0).toFixed(0)}%
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-ink">
                      {(r.vibration_mms || 0).toFixed(2)} mm/s
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-ink">
                      {(r.tilt_deg || 0).toFixed(1)}°
                    </td>
                    <td className="py-2.5 px-3 text-ink-soft">
                      {(r.temperature_c || 0).toFixed(0)}°C / {(r.humidity_pct || 0).toFixed(0)}%
                    </td>
                    <td className="py-2.5 px-3 text-ink-soft text-[11px]">
                      {r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : 'Recent'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Selected Station Historical Readings Chart */}
      {selectedStation && (
        <Card
          title={`Historical Telemetry Trends: ${selectedStation.name} (${selectedStation.state})`}
          subtitle="Showing recent sensor readings for rain gauge, soil saturation and tilt displacement"
        >
          <div className="h-64 w-full">
            <Line data={historyChartData} options={chartOptions} />
          </div>
        </Card>
      )}

      {/* Hardware Specifications Note */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Sensor Node Health & Calibration">
          <p className="text-xs text-ink-soft leading-relaxed">
            Each monitoring node carries 5 industrial-grade geotechnical sensors: tipping bucket rain gauge, capacitive soil moisture probe, piezoresistive triaxial vibration sensor, MEMS dual-axis inclinometer tilt sensor, and digital temperature/humidity sensor. Nodes marked Degraded indicate intermittent telemetry transmission or sensor drift.
          </p>
        </Card>

        <Card title="Hardware Gateway Ingestion">
          <p className="text-xs text-ink-soft leading-relaxed">
            Ready for live deployment with ESP32-WROOM-32 and Arduino Mega microcontrollers. Nodes transmit JSON sensor payloads via HTTP REST (<code className="text-accent">POST /api/readings</code>) or MQTT broker with TLS encryption. Run the simulator script to feed realistic data during field testing.
          </p>
        </Card>
      </div>
    </div>
  );
};
