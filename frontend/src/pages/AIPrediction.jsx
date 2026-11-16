import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/common/Card';
import { RiskBadge } from '../components/common/RiskBadge';
import { predictionService } from '../services/api';
import { Cpu, AlertCircle, ShieldAlert, CheckCircle, Info } from 'lucide-react';

export const AIPrediction = () => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    rainfall_intensity: 35.0,
    soil_moisture: 70.0,
    slope_angle: 30.0,
    soil_type: 'Clay',
    vibration: 1.5,
    temperature: 22.0,
    rainfall_7d: 280.0,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'soil_type' ? value : parseFloat(value) || 0,
    }));
  };

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await predictionService.predict(formData);
      setResult(data);
    } catch (err) {
      console.error('Prediction API error:', err);
      setError(err.response?.data?.detail || 'Failed to calculate AI prediction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          {t('nav.predict', 'AI Landslide Prediction')}
        </h2>
        <div className="mt-1 p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-[#FACC15] flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-[#FACC15]" />
          <span>
            Demonstration Random Forest classifier and geotechnical formula scoring pipeline (POST /api/predict). Synthetic training data is not a validated forecast.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Input Parameters Form */}
        <Card title="Geotechnical & Hydrological Conditions">
          <form onSubmit={handlePredict} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
                  Rainfall intensity (mm/h)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="rainfall_intensity"
                  value={formData.rainfall_intensity}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#0D1829] border border-white/10 rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
                  Soil moisture (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="soil_moisture"
                  value={formData.soil_moisture}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#0D1829] border border-white/10 rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
                  Slope angle (°)
                </label>
                <input
                  type="number"
                  step="0.5"
                  name="slope_angle"
                  value={formData.slope_angle}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#0D1829] border border-white/10 rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
                  Soil type
                </label>
                <select
                  name="soil_type"
                  value={formData.soil_type}
                  onChange={handleChange}
                  className="w-full bg-[#0D1829] border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-ink focus:outline-none focus:border-accent"
                >
                  <option value="Clay">Clay</option>
                  <option value="Silty loam">Silty loam</option>
                  <option value="Sandy">Sandy</option>
                  <option value="Laterite">Laterite</option>
                  <option value="Rocky">Rocky</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
                  Ground vibration (mm/s)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="vibration"
                  value={formData.vibration}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#0D1829] border border-white/10 rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#0D1829] border border-white/10 rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-1.5">
                  7-day cumulative rainfall (mm)
                </label>
                <input
                  type="number"
                  step="1"
                  name="rainfall_7d"
                  value={formData.rainfall_7d}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#0D1829] border border-white/10 rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-[#EF4444]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-extrabold shadow-lg shadow-accent/25 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              <span>{loading ? 'Evaluating Model...' : 'Predict Risk'}</span>
            </button>
          </form>
        </Card>

        {/* Prediction Results Display */}
        <Card title="Predicted Landslide Risk">
          {result ? (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">
                    AI Probability Estimate
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-ink mt-0.5">
                    {result.predicted_probability}%
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <RiskBadge level={result.risk_category} className="text-xs px-3 py-1" />
                  <div className="text-xs text-ink-soft">
                    Geotechnical Score: <b className="text-ink">{result.risk_score}</b>
                  </div>
                </div>
              </div>

              {/* Contributing factors breakdown */}
              {result.top_factors && result.top_factors.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-2.5">
                    Top Contributing Factors
                  </h4>
                  <div className="space-y-2">
                    {result.top_factors.map((factor, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-ink">{factor.name}</span>
                          <span className="text-accent">{factor.percentage}%</span>
                        </div>
                        <div className="w-full bg-[#0D1829] h-2 rounded-full overflow-hidden border border-white/5">
                          <div
                            className="bg-accent h-full rounded-full transition-all duration-500"
                            style={{ width: `${factor.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended measures */}
              <div className="p-4 rounded-2xl bg-[#0D1829] border border-white/10 space-y-1.5">
                <span className="text-[11px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Recommended Safety Measures</span>
                </span>
                <p className="text-xs text-ink leading-relaxed">
                  {result.recommended_safety_measures}
                </p>
              </div>

              <div className="text-[11px] text-ink-soft/70 italic border-t border-white/5 pt-3">
                {result.disclaimer}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-ink-soft space-y-3">
              <Cpu className="w-10 h-10 text-accent/40 mx-auto" />
              <p>Enter geotechnical conditions above and click <b>Predict Risk</b> to run the assessment.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
