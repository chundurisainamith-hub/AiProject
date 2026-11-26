import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { AVAILABLE_LANGUAGES } from '../i18n';
import { ShieldCheck, UserCheck, Lock, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

export const AuthModal = () => {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();

  const [mode, setMode] = useState('user'); // 'user' | 'admin'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('ner_lang', langCode);
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setIsResetting(false);
    setError('');
    setNotice('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setNotice('');

    const cleanUser = username.trim();

    // Client-side quick checks matching original messages
    if (mode === 'user' && !cleanUser.toLowerCase().endsWith('@ner.com')) {
      setError(t('auth.errNerUsername', 'Login failed: username must end with @NER.com'));
      return;
    }

    if (mode === 'admin' && !cleanUser.toLowerCase().endsWith('@adm.com')) {
      setError(t('auth.errAdmUsername', 'Login failed: admin username must end with @adm.com'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.errPasswordLength', 'Password must be at least 6 characters'));
      return;
    }

    setSubmitting(true);
    try {
      if (isResetting) {
        await authService.resetPassword(cleanUser, password);
        setNotice('Password updated successfully! Logging you in...');
      }
      const res = await login(cleanUser, password, mode);
      if (res?.message && !res.user) {
        setNotice(res.message);
      }
    } catch (err) {
      const msg = err.message || 'Operation failed';
      // If it is a pending request notice (HTTP 202 or similar status message)
      if (msg.includes('Request sent') || msg.includes('waiting for approval')) {
        setNotice(msg);
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A1220]/95 backdrop-blur-xl overflow-y-auto">
      <div className="w-full max-w-md bg-white/[0.06] border border-white/[0.12] rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative my-auto">
        {/* Language selector chips at top */}
        <div className="flex items-center justify-center gap-1 mb-5 flex-wrap">
          {AVAILABLE_LANGUAGES.map((lang) => {
            const active = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                  active
                    ? 'bg-accent text-white shadow'
                    : 'bg-white/5 text-ink-soft hover:text-white border border-white/5'
                }`}
              >
                {lang.native}
              </button>
            );
          })}
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="font-extrabold text-xl sm:text-2xl tracking-wider text-ink">
            NER LANDSLIDE <i className="text-accent not-italic">GUARD</i>
          </div>
          <div className="text-xs text-ink-soft mt-1">
            {t('home.tagline', 'AI-Powered Landslide Prediction and Early Warning System')}
          </div>
        </div>

        {/* User / Admin Mode Toggle Tabs */}
        <div className="flex p-1 bg-[#0D1829] border border-white/10 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => handleModeSwitch('user')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mode === 'user' ? 'bg-accent text-white shadow-md' : 'text-ink-soft hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            {t('auth.userLogin', 'User login')}
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('admin')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mode === 'admin' ? 'bg-accent text-white shadow-md' : 'text-ink-soft hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {t('auth.adminLogin', 'Admin login')}
          </button>
        </div>

        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-lg font-bold text-ink">
            {isResetting ? 'Reset / Change Credentials' : t('auth.signIn', 'Sign in')}
          </h2>
          <button
            type="button"
            onClick={() => {
              setIsResetting(!isResetting);
              setError('');
              setNotice('');
            }}
            className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
          >
            <KeyRound className="w-3.5 h-3.5" />
            {isResetting ? 'Back to Sign in' : 'Forgot / Change?'}
          </button>
        </div>

        <p className="text-xs text-ink-soft mb-5 leading-relaxed">
          {isResetting
            ? `Enter your ${mode === 'admin' ? '@adm.com admin' : '@ner.com user'} username and desired new password (min 6 chars) to save & sign in.`
            : mode === 'user'
            ? t(
                'auth.userHint',
                'Use your username ending in @NER.com. First time? Enter the password you want and it becomes your password; use the same one next time.'
              )
            : t(
                'auth.adminHint',
                'Admins must use @adm.com. The first admin becomes OWNER. Subsequent accounts submit an approval request.'
              )}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
              {t('auth.username', 'Username')}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={mode === 'user' ? 'name@NER.com' : 'namith@adm.com'}
              autoComplete="username"
              required
              className="w-full bg-[#0D1829] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-ink placeholder-ink-soft/40 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
              {isResetting ? 'New Password' : t('auth.password', 'Password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder', 'At least 6 characters')}
              autoComplete={isResetting ? 'new-password' : 'current-password'}
              required
              className="w-full bg-[#0D1829] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-ink placeholder-ink-soft/40 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-[#EF4444] animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Info / Notice Message (e.g., Pending request notification) */}
          {notice && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-xs font-bold text-[#FACC15] animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{notice}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-extrabold shadow-lg shadow-accent/25 transition-all duration-200 disabled:opacity-50"
          >
            {submitting
              ? t('common.loading', 'Processing...')
              : isResetting
              ? 'Save New Password & Sign In'
              : t('auth.signIn', 'Sign in')}
          </button>
        </form>


        <div className="mt-5 pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-ink-soft/80 leading-normal">
            {t(
              'auth.demoDisclaimer',
              'Demo only: accounts are authenticated by the backend API and persisted securely.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
