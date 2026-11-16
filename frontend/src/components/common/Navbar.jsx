import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  LayoutDashboard,
  MapPin,
  Cpu,
  Radio,
  AlertTriangle,
  History,
  ShieldCheck,
  Info,
  ShieldAlert
} from 'lucide-react';

export const Navbar = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  const navItems = [
    { to: '/', label: t('nav.home', 'Home'), icon: Home },
    { to: '/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { to: '/map', label: t('nav.map', 'Live Risk Map'), icon: MapPin },
    { to: '/predict', label: t('nav.predict', 'AI Prediction'), icon: Cpu },
    { to: '/iot', label: t('nav.iot', 'IoT Monitoring'), icon: Radio },
    { to: '/alerts', label: t('nav.alerts', 'Early Warnings'), icon: AlertTriangle },
    { to: '/history', label: t('nav.history', 'Historical Data'), icon: History },
    { to: '/response', label: t('nav.response', 'Risk Management'), icon: ShieldCheck },
    { to: '/about', label: t('nav.about', 'About Project'), icon: Info },
  ];

  if (isAdmin) {
    navItems.push({ to: '/admin', label: t('nav.admin', 'Admin Panel'), icon: ShieldAlert });
  }

  return (
    <nav className="bg-[#0A1220]/70 backdrop-blur-md border-b border-white/5 py-1 px-4 sticky top-[53px] z-30">
      <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-accent text-white shadow-lg shadow-accent/20 scale-[1.02]'
                    : 'text-ink-soft hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
