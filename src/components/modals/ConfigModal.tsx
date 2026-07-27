'use client';

import React, { useState, useEffect } from 'react';
import { X, Sliders, CheckCircle2, AlertCircle, Save, RefreshCw, Layers } from 'lucide-react';
import { KPIWeights, ScoreThresholds } from '@/types/ao';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConfigModal({ isOpen, onClose, onSuccess }: ConfigModalProps) {
  const [weights, setWeights] = useState<KPIWeights>({ w_si: 30, w_sl: 30, w_fr: 20, w_fp: 20 });
  const [thresholds, setThresholds] = useState<ScoreThresholds>({ sangat_tinggi: 90, tinggi: 75, sedang: 60, eligible_insentif: 60 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const [resW, resT] = await Promise.all([
        fetch('/api/config/weights'),
        fetch('/api/config/thresholds'),
      ]);
      if (resW.ok && resT.ok) {
        const dataW = await resW.json();
        const dataT = await resT.json();
        setWeights({
          w_si: Number(dataW.w_si) || 30,
          w_sl: Number(dataW.w_sl) || 30,
          w_fr: Number(dataW.w_fr) || 20,
          w_fp: Number(dataW.w_fp) || 20,
        });
        setThresholds({
          sangat_tinggi: Number(dataT.sangat_tinggi) || 90,
          tinggi: Number(dataT.tinggi) || 75,
          sedang: Number(dataT.sedang) || 60,
          eligible_insentif: Number(dataT.eligible_insentif) || 60,
        });
      }
    } catch (err) {
      console.error('Failed to fetch configs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConfigs();
      setMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalWeight = Number(weights.w_si) + Number(weights.w_sl) + Number(weights.w_fr) + Number(weights.w_fp);
  const isWeightValid = Math.abs(totalWeight - 100) <= 0.01;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWeightValid) {
      setMessage({ type: 'error', text: `Total bobot harus tepat 100%. Saat ini total: ${totalWeight}%` });
      return;
    }
    if (thresholds.sangat_tinggi <= thresholds.tinggi || thresholds.tinggi <= thresholds.sedang) {
      setMessage({ type: 'error', text: 'Urutan threshold tidak valid: Sangat Tinggi > Tinggi > Sedang.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const [resW, resT] = await Promise.all([
        fetch('/api/config/weights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(weights),
        }),
        fetch('/api/config/thresholds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(thresholds),
        }),
      ]);

      const dataW = await resW.json();
      const dataT = await resT.json();

      if (resW.ok && resT.ok) {
        setMessage({ type: 'success', text: 'Bobot dan threshold berhasil diperbarui! Semua skor AO telah dihitung ulang.' });
        onSuccess();
      } else {
        setMessage({ type: 'error', text: dataW.error || dataT.error || 'Gagal menyimpan konfigurasi.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan sistem: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Konfigurasi Bobot & Threshold</h2>
              <p className="text-xs font-medium text-slate-400">
                Atur bobot KPI dan batas nilai untuk kalkulasi kategori otomatis
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Bobot Section */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Bobot Indikator KPI (%)
                </h3>
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                  isWeightValid ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse'
                }`}>
                  Total: {totalWeight}%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'w_si', label: 'Survey Indeks / CLBK', val: weights.w_si },
                  { key: 'w_sl', label: 'Service Level (SL)', val: weights.w_sl },
                  { key: 'w_fr', label: 'Flowrate Collection', val: weights.w_fr },
                  { key: 'w_fp', label: 'Full Payment Rate', val: weights.w_fp },
                ].map((item) => (
                  <div key={item.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span>{item.label}</span>
                      <span className="text-indigo-400 font-bold">{item.val}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={item.val}
                      onChange={(e) => setWeights({ ...weights, [item.key]: Number(e.target.value) })}
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Threshold Section */}
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
                🎯 Batas Nilai Kategori (Score Thresholds)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-400 mb-1">🌟 Sangat Tinggi</label>
                  <input
                    type="number"
                    value={thresholds.sangat_tinggi}
                    onChange={(e) => setThresholds({ ...thresholds, sangat_tinggi: Number(e.target.value) })}
                    className="w-full bg-slate-800 text-white font-bold rounded-xl px-3 py-2 border border-slate-700 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-blue-400 mb-1">🚀 Tinggi</label>
                  <input
                    type="number"
                    value={thresholds.tinggi}
                    onChange={(e) => setThresholds({ ...thresholds, tinggi: Number(e.target.value) })}
                    className="w-full bg-slate-800 text-white font-bold rounded-xl px-3 py-2 border border-slate-700 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-400 mb-1">⭐ Sedang</label>
                  <input
                    type="number"
                    value={thresholds.sedang}
                    onChange={(e) => setThresholds({ ...thresholds, sedang: Number(e.target.value) })}
                    className="w-full bg-slate-800 text-white font-bold rounded-xl px-3 py-2 border border-slate-700 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-purple-400 mb-1">💰 Min. Insentif</label>
                  <input
                    type="number"
                    value={thresholds.eligible_insentif}
                    onChange={(e) => setThresholds({ ...thresholds, eligible_insentif: Number(e.target.value) })}
                    className="w-full bg-slate-800 text-white font-bold rounded-xl px-3 py-2 border border-slate-700 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {message && (
              <div
                className={`flex items-center gap-3 p-4 rounded-xl border text-xs font-medium ${
                  message.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !isWeightValid}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 shadow-xl shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sedang Menghitung Ulang Skor AO...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan & Kalkulasi Ulang Skor</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
