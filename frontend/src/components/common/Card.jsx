import React from 'react';

export const Card = ({ children, className = '', title, subtitle, rightElement, ...props }) => {
  return (
    <div
      className={`bg-white/[0.06] border border-white/[0.12] rounded-[18px] p-4 sm:p-5 backdrop-blur-[10px] shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all ${className}`}
      {...props}
    >
      {(title || rightElement) && (
        <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-white/5">
          <div>
            {title && <h3 className="text-base sm:text-lg font-bold text-ink tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-ink-soft mt-0.5">{subtitle}</p>}
          </div>
          {rightElement && <div>{rightElement}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
