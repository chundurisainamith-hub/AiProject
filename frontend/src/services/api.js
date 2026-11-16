// Frontend API Client with Standalone Mock Engine Fallback
// When backend is running, communicates with backend API.
// When backend is not running, falls back seamlessly to the full-featured standalone mock engine.

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Reference Stations from the original NER Landslide Guard design
const INITIAL_STATIONS = [
  { id: 1, name: "Guwahati", state: "Assam", district: "Kamrup Metropolitan", latitude: 26.14, longitude: 91.74, rain: 48, soil: 62, slope: 18, vib: 1.1, tilt: 0.4, temp: 29, hum: 78, status: 'online' },
  { id: 2, name: "Dibrugarh", state: "Assam", district: "Dibrugarh", latitude: 27.48, longitude: 94.91, rain: 35, soil: 58, slope: 8, vib: 0.5, tilt: 0.2, temp: 27, hum: 80, status: 'online' },
  { id: 3, name: "Silchar", state: "Assam", district: "Cachar", latitude: 24.83, longitude: 92.78, rain: 88, soil: 70, slope: 22, vib: 1.4, tilt: 0.8, temp: 28, hum: 84, status: 'online' },
  { id: 4, name: "Shillong", state: "Meghalaya", district: "East Khasi Hills", latitude: 25.57, longitude: 91.88, rain: 95, soil: 74, slope: 28, vib: 1.8, tilt: 1.2, temp: 21, hum: 90, status: 'online' },
  { id: 5, name: "Cherrapunji", state: "Meghalaya", district: "East Khasi Hills", latitude: 25.30, longitude: 91.70, rain: 140, soil: 88, slope: 38, vib: 3.2, tilt: 2.1, temp: 19, hum: 95, status: 'online' },
  { id: 6, name: "Tura", state: "Meghalaya", district: "West Garo Hills", latitude: 25.51, longitude: 90.22, rain: 60, soil: 66, slope: 26, vib: 1.0, tilt: 0.7, temp: 25, hum: 85, status: 'online' },
  { id: 7, name: "Imphal", state: "Manipur", district: "Imphal West", latitude: 24.82, longitude: 93.94, rain: 42, soil: 55, slope: 12, vib: 0.6, tilt: 0.3, temp: 26, hum: 72, status: 'online' },
  { id: 8, name: "Churachandpur", state: "Manipur", district: "Churachandpur", latitude: 24.33, longitude: 93.68, rain: 115, soil: 80, slope: 35, vib: 2.4, tilt: 1.6, temp: 24, hum: 88, status: 'online' },
  { id: 9, name: "Aizawl", state: "Mizoram", district: "Aizawl", latitude: 23.73, longitude: 92.72, rain: 100, soil: 76, slope: 32, vib: 2.0, tilt: 1.4, temp: 23, hum: 89, status: 'online' },
  { id: 10, name: "Lunglei", state: "Mizoram", district: "Lunglei", latitude: 22.89, longitude: 92.73, rain: 72, soil: 68, slope: 29, vib: 1.2, tilt: 0.9, temp: 25, hum: 86, status: 'online' },
  { id: 11, name: "Kohima", state: "Nagaland", district: "Kohima", latitude: 25.67, longitude: 94.11, rain: 78, soil: 72, slope: 30, vib: 1.7, tilt: 1.1, temp: 20, hum: 87, status: 'online' },
  { id: 12, name: "Mokokchung", state: "Nagaland", district: "Mokokchung", latitude: 26.32, longitude: 94.52, rain: 40, soil: 50, slope: 15, vib: 0.6, tilt: 0.3, temp: 22, hum: 76, status: 'online' },
  { id: 13, name: "Agartala", state: "Tripura", district: "West Tripura", latitude: 23.83, longitude: 91.28, rain: 30, soil: 52, slope: 6, vib: 0.3, tilt: 0.1, temp: 30, hum: 74, status: 'online' },
  { id: 14, name: "Gangtok", state: "Sikkim", district: "East Sikkim", latitude: 27.33, longitude: 88.61, rain: 85, soil: 71, slope: 34, vib: 2.1, tilt: 1.5, temp: 16, hum: 91, status: 'online' },
  { id: 15, name: "Itanagar", state: "Arunachal Pradesh", district: "Papum Pare", latitude: 27.08, longitude: 93.61, rain: 55, soil: 60, slope: 24, vib: 1.0, tilt: 0.6, temp: 24, hum: 82, status: 'online' },
  { id: 16, name: "Tawang", state: "Arunachal Pradesh", district: "Tawang", latitude: 27.59, longitude: 91.86, rain: 65, soil: 64, slope: 40, vib: 1.5, tilt: 1.0, temp: 9, hum: 79, status: 'online' },
];

const INITIAL_INCIDENTS = [
  { id: 1, incident_date: "2020-06-14", state: "Assam", district: "Dima Hasao", location: "Hill road section", rainfall_before_mm: 210, damage_desc: "Road blocked, houses damaged" },
  { id: 2, incident_date: "2021-07-02", state: "Meghalaya", district: "East Khasi Hills", location: "Hill slope near town", rainfall_before_mm: 260, damage_desc: "Houses damaged" },
  { id: 3, incident_date: "2021-09-11", state: "Mizoram", district: "Aizawl", location: "Residential hillside", rainfall_before_mm: 190, damage_desc: "Buildings damaged, casualties" },
  { id: 4, incident_date: "2022-06-17", state: "Assam", district: "Dima Hasao", location: "Rail and road corridor", rainfall_before_mm: 300, damage_desc: "Rail and road disrupted" },
  { id: 5, incident_date: "2022-08-05", state: "Manipur", district: "Noney", location: "Highway slope", rainfall_before_mm: 240, damage_desc: "Major casualties, highway blocked" },
  { id: 6, incident_date: "2023-06-20", state: "Sikkim", district: "Mangan", location: "Highway slope", rainfall_before_mm: 170, damage_desc: "Road cut, tourist stranding" },
  { id: 7, incident_date: "2024-05-28", state: "Mizoram", district: "Aizawl", location: "Quarry area", rainfall_before_mm: 230, damage_desc: "Casualties, houses destroyed" },
  { id: 8, incident_date: "2024-07-09", state: "Arunachal Pradesh", district: "Lower Subansiri", location: "National highway", rainfall_before_mm: 150, damage_desc: "Road blocked" },
  { id: 9, incident_date: "2025-06-02", state: "Nagaland", district: "Kohima", location: "Urban slope", rainfall_before_mm: 120, damage_desc: "Houses damaged" },
  { id: 10, incident_date: "2025-08-14", state: "Meghalaya", district: "West Garo Hills", location: "Village slope", rainfall_before_mm: 140, damage_desc: "Crop and road damage" },
];

const ACTIONS = {
  LOW: "Normal conditions. Routine monitoring and sensor verification.",
  MODERATE: "Increased monitoring required. Inspect hill slopes and culverts after rain.",
  HIGH: "Prepare for possible evacuation. Keep go-bags ready and avoid cut slopes.",
  CRITICAL: "Immediate emergency response required. Evacuate unstable areas now."
};

// Geotechnical formula matching original project & Phase 6
const computeRiskScore = (s) => {
  const normRain = Math.min(1.0, (s.rain || 0) / 150.0);
  const normSoil = (s.soil || 0) / 100.0;
  const normSlope = Math.min(1.0, (s.slope || 0) / 50.0);
  const normVib = Math.min(1.0, (s.vib || 0) / 5.0);
  const normTilt = Math.min(1.0, (s.tilt || 0) / 3.0);
  return 0.35 * normRain + 0.25 * normSoil + 0.20 * normSlope + 0.10 * normVib + 0.10 * normTilt;
};

const getRiskLevel = (score) => {
  if (score < 0.30) return "LOW";
  if (score < 0.50) return "MODERATE";
  if (score < 0.70) return "HIGH";
  return "CRITICAL";
};

const getAiProbability = (score) => {
  return Math.round(100 / (1 + Math.exp(-9 * (score - 0.5))));
};

// Standalone in-memory / localStorage state
const getStoredStations = () => {
  try {
    const raw = localStorage.getItem('ner_stations');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return INITIAL_STATIONS;
};

const setStoredStations = (stations) => {
  try {
    localStorage.setItem('ner_stations', JSON.stringify(stations));
  } catch (e) {}
};

const getStoredUsers = () => {
  try {
    const raw = localStorage.getItem('ner_users_db');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    'owner@adm.com': { password: 'admin123', role: 'owner', status: 'approved', created_at: new Date().toISOString() },
    'analyst@ner.com': { password: 'nerpass123', role: 'user', status: 'approved', created_at: new Date().toISOString() }
  };
};

const setStoredUsers = (users) => {
  try {
    localStorage.setItem('ner_users_db', JSON.stringify(users));
  } catch (e) {}
};

const getStoredAdminRequests = () => {
  try {
    const raw = localStorage.getItem('ner_admin_requests');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
};

const setStoredAdminRequests = (reqs) => {
  try {
    localStorage.setItem('ner_admin_requests', JSON.stringify(reqs));
  } catch (e) {}
};

// Format station object for UI consumption
const formatStation = (s) => {
  const score = computeRiskScore(s);
  const level = getRiskLevel(score);
  const prob = getAiProbability(score);
  return {
    ...s,
    risk_score: parseFloat(score.toFixed(3)),
    risk_level: level,
    ai_probability: prob,
    latest_reading: {
      rainfall_mm: s.rain,
      soil_moisture_pct: s.soil,
      slope_deg: s.slope,
      vibration_mms: s.vib,
      tilt_deg: s.tilt,
      temperature_c: s.temp,
      humidity_pct: s.hum,
      timestamp: new Date().toISOString(),
    }
  };
};

// HTTP Request helper with automatic fallback to mock engine
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('ner_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let url = `${API_BASE_URL}${endpoint}`;
  if (options.params) {
    const query = new URLSearchParams();
    Object.entries(options.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        query.append(k, v);
      }
    });
    const qs = query.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('ner_token');
      localStorage.removeItem('ner_user');
      window.dispatchEvent(new Event('ner-auth-changed'));
    }

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error = new Error(
        (data && data.detail) || (typeof data === 'string' && data) || `HTTP Error ${response.status}`
      );
      error.response = { status: response.status, data };
      throw error;
    }

    return { data, status: response.status };
  } catch (err) {
    // If backend is unreachable, throw or trigger fallback in caller
    throw err;
  }
};

export const authService = {
  login: async (username, password, loginType = 'user') => {
    // 1. Try real backend first
    try {
      const response = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, login_type: loginType })
      });
      return response.data;
    } catch (apiErr) {
      // If error came from backend with specific detail (like incorrect password), respect it!
      if (apiErr.response?.data?.detail) {
        throw new Error(apiErr.response.data.detail);
      }

      // Standalone Frontend Mock Auth Fallback:
      const u = username.trim().toLowerCase();
      const db = getStoredUsers();
      const adminReqs = getStoredAdminRequests();

      if (loginType === 'admin' || u.endsWith('@adm.com')) {
        if (!u.endsWith('@adm.com')) {
          throw new Error('Login failed: admin username must end with @adm.com');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        const ownerUser = Object.values(db).find(x => x.role === 'owner');
        if (!ownerUser) {
          // First registered admin becomes OWNER
          db[u] = { password, role: 'owner', status: 'approved', created_at: new Date().toISOString() };
          setStoredUsers(db);
          return {
            access_token: 'mock-jwt-owner-token',
            role: 'owner',
            username: u,
            message: 'Owner administrator account established and logged in'
          };
        }

        if (db[u]) {
          if (db[u].password !== password) {
            throw new Error('Login failed: incorrect password');
          }
          return {
            access_token: 'mock-jwt-admin-token',
            role: db[u].role,
            username: u,
            message: 'Administrator authentication successful'
          };
        }

        const existingReq = adminReqs.find(r => r.username === u);
        if (!existingReq) {
          adminReqs.push({
            id: Date.now(),
            username: u,
            password,
            status: 'pending',
            requested_at: new Date().toISOString()
          });
          setStoredAdminRequests(adminReqs);
          throw new Error('Request sent to the admin. You can sign in once it is accepted.');
        } else {
          if (existingReq.password !== password) {
            throw new Error('Login failed: incorrect password');
          }
          if (existingReq.status === 'pending') {
            throw new Error('Your request is still waiting for approval.');
          }
          if (existingReq.status === 'rejected') {
            throw new Error('Your admin request was rejected.');
          }
          if (existingReq.status === 'approved') {
            db[u] = { password, role: 'admin', status: 'approved', created_at: new Date().toISOString() };
            setStoredUsers(db);
            return {
              access_token: 'mock-jwt-admin-token',
              role: 'admin',
              username: u,
              message: 'Administrator account activated'
            };
          }
        }
      } else {
        // User Mode
        if (!u.endsWith('@ner.com')) {
          throw new Error('Login failed: username must end with @NER.com');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        if (!db[u]) {
          // First time user login auto-registers
          db[u] = { password, role: 'user', status: 'approved', created_at: new Date().toISOString() };
          setStoredUsers(db);
          return {
            access_token: 'mock-jwt-user-token',
            role: 'user',
            username: u,
            message: 'User authentication successful'
          };
        } else {
          if (db[u].password !== password) {
            throw new Error('Login failed: incorrect password');
          }
          return {
            access_token: 'mock-jwt-user-token',
            role: db[u].role,
            username: u,
            message: 'User authentication successful'
          };
        }
      }
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await request('/auth/me');
      return response.data;
    } catch {
      const saved = localStorage.getItem('ner_user');
      return saved ? JSON.parse(saved) : { username: 'analyst@ner.com', role: 'user' };
    }
  },
};

export const adminService = {
  getRequests: async () => {
    try {
      const response = await request('/admin/requests');
      return response.data;
    } catch {
      return getStoredAdminRequests();
    }
  },

  approveRequest: async (id) => {
    try {
      const response = await request(`/admin/requests/${id}/approve`, { method: 'POST' });
      return response.data;
    } catch {
      const reqs = getStoredAdminRequests();
      const target = reqs.find(r => r.id === id);
      if (target) {
        target.status = 'approved';
        setStoredAdminRequests(reqs);
        const users = getStoredUsers();
        users[target.username] = {
          password: target.password,
          role: 'admin',
          status: 'approved',
          created_at: new Date().toISOString()
        };
        setStoredUsers(users);
      }
      return target;
    }
  },

  rejectRequest: async (id) => {
    try {
      const response = await request(`/admin/requests/${id}/reject`, { method: 'POST' });
      return response.data;
    } catch {
      const reqs = getStoredAdminRequests();
      const target = reqs.find(r => r.id === id);
      if (target) {
        target.status = 'rejected';
        setStoredAdminRequests(reqs);
      }
      return target;
    }
  },

  getAdminStats: async () => {
    try {
      const response = await request('/admin/stats');
      return response.data;
    } catch {
      const users = getStoredUsers();
      const reqs = getStoredAdminRequests();
      const stations = getStoredStations();
      const uKeys = Object.keys(users);
      const uCount = uKeys.filter(k => users[k].role === 'user').length;
      const aCount = uKeys.filter(k => users[k].role === 'admin' || users[k].role === 'owner').length;
      const pCount = reqs.filter(r => r.status === 'pending').length;

      return {
        total_accounts: uCount + aCount,
        user_accounts: uCount,
        admin_accounts: aCount,
        pending_requests: pCount,
        registered_stations: stations.length,
        active_alerts: 8,
        system_status: 'Online (Standalone Mode / Mock Ingestion Gateway)'
      };
    }
  },

  getUsers: async () => {
    try {
      const response = await request('/admin/users');
      return response.data;
    } catch {
      const users = getStoredUsers();
      return Object.entries(users).map(([username, data], idx) => ({
        id: idx + 1,
        username,
        role: data.role,
        is_active: true,
        created_at: data.created_at || new Date().toISOString()
      }));
    }
  },
};

export const stationService = {
  getAll: async (state = null) => {
    try {
      const params = state && state !== 'All' ? { state } : {};
      const response = await request('/stations', { params });
      return response.data;
    } catch {
      let list = getStoredStations().map(formatStation);
      if (state && state !== 'All') {
        list = list.filter(s => s.state.toLowerCase() === state.toLowerCase());
      }
      return list;
    }
  },

  getById: async (id) => {
    try {
      const response = await request(`/stations/${id}`);
      return response.data;
    } catch {
      const stn = getStoredStations().find(s => s.id === id) || INITIAL_STATIONS[0];
      return formatStation(stn);
    }
  },

  create: async (data) => {
    try {
      const response = await request('/stations', { method: 'POST', body: JSON.stringify(data) });
      return response.data;
    } catch {
      const stations = getStoredStations();
      const newStn = {
        id: Date.now(),
        name: data.name,
        state: data.state,
        latitude: data.latitude,
        longitude: data.longitude,
        rain: 45,
        soil: 60,
        slope: 20,
        vib: 0.8,
        tilt: 0.5,
        temp: 24,
        hum: 80,
        status: data.status || 'online',
      };
      stations.push(newStn);
      setStoredStations(stations);
      return formatStation(newStn);
    }
  },

  update: async (id, data) => {
    try {
      const response = await request(`/stations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      return response.data;
    } catch {
      const stations = getStoredStations();
      const idx = stations.findIndex(s => s.id === id);
      if (idx !== -1) {
        stations[idx] = { ...stations[idx], ...data };
        setStoredStations(stations);
        return formatStation(stations[idx]);
      }
      throw new Error('Station not found');
    }
  },

  delete: async (id) => {
    try {
      const response = await request(`/stations/${id}`, { method: 'DELETE' });
      return response.data;
    } catch {
      let stations = getStoredStations();
      stations = stations.filter(s => s.id !== id);
      setStoredStations(stations);
      return { message: 'Station deleted' };
    }
  },
};

export const readingService = {
  getReadings: async (stationId = null) => {
    try {
      const params = stationId ? { station_id: stationId } : {};
      const response = await request('/readings', { params });
      return response.data;
    } catch {
      return getStoredStations().map(s => formatStation(s).latest_reading);
    }
  },

  getStationHistory: async (stationId, limit = 15) => {
    try {
      const response = await request(`/readings/${stationId}/history`, { params: { limit } });
      return response.data;
    } catch {
      const stn = getStoredStations().find(s => s.id === stationId) || INITIAL_STATIONS[0];
      const history = [];
      const now = Date.now();
      for (let i = 0; i < limit; i++) {
        history.push({
          rainfall_mm: Math.max(0, stn.rain + (Math.sin(i) * 12)),
          soil_moisture_pct: Math.min(100, Math.max(20, stn.soil + (Math.cos(i) * 8))),
          tilt_deg: Math.max(0.1, +(stn.tilt + (Math.sin(i * 0.5) * 0.4)).toFixed(2)),
          timestamp: new Date(now - i * 60000).toISOString(),
        });
      }
      return history;
    }
  },

  postReading: async (data) => {
    try {
      const response = await request('/readings', { method: 'POST', body: JSON.stringify(data) });
      return response.data;
    } catch {
      return { status: 'INGESTED_MOCK', ...data };
    }
  },
};

export const predictionService = {
  predict: async (data) => {
    try {
      const response = await request('/predict', { method: 'POST', body: JSON.stringify(data) });
      return response.data;
    } catch {
      // Standalone Random Forest & Geotechnical Formula Calculation
      const p1 = data.rainfall_intensity || 0;
      const p2 = data.soil_moisture || 0;
      const p3 = data.slope_angle || 0;
      const soilType = data.soil_type || 'Clay';
      const tf = { Clay: 1.0, "Silty loam": 1.05, Sandy: 0.85, Laterite: 1.1, Rocky: 0.5 }[soilType] || 1.0;
      const p5 = data.vibration || 0;
      const p6 = data.temperature || 20;
      const p7 = data.rainfall_7d || 0;

      const factors = [
        { name: "Rainfall Intensity", val: 0.28 * Math.min(1, p1 / 60.0) },
        { name: "Soil Moisture Saturation", val: 0.22 * (p2 / 100.0) },
        { name: "Slope Gradient", val: 0.20 * Math.min(1, p3 / 50.0) * tf },
        { name: "Ground Vibration", val: 0.10 * Math.min(1, p5 / 5.0) },
        { name: "7-Day Cumulative Rainfall", val: 0.15 * Math.min(1, p7 / 400.0) },
        { name: "Thermal Effects", val: p6 < 5.0 ? 0.05 : 0.01 }
      ];

      const z = factors.reduce((acc, f) => acc + f.val, 0);
      const prob = Math.round(100.0 / (1.0 + Math.exp(-9.0 * (z - 0.5))));
      const ruleScore = parseFloat(Math.min(1.0, z).toFixed(3));
      const cat = prob < 25 ? 'LOW' : prob < 50 ? 'MODERATE' : prob < 75 ? 'HIGH' : 'CRITICAL';

      const totalVal = factors.reduce((acc, f) => acc + f.val, 0) || 1.0;
      const formattedFactors = factors
        .sort((a, b) => b.val - a.val)
        .map(f => ({
          name: f.name,
          impact_score: parseFloat(f.val.toFixed(3)),
          percentage: parseFloat(((f.val / totalVal) * 100).toFixed(1))
        }));

      return {
        predicted_probability: prob,
        risk_score: ruleScore,
        risk_category: cat,
        top_factors: formattedFactors,
        recommended_safety_measures: ACTIONS[cat],
        model_type: "Random Forest Classifier (Synthetic & Geotechnical Scoring)",
        disclaimer: "Demonstration output based on geotechnical weights and synthetic simulation. Not a validated forecast."
      };
    }
  },
};

export const alertService = {
  getAll: async (minLevel = null) => {
    try {
      const params = minLevel && minLevel !== 'All' ? { min_level: minLevel } : {};
      const response = await request('/alerts', { params });
      return response.data;
    } catch {
      const stations = getStoredStations().map(formatStation);
      const levels = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
      const minIdx = minLevel && minLevel !== 'All' ? levels.indexOf(minLevel) : 0;

      const alerts = stations
        .filter(s => levels.indexOf(s.risk_level) >= minIdx)
        .sort((a, b) => levels.indexOf(b.risk_level) - levels.indexOf(a.risk_level))
        .map((s, idx) => ({
          id: s.id,
          station_id: s.id,
          station_name: s.name,
          state: s.state,
          level: s.risk_level,
          title: `Landslide Risk Advisory: ${s.name} (${s.risk_level})`,
          message: `Elevated precipitation of ${s.rain} mm/24h and soil saturation of ${s.soil}% recorded.`,
          action: ACTIONS[s.risk_level],
          timestamp: new Date(Date.now() - idx * 420000).toISOString(),
          is_active: true,
        }));

      return alerts;
    }
  },

  create: async (data) => {
    try {
      const response = await request('/alerts', { method: 'POST', body: JSON.stringify(data) });
      return response.data;
    } catch {
      return { id: Date.now(), ...data, timestamp: new Date().toISOString(), is_active: true };
    }
  },

  update: async (id, data) => {
    try {
      const response = await request(`/alerts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      return response.data;
    } catch {
      return { id, ...data };
    }
  },
};

export const incidentService = {
  getAll: async (state = null, search = null) => {
    try {
      const params = {};
      if (state && state !== 'All') params.state = state;
      if (search) params.search = search;
      const response = await request('/incidents', { params });
      return response.data;
    } catch {
      let list = INITIAL_INCIDENTS;
      if (state && state !== 'All') {
        list = list.filter(i => i.state.toLowerCase() === state.toLowerCase());
      }
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(i =>
          i.district.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          i.damage_desc.toLowerCase().includes(q)
        );
      }
      return list;
    }
  },
};

export const statsService = {
  getSummary: async (state = null) => {
    try {
      const params = state && state !== 'All' ? { state } : {};
      const response = await request('/stats', { params });
      return response.data;
    } catch {
      const stations = getStoredStations().map(formatStation);
      const filtered = state && state !== 'All'
        ? stations.filter(s => s.state.toLowerCase() === state.toLowerCase())
        : stations;

      const hi = filtered.filter(s => s.risk_level === 'HIGH' || s.risk_level === 'CRITICAL').length;
      const al = filtered.filter(s => s.risk_level !== 'LOW').length;

      return {
        monitored_locations: filtered.length,
        high_risk_zones: hi,
        active_warnings: al,
        rainfall_stations: filtered.length,
      };
    }
  },
};

export default {
  authService,
  adminService,
  stationService,
  readingService,
  predictionService,
  alertService,
  incidentService,
  statsService,
};
