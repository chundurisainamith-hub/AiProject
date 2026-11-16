import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/common/Header';
import { Navbar } from '../components/common/Navbar';
import { AuthModal } from '../pages/AuthModal';

export const MainLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1220] flex items-center justify-center text-ink">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-ink-soft">Loading NER Landslide Guard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1220] text-ink flex flex-col selection:bg-accent selection:text-white">
      {/* If not signed in, show AuthModal lock screen */}
      {!isAuthenticated && <AuthModal />}

      {/* Main interface */}
      <Header />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-white/5 py-4 px-4 text-center text-xs text-ink-soft bg-[#070C16]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            NER LANDSLIDE GUARD © {new Date().getFullYear()} · North Eastern Region Disaster Warning System
          </span>
          <span className="text-accent/90 font-semibold">
            Emergency Helpline: 112 · NDMA: 1078
          </span>
        </div>
      </footer>
    </div>
  );
};
