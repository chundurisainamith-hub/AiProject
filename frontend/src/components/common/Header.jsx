import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { AVAILABLE_LANGUAGES } from '../../i18n';
import { LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';

export const Header = () => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('ner_lang', langCode);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0A1220]/90 backdrop-blur-md border-b border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between flex-wrap gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-wider text-ink">
              NER LANDSLIDE <i className="text-accent not-italic">GUARD</i>
            </span>
          </div>

          {/* Simulation disclaimer badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-[#FACC15] bg-[#FACC15]/10 border border-[#FACC15]/40 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15] animate-pulse"></span>
            {t('common.simulatedBadge', 'SIMULATED DATA · DEMONSTRATION')}
          </span>
        </div>

        {/* Right side controls: Language switcher & Auth status */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* 6-Language selector chips */}
          <div className="flex items-center gap-1 bg-[#0D1829] p-1 rounded-xl border border-white/10 shadow-inner">
            {AVAILABLE_LANGUAGES.map((lang) => {
              const active = i18n.language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 ${
                    active
                      ? 'bg-accent text-white shadow-md'
                      : 'text-ink-soft hover:text-white hover:bg-white/5'
                  }`}
                  title={lang.label}
                >
                  {lang.native}
                </button>
              );
            })}
          </div>

          {/* User info & Sign out */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-ink-soft font-semibold">
                <UserIcon className="w-3.5 h-3.5 text-accent" />
                <span className="truncate max-w-[140px] sm:max-w-xs">{user.username}</span>
                {user.role !== 'user' && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/40">
                    {user.role}
                  </span>
                )}
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-ink-soft hover:text-white border border-white/10 transition-colors"
                title={t('nav.signOut', 'Sign out')}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('nav.signOut', 'Sign out')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
