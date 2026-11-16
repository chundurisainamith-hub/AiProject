import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/common/Card';
import { incidentService } from '../services/api';
import { Search, Filter, History, ArrowUpDown, CloudRain } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

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

export const HistoricalData = () => {
  const { t } = useTranslation();
  const [incidents, setIncidents] = useState([]);
  const [selectedState, setSelectedState] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('incident_date');
  const [sortAsc, setSortAsc] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      setLoading(true);
      try {
        const data = await incidentService.getAll(selectedState, searchQuery);
        setIncidents(data || []);
      } catch (err) {
        console.error('Failed to load historical incidents:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, [selectedState, searchQuery]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedIncidents = [...incidents].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  // Rainfall bar chart data
  const rainfallChartData = {
    labels: sortedIncidents.map((inc) => `${inc.incident_date.slice(0, 4)} ${inc.district}`),
    datasets: [
      {
        label: 'Precipitation Prior to Incident (mm)',
        data: sortedIncidents.map((inc) => inc.rainfall_before_mm),
        backgroundColor: '#FF6A2B',
        borderRadius: 8,
      },
    ],
  };

  // State distribution pie chart
  const stateCounts = {};
  incidents.forEach((inc) => {
    stateCounts[inc.state] = (stateCounts[inc.state] || 0) + 1;
  });

  const pieChartData = {
    labels: Object.keys(stateCounts),
    datasets: [
      {
        data: Object.values(stateCounts),
        backgroundColor: [
          '#FF6A2B',
          '#38BDF8',
          '#FACC15',
          '#22C55E',
          '#A855F7',
          '#EC4899',
          '#14B8A6',
          '#F97316',
        ],
        borderWidth: 0,
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
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-accent" />
          <span>{t('nav.history', 'Historical Landslide Database')}</span>
        </h2>
        <div className="mt-1 p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-[#FACC15]">
          Illustrative sample geotechnical records for demonstration. Replace with verified Geological Survey of India (GSI) and NDMA disaster records before operational use.
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white/[0.04] p-3 rounded-2xl border border-white/10">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-ink-soft absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search district, damage or location..."
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" title="Preceding Rainfall Volume Prior to Major Incidents (mm)">
          <div className="h-60 w-full">
            <Bar data={rainfallChartData} options={chartOptions} />
          </div>
        </Card>

        <Card title="Regional Incident Distribution">
          <div className="h-60 w-full">
            <Pie
              data={pieChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'right', labels: { color: '#9FB0C8', font: { size: 10 } } },
                },
              }}
            />
          </div>
        </Card>
      </div>

      {/* Sortable Incident Table */}
      <Card title="Documented Landslide Incidents" subtitle="Click column headers to sort">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-ink-soft uppercase text-[11px] font-bold">
                <th
                  onClick={() => handleSort('incident_date')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('state')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>State</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('district')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>District</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Location</th>
                <th
                  onClick={() => handleSort('rainfall_before_mm')}
                  className="py-3 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Rainfall (mm)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Observed Impact / Damage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedIncidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-white/[0.04] transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-ink">{inc.incident_date}</td>
                  <td className="py-3 px-3 text-ink-soft font-semibold">{inc.state}</td>
                  <td className="py-3 px-3 font-bold text-ink">{inc.district}</td>
                  <td className="py-3 px-3 text-ink-soft">{inc.location}</td>
                  <td className="py-3 px-3 font-bold text-accent">{inc.rainfall_before_mm} mm</td>
                  <td className="py-3 px-3 text-ink-soft">{inc.damage_desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
