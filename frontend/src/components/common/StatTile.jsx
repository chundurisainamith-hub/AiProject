import React from 'react';

export const StatTile = ({ label, value, subtitle, icon: Icon, badge, className = '' }) => {
  return (
    <div
      className={`bg-white/[0.06] border border-white/[0.12] rounded-[18px] p-4 backdrop-blur-[10px] shadow-[0_10px_30px_rgba(0,0,0,0.25)] flex flex-col justify-between hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-accent/80" />}
      </div>

      <div className="flex items-baseline gap-2 my-1">
        <div className="text-2xl sm:text-[28px] font-extrabold text-ink tracking-tight">{value}</div>
        {badge && <div>{badge}</div>}
      </div>

      {subtitle && <div className="text-xs text-ink-soft truncate mt-0.5">{subtitle}</div>}
    </div>
  );
};
