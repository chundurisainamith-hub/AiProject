import React from 'react';
import { useTranslation } from 'react-i18next';

export const RiskBadge = ({ level = 'LOW', className = '' }) => {
  const { t } = useTranslation();
  const normalizedLevel = String(level || 'LOW').toUpperCase();

  const config = {
    LOW: {
      bg: 'bg-[#22C55E]',
      color: 'text-[#0A1220]',
      label: t('risk.low', 'LOW'),
    },
    MODERATE: {
      bg: 'bg-[#FACC15]',
      color: 'text-[#0A1220]',
      label: t('risk.moderate', 'MODERATE'),
    },
    HIGH: {
      bg: 'bg-[#FB923C]',
      color: 'text-[#0A1220]',
      label: t('risk.high', 'HIGH'),
    },
    CRITICAL: {
      bg: 'bg-[#EF4444]',
      color: 'text-white',
      label: t('risk.critical', 'CRITICAL'),
    },
  }[normalizedLevel] || {
    bg: 'bg-gray-400',
    color: 'text-black',
    label: normalizedLevel,
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide shadow-sm ${config.bg} ${config.color} ${className}`}
    >
      {config.label}
    </span>
  );
};
