import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/common/Card';
import { RiskBadge } from '../components/common/RiskBadge';
import { stationService } from '../services/api';
import { NER_STATES_GEOJSON } from '../maps/nerGeoJson';
import {
  MapPin,
  Search,
  Crosshair,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  Layers,
  Compass,
  Maximize2,
  Minimize2,
  CheckCircle,
  ShieldAlert,
  Clock,
  Activity,
  Droplets,
  Wind,
  Gauge
} from 'lucide-react';
import L from 'leaflet';

// Risk Colors
const RISK_COLORS = {
  LOW: '#22C55E',
  MODERATE: '#FACC15',
  HIGH: '#FB923C',
  CRITICAL: '#EF4444',
};

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

const RISK_LEVELS = ['All', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

// District dictionary for Northeast India monitoring stations
const STATION_DISTRICTS = {
  Guwahati: 'Kamrup Metropolitan',
  Dibrugarh: 'Dibrugarh',
  Silchar: 'Cachar',
  Shillong: 'East Khasi Hills',
  Cherrapunji: 'East Khasi Hills',
  Tura: 'West Garo Hills',
  Imphal: 'Imphal West',
  Churachandpur: 'Churachandpur',
  Aizawl: 'Aizawl',
  Lunglei: 'Lunglei',
  Kohima: 'Kohima',
  Mokokchung: 'Mokokchung',
  Agartala: 'West Tripura',
  Gangtok: 'East Sikkim',
  Itanagar: 'Papum Pare',
  Tawang: 'Tawang',
};

export const LiveRiskMap = () => {
  const { t } = useTranslation();
  const mapContainerRef = useRef(null);
  const mapCardRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const geoJsonLayerRef = useRef(null);

  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedState, setSelectedState] = useState('All');
  const [selectedRisk, setSelectedRisk] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState('all'); // 'all', 'high', 'critical'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [geoJsonData, setGeoJsonData] = useState(NER_STATES_GEOJSON);
  const [geoJsonSource, setGeoJsonSource] = useState('geoBoundaries');
  const [loading, setLoading] = useState(true);

  // 1. Fetch live telemetry from backend
  useEffect(() => {
    let isMounted = true;
    const fetchStations = async (isInitial = false) => {
      try {
        const data = await stationService.getAll();
        if (!isMounted) return;
        setStations(data || []);
        if (isInitial && data && data.length > 0) {
          const defaultTarget = data.find((s) => s.risk_level === 'CRITICAL' || s.risk_level === 'HIGH') || data[0];
          setSelectedStation(defaultTarget);
        } else if (data && selectedStation) {
          const fresh = data.find((s) => s.id === selectedStation.id);
          if (fresh) setSelectedStation(fresh);
        }
      } catch (err) {
        console.error('Failed to load stations for map:', err);
      } finally {
        if (isMounted && isInitial) setLoading(false);
      }
    };
    fetchStations(true);
    const interval = setInterval(() => fetchStations(false), 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 2. Load genuine geoBoundaries GeoJSON from public/data/india_states.geojson
  useEffect(() => {
    let isMounted = true;
    fetch('./data/india_states.geojson')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (isMounted && data && data.features && data.features.length > 0) {
          setGeoJsonData(data);
          setGeoJsonSource('public/data/india_states.geojson');
        }
      })
      .catch((err) => {
        console.warn('Local static fetch fallback to imported geoBoundaries:', err);
        if (isMounted) {
          setGeoJsonData(NER_STATES_GEOJSON);
          setGeoJsonSource('imported geoBoundaries');
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Initialize Leaflet Map (Phase 2 & Phase 4)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initial center: Latitude: 26.0, Longitude: 93.0, Initial zoom: 5
    const map = L.map(mapContainerRef.current, {
      center: [26.0, 93.0],
      zoom: 5,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: false,
      scrollWheelZoom: true,
      dragging: true,
    });

    // Official OpenStreetMap Tile Layer - zero watermarks, zero paid keys (Phase 2)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
      subdomains: 'abc',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Invalidate size after mount
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 4. Render GeoJSON Boundaries for all 8 Northeast States (Phase 3)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geoJsonData) return;

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    const geoJson = L.geoJSON(geoJsonData, {
      style: (feature) => {
        const stateName = feature?.properties?.name || '';
        const isSelected =
          selectedState !== 'All' && stateName.toLowerCase() === selectedState.toLowerCase();
        return {
          color: isSelected ? '#FF6A2B' : '#0284C7',
          weight: isSelected ? 3 : 2,
          opacity: 0.95,
          fillColor: isSelected ? '#FF6A2B' : '#38BDF8',
          fillOpacity: isSelected ? 0.28 : 0.12,
          dashArray: isSelected ? '' : '3, 4',
        };
      },
      onEachFeature: (feature, layer) => {
        const stateName = feature?.properties?.name || 'Northeast India';
        layer.bindTooltip(stateName, {
          permanent: false,
          direction: 'center',
          className:
            'bg-[#0D1829] text-ink text-xs font-black px-2.5 py-1 rounded-lg border border-sky-400/30 shadow-xl pointer-events-none',
        });

        layer.on({
          mouseover: (e) => {
            const l = e.target;
            l.setStyle({
              weight: 3.5,
              color: '#FF6A2B',
              fillOpacity: 0.35,
            });
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
              l.bringToFront();
            }
          },
          mouseout: (e) => {
            geoJson.resetStyle(e.target);
          },
          click: () => {
            setSelectedState(stateName);
          },
        });
      },
    }).addTo(map);

    geoJsonLayerRef.current = geoJson;

    // Auto-calculate and fit bounds to include all 8 states (Phase 4)
    try {
      const bounds = geoJson.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    } catch (e) {
      console.warn('Could not fit GeoJSON bounds:', e);
    }
  }, [geoJsonData, selectedState]);

  // 5. Filter stations (Phase 6)
  const filteredStations = stations.filter((s) => {
    // State filter
    const matchState = selectedState === 'All' || s.state.toLowerCase() === selectedState.toLowerCase();

    // Risk level filter
    let matchRisk = selectedRisk === 'All' || s.risk_level === selectedRisk;
    if (quickFilter === 'high') {
      matchRisk = s.risk_level === 'HIGH' || s.risk_level === 'CRITICAL';
    } else if (quickFilter === 'critical') {
      matchRisk = s.risk_level === 'CRITICAL';
    }

    // Search query
    const district = (STATION_DISTRICTS[s.name] || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.state.toLowerCase().includes(q) ||
      district.includes(q);

    return matchState && matchRisk && matchQuery;
  });

  // 6. Render Color-Coded Circular Risk Markers (Phase 5)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    filteredStations.forEach((s) => {
      const color = RISK_COLORS[s.risk_level] || '#22C55E';
      const isSelected = selectedStation?.id === s.id;
      const district = STATION_DISTRICTS[s.name] || s.state;
      const reading = s.latest_reading || {};
      const rainfall = reading.rainfall_mm ?? s.rain ?? 0;
      const soilMoisture = reading.soil_moisture_pct ?? s.soil ?? 0;
      const vibration = reading.vibration_mms ?? s.vib ?? 0;
      const slopeMovement = reading.slope_deg ?? s.slope ?? 0;
      const tilt = reading.tilt_deg ?? s.tilt ?? 0;
      const aiProb = s.ai_probability ?? 0;
      const updatedTime = reading.timestamp
        ? new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : 'Live';

      // Different visual appearance for each risk level
      let radius = 9;
      let strokeWidth = 2;
      let strokeColor = '#0A1220';
      if (s.risk_level === 'CRITICAL') {
        radius = isSelected ? 15 : 12;
        strokeWidth = 3.5;
        strokeColor = '#FFFFFF';
      } else if (s.risk_level === 'HIGH') {
        radius = isSelected ? 13 : 11;
        strokeWidth = 3;
        strokeColor = '#FFFFFF';
      } else if (s.risk_level === 'MODERATE') {
        radius = isSelected ? 11 : 9.5;
        strokeWidth = 2.5;
        strokeColor = '#101C30';
      } else {
        radius = isSelected ? 10 : 8;
        strokeWidth = 2;
        strokeColor = '#101C30';
      }

      const marker = L.circleMarker([s.latitude, s.longitude], {
        radius,
        fillColor: color,
        color: strokeColor,
        weight: strokeWidth,
        opacity: 1,
        fillOpacity: s.risk_level === 'CRITICAL' ? 1.0 : 0.9,
      });

      // Hover Tooltip
      marker.bindTooltip(
        `<div style="font-family: 'Manrope', sans-serif; font-size: 11px;">
          <b>${s.name}</b> (${district})<br/>
          <span style="color: ${color}; font-weight: 800;">${s.risk_level}</span> · Rain: ${rainfall}mm · AI: ${aiProb}%
        </div>`,
        {
          direction: 'top',
          offset: [0, -8],
          className:
            'bg-[#0D1829] text-ink text-xs p-1.5 rounded-xl border border-white/20 shadow-2xl pointer-events-none',
        }
      );

      // Clickable Popup displaying all 12 requested fields (Phase 5)
      const popupHtml = `
        <div style="font-family: 'Manrope', sans-serif; min-width: 260px; color: #EEF3FB; background: #0D1829; padding: 14px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 20px 35px rgba(0,0,0,0.6);">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; margin-bottom: 8px;">
            <div>
              <div style="font-size: 15px; font-weight: 900; color: #EEF3FB; letter-spacing: -0.02em;">${s.name}</div>
              <div style="font-size: 11px; color: #9FB0C8; font-weight: 600;">${district}, ${s.state}</div>
            </div>
            <span style="font-size: 10px; font-weight: 900; padding: 3px 10px; border-radius: 9999px; background: ${color}20; color: ${color}; border: 1px solid ${color}; text-transform: uppercase;">
              ${s.risk_level}
            </span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; font-size: 11px; line-height: 1.4; margin-bottom: 10px;">
            <div><span style="color: #9FB0C8;">1. Station:</span> <b style="color: #EEF3FB;">${s.name}</b></div>
            <div><span style="color: #9FB0C8;">2. State:</span> <b style="color: #EEF3FB;">${s.state}</b></div>
            <div><span style="color: #9FB0C8;">3. District:</span> <b style="color: #EEF3FB;">${district}</b></div>
            <div><span style="color: #9FB0C8;">4. Latitude:</span> <b style="color: #EEF3FB;">${s.latitude.toFixed(2)}°N</b></div>
            <div><span style="color: #9FB0C8;">5. Longitude:</span> <b style="color: #EEF3FB;">${s.longitude.toFixed(2)}°E</b></div>
            <div><span style="color: #9FB0C8;">6. 24h Rain:</span> <b style="color: #FF6A2B;">${rainfall} mm</b></div>
            <div><span style="color: #9FB0C8;">7. Soil Moisture:</span> <b style="color: #38BDF8;">${soilMoisture}%</b></div>
            <div><span style="color: #9FB0C8;">8. Vibration:</span> <b style="color: #EEF3FB;">${vibration} mm/s</b></div>
            <div><span style="color: #9FB0C8;">9. Slope Movement:</span> <b style="color: #EEF3FB;">${slopeMovement}° (tilt ${tilt}°)</b></div>
            <div><span style="color: #9FB0C8;">10. AI Probability:</span> <b style="color: #FF6A2B;">${aiProb}%</b></div>
            <div><span style="color: #9FB0C8;">11. Risk Category:</span> <b style="color: ${color}; font-weight: 800;">${s.risk_level}</b></div>
            <div><span style="color: #9FB0C8;">12. Last Updated:</span> <b style="color: #EEF3FB;">${updatedTime}</b></div>
          </div>

          <div style="font-size: 10px; color: #9FB0C8; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #22C55E; font-weight: 700;">● IoT Sensor Online</span>
            <span style="color: #FF6A2B; font-weight: 700;">NER GIS Network</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 320,
        className: 'custom-leaflet-popup',
      });

      marker.on('click', () => {
        setSelectedStation(s);
      });

      markersGroup.addLayer(marker);
    });
  }, [filteredStations, selectedStation]);

  // Controls Handlers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  const handleReset = () => {
    if (geoJsonLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(geoJsonLayerRef.current.getBounds(), { padding: [20, 20] });
    } else {
      mapInstanceRef.current?.setView([26.0, 93.0], 5);
    }
    setSelectedState('All');
    setSelectedRisk('All');
    setQuickFilter('all');
    setSearchQuery('');
  };

  const handleLocate = () => {
    if (selectedStation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedStation.latitude, selectedStation.longitude], 10, {
        duration: 1.2,
      });
    }
  };

  const toggleFullscreen = () => {
    if (!mapCardRef.current) return;
    if (!document.fullscreenElement) {
      mapCardRef.current.requestFullscreen().catch(() => {
        setIsFullscreen(!isFullscreen);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 250);
  };

  // Selected station readings for the side panel
  const selectedDistrict = selectedStation ? (STATION_DISTRICTS[selectedStation.name] || selectedStation.state) : '';
  const selectedReading = selectedStation?.latest_reading || {};
  const selectedRain = selectedReading.rainfall_mm ?? selectedStation?.rain ?? 0;
  const selectedSoil = selectedReading.soil_moisture_pct ?? selectedStation?.soil ?? 0;
  const selectedVib = selectedReading.vibration_mms ?? selectedStation?.vib ?? 0;
  const selectedSlope = selectedReading.slope_deg ?? selectedStation?.slope ?? 0;
  const selectedTilt = selectedReading.tilt_deg ?? selectedStation?.tilt ?? 0;
  const selectedProb = selectedStation?.ai_probability ?? 0;
  const selectedUpdated = selectedReading.timestamp
    ? new Date(selectedReading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Live Stream';

  return (
    <div className="space-y-4">
      {/* Title & Legend Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-accent" />
            <span>{t('nav.map', 'Northeast India Real GIS Landslide Risk Map')}</span>
          </h2>
          <p className="text-xs text-ink-soft">
            Accurate administrative boundaries from geoBoundaries & live OpenStreetMap tiles across all 8 Northeast states
          </p>
        </div>

        {/* Risk Level Legend */}
        <div className="flex items-center gap-2 flex-wrap text-xs bg-[#0D1829] px-3.5 py-2 rounded-2xl border border-white/10 shadow-lg">
          <span className="text-ink-soft font-bold text-[11px] mr-1 uppercase tracking-wider">Risk Standard:</span>
          {Object.entries(RISK_COLORS).map(([lvl, col]) => (
            <div key={lvl} className="flex items-center gap-1.5 font-bold">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col }}></span>
              <span className="text-[11px] text-ink">{lvl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Controls Bar (Phase 6) */}
      <div className="bg-white/[0.04] p-3.5 rounded-2xl border border-white/10 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* State filter */}
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-1">
              {t('common.state', 'State Selection')}
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-[#0D1829] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:border-accent"
            >
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? t('common.allStates', 'All 8 Northeast States') : s}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level filter */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-1">
              {t('common.riskLevel', 'Risk Level Filter')}
            </label>
            <select
              value={selectedRisk}
              onChange={(e) => {
                setSelectedRisk(e.target.value);
                setQuickFilter('all');
              }}
              className="w-full bg-[#0D1829] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-ink focus:outline-none focus:border-accent"
            >
              {RISK_LEVELS.map((r) => (
                <option key={r} value={r}>
                  {r === 'All' ? 'All Risk Levels' : `${r} Risk`}
                </option>
              ))}
            </select>
          </div>

          {/* Location search */}
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold text-ink-soft uppercase tracking-wider mb-1">
              {t('common.searchStation', 'Search Location / District / Station')}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-soft absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Shillong, Cherrapunji, Kamrup, Kohima..."
                className="w-full bg-[#0D1829] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-ink placeholder-ink-soft/40 focus:outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* Quick Filter Pill Buttons (Phase 6) */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-white/5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-ink-soft uppercase mr-1">Quick Filters:</span>
            <button
              type="button"
              onClick={() => {
                setQuickFilter('all');
                setSelectedRisk('All');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                quickFilter === 'all' && selectedRisk === 'All'
                  ? 'bg-accent text-white shadow-md'
                  : 'bg-white/5 text-ink-soft hover:text-white border border-white/5'
              }`}
            >
              Show All Stations ({stations.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setQuickFilter('high');
                setSelectedRisk('All');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                quickFilter === 'high'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : 'bg-white/5 text-[#FB923C] hover:bg-orange-500/10 border border-orange-500/20'
              }`}
            >
              High Risk Only
            </button>
            <button
              type="button"
              onClick={() => {
                setQuickFilter('critical');
                setSelectedRisk('All');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                quickFilter === 'critical'
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/25'
                  : 'bg-white/5 text-[#EF4444] hover:bg-red-500/10 border border-red-500/20'
              }`}
            >
              Critical Risk Only
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-ink text-xs font-bold border border-white/10 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3 text-accent" />
            <span>Reset Filters & Zoom</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map (2fr) + Station Information Panel (1fr) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Leaflet Map Card (Phase 7 & Phase 8) */}
        <div
          ref={mapCardRef}
          className={`lg:col-span-2 relative bg-white/[0.06] border border-white/[0.12] rounded-3xl overflow-hidden shadow-2xl ${
            isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
          }`}
        >
          {/* Actual Leaflet Map Canvas */}
          <div
            ref={mapContainerRef}
            className={`w-full z-10 ${isFullscreen ? 'h-screen' : 'h-[500px] sm:h-[620px]'}`}
          />

          {/* Map Controls Overlay (Top Right) */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            <button
              onClick={handleZoomIn}
              className="p-2.5 rounded-xl bg-[#0D1829]/95 hover:bg-[#101C30] text-ink border border-white/20 shadow-xl backdrop-blur-md transition-all active:scale-95"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2.5 rounded-xl bg-[#0D1829]/95 hover:bg-[#101C30] text-ink border border-white/20 shadow-xl backdrop-blur-md transition-all active:scale-95"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleLocate}
              className="p-2.5 rounded-xl bg-[#0D1829]/95 hover:bg-[#101C30] text-accent border border-white/20 shadow-xl backdrop-blur-md transition-all active:scale-95"
              title="Center on Selected Station"
            >
              <Crosshair className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-2.5 rounded-xl bg-[#0D1829]/95 hover:bg-[#101C30] text-ink border border-white/20 shadow-xl backdrop-blur-md transition-all active:scale-95"
              title="Reset to Northeast India"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-[#0D1829]/95 hover:bg-[#101C30] text-ink border border-white/20 shadow-xl backdrop-blur-md transition-all active:scale-95"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-accent" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* GIS Status Banner (Bottom) */}
          <div className="p-3 bg-[#0A1220]/95 border-t border-white/10 text-xs text-ink-soft flex items-center justify-between flex-wrap gap-2 z-20 relative">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>
              <span>
                <b>OpenStreetMap GIS Layer</b> · Genuine geoBoundaries (8 NE States)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-ink-soft">
                Source: <span className="text-accent font-mono">{geoJsonSource}</span>
              </span>
              <span className="font-extrabold text-ink bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                {filteredStations.length} / {stations.length} stations visible
              </span>
            </div>
          </div>
        </div>

        {/* Station Detail Information Panel (Phase 5 - 12 Fields) */}
        <Card className="lg:col-span-1 space-y-4">
          {selectedStation ? (
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-xl font-black text-ink">{selectedStation.name}</h3>
                  <div className="text-xs text-ink-soft flex items-center gap-1 mt-0.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>
                      {selectedDistrict}, {selectedStation.state}
                    </span>
                  </div>
                </div>
                <RiskBadge level={selectedStation.risk_level} />
              </div>

              {/* 12 Required Geotechnical Fields List */}
              <div className="divide-y divide-white/5 text-xs my-3 space-y-0">
                <div className="py-2 flex items-center justify-between">
                  <span className="text-ink-soft">1. Station Name</span>
                  <span className="font-bold text-ink">{selectedStation.name}</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-ink-soft">2. State</span>
                  <span className="font-bold text-ink">{selectedStation.state}</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-ink-soft">3. District</span>
                  <span className="font-bold text-ink">{selectedDistrict}</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-ink-soft">4. Latitude</span>
                  <span className="font-mono font-bold text-ink">{selectedStation.latitude.toFixed(4)}°N</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-ink-soft">5. Longitude</span>
                  <span className="font-mono font-bold text-ink">{selectedStation.longitude.toFixed(4)}°E</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-ink-soft">6. Rainfall (24 h)</span>
                  <span className="font-bold text-accent">{selectedRain} mm</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-ink-soft">7. Soil Moisture</span>
                  <span className="font-bold text-sky-400">{selectedSoil}%</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-ink-soft">8. Ground Vibration</span>
                  <span className="font-bold text-ink">{selectedVib} mm/s</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-ink-soft">9. Slope Movement</span>
                  <span className="font-bold text-ink">{selectedSlope}° (tilt {selectedTilt}°)</span>
                </div>
                <div className="py-2 flex items-center justify-between bg-white/[0.03] px-2 rounded-lg">
                  <span className="text-accent font-extrabold">10. AI Landslide Prob.</span>
                  <span className="font-black text-ink text-sm">{selectedProb}%</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-ink-soft">11. Risk Category</span>
                  <span
                    className="font-black text-xs uppercase"
                    style={{ color: RISK_COLORS[selectedStation.risk_level] || '#22C55E' }}
                  >
                    {selectedStation.risk_level}
                  </span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-ink-soft">12. Last Updated</span>
                  <span className="font-mono text-[11px] text-ink-soft">{selectedUpdated}</span>
                </div>
              </div>

              {/* Recommended Safety Action */}
              <div className="p-3.5 rounded-2xl bg-[#0D1829] border border-white/10 space-y-1.5 mt-3">
                <div className="text-[11px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Recommended Safety Action</span>
                </div>
                <p className="text-xs text-ink-soft leading-relaxed">
                  {selectedStation.risk_level === 'CRITICAL' &&
                    'Immediate emergency response required. High slope displacement detected. Evacuate unstable slope corridors immediately.'}
                  {selectedStation.risk_level === 'HIGH' &&
                    'Prepare for possible evacuation. Keep emergency go-bags ready and avoid cut hill slopes and stream ravines.'}
                  {selectedStation.risk_level === 'MODERATE' &&
                    'Increased vigilance required. Inspect culverts, hill retaining walls, and drainage outlets after rainfall.'}
                  {selectedStation.risk_level === 'LOW' &&
                    'Normal baseline conditions. Routine automated telemetry acquisition and sensor verification.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleLocate}
                  className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-accent/25"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Center map on this station</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-ink-soft space-y-2">
              <Compass className="w-10 h-10 text-accent/50 mx-auto animate-pulse" />
              <p className="font-bold text-ink">Select a Monitoring Station</p>
              <p className="text-[11px] max-w-xs mx-auto">
                Click any colored circular marker on the map to inspect its 12 geotechnical telemetry readings, AI risk prediction, and emergency measures.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
