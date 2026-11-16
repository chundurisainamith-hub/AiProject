import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/common/Card';
import { RiskBadge } from '../components/common/RiskBadge';
import { alertService } from '../services/api';
import {
  AlertTriangle,
  PhoneCall,
  Bell,
  Mail,
  MessageSquare,
  ShieldAlert,
  Clock,
  Filter,
  CheckCircle2
} from 'lucide-react';

const ALERT_LEVELS = ['All', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

export const EarlyWarnings = () => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState([]);
  const [minLevel, setMinLevel] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const data = await alertService.getAll(minLevel);
        setAlerts(data || []);
      } catch (err) {
        console.error('Failed to load alerts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [minLevel]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-accent" />
            <span>{t('nav.alerts', 'Early Warnings & Disaster Alerts')}</span>
          </h2>
          <p className="text-xs text-ink-soft">
            Graded geotechnical warning bulletin for the 8 North Eastern states
          </p>
        </div>

        {/* Filter by Minimum Alert Level */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-ink-soft uppercase tracking-wider">
            {t('common.minAlertLevel', 'Minimum Level')}:
          </label>
          <select
            value={minLevel}
            onChange={(e) => setMinLevel(e.target.value)}
            className="bg-[#0D1829] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-ink focus:outline-none focus:border-accent"
          >
            {ALERT_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl === 'All' ? 'All alert levels' : `${lvl} and above`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alert Feed Cards */}
      <div className="space-y-3">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <Card
              key={alert.id}
              className="border-l-4"
              style={{
                borderLeftColor:
                  alert.level === 'CRITICAL'
                    ? '#EF4444'
                    : alert.level === 'HIGH'
                    ? '#FB923C'
                    : alert.level === 'MODERATE'
                    ? '#FACC15'
                    : '#22C55E',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <RiskBadge level={alert.level} />
                  <span className="text-base font-extrabold text-ink">{alert.station_name}</span>
                  <span className="text-xs text-ink-soft">· {alert.state}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-ink-soft">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  <span>
                    Issued: {new Date(alert.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              <div className="text-sm font-semibold text-ink mb-1">{alert.title}</div>
              <p className="text-xs text-ink-soft leading-relaxed mb-3">{alert.message}</p>

              <div className="p-3 rounded-xl bg-[#0D1829] border border-white/5 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-ink">Action Required: </span>
                  <span className="text-ink-soft">{alert.action}</span>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <p className="text-center py-6 text-xs text-ink-soft">
              No active warnings match the selected filter.
            </p>
          </Card>
        )}
      </div>

      {/* Emergency Contacts & Notification Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Emergency Contacts */}
        <Card title="Emergency Response Contacts">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/5">
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-accent" />
                <div>
                  <div className="text-xs font-bold text-ink">National Emergency Helpline</div>
                  <div className="text-[11px] text-ink-soft">Police, Fire, Ambulance & Disaster Response</div>
                </div>
              </div>
              <span className="text-lg font-black text-accent">112</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/5">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-[#FACC15]" />
                <div>
                  <div className="text-xs font-bold text-ink">NDMA Disaster Helpline</div>
                  <div className="text-[11px] text-ink-soft">National Disaster Management Authority</div>
                </div>
              </div>
              <span className="text-lg font-black text-[#FACC15]">1078</span>
            </div>

            <p className="text-[11px] text-ink-soft pt-1">
              For state-level dispatch, connect with the Assam (ASDMA), Meghalaya (SDMA), or Mizoram Disaster Management Authorities.
            </p>
          </div>
        </Card>

        {/* Multi-Channel Notification Pipeline */}
        <Card title="Multi-Channel Notification Architecture">
          <div className="space-y-2.5 text-xs text-ink-soft">
            <p className="leading-relaxed">
              The early warning engine triggers automated broadcasts to registered citizens and district authorities when risk transitions to HIGH or CRITICAL.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2.5 rounded-xl bg-[#0D1829] border border-white/10">
                <MessageSquare className="w-4 h-4 text-accent mx-auto mb-1" />
                <span className="font-bold text-ink block">SMS Gateway</span>
                <span className="text-[10px] text-ink-soft">Twilio / C-DAC</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0D1829] border border-white/10">
                <Mail className="w-4 h-4 text-accent mx-auto mb-1" />
                <span className="font-bold text-ink block">Email Dispatch</span>
                <span className="text-[10px] text-ink-soft">SMTP / SendGrid</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0D1829] border border-white/10">
                <Bell className="w-4 h-4 text-accent mx-auto mb-1" />
                <span className="font-bold text-ink block">Push Alerts</span>
                <span className="text-[10px] text-ink-soft">Web Push / PWA</span>
              </div>
            </div>

            <div className="text-[11px] text-yellow-400/90 pt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
              <span>Integrations run in simulated demonstration mode until gateway credentials are supplied.</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
