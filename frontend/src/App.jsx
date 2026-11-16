import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { LiveRiskMap } from './pages/LiveRiskMap';
import { AIPrediction } from './pages/AIPrediction';
import { IoTMonitoring } from './pages/IoTMonitoring';
import { EarlyWarnings } from './pages/EarlyWarnings';
import { HistoricalData } from './pages/HistoricalData';
import { RiskManagement } from './pages/RiskManagement';
import { AboutProject } from './pages/AboutProject';
import { AdminPanel } from './pages/AdminPanel';

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="map" element={<LiveRiskMap />} />
        <Route path="predict" element={<AIPrediction />} />
        <Route path="iot" element={<IoTMonitoring />} />
        <Route path="alerts" element={<EarlyWarnings />} />
        <Route path="history" element={<HistoricalData />} />
        <Route path="response" element={<RiskManagement />} />
        <Route path="about" element={<AboutProject />} />
        <Route path="admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
