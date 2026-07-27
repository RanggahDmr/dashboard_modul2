'use client';

import React, { useState, useEffect } from 'react';
import { X, Calculator, DollarSign, Award, RefreshCw, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { SimulationResult } from '@/types/ao';
import { formatRupiah } from '@/lib/utils';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPeriode: string;
  selectedUnit: string;
}

export default function SimulationModal({ isOpen, onClose, selectedPeriode, selectedUnit }: SimulationModalProps) {
  const [budget, setBudget] = useState(1000000000); // 1 Miliar
  const [minScore, setMinScore] = useState(60);
  const [minInsentif, setMinInsentif] = useState(0);
  const [maxInsentif, setMaxInsentif] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: Number(budget),
          minScore: Number(minScore),
          minInsentif: Number(minInsentif) || 0,
          maxInsentif: maxInsentif ? Number(maxInsentif) : null,
          unit: selectedUnit,
          periode: selectedPeriode,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Gagal melakukan simulasi insentif.');
      }
    } catch (err: any) {
      setError('Terjadi kesalahan sistem: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runSimulation();
    }
  }, [isOpen, budget, minScore, minInsentif, maxInsentif, selectedPeriode, selectedUnit]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-500 text-white shadow-lg shadow-purple-500/30">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Simulasi Distribusi Insentif & Anggaran</h2>
              <p className="text-xs font-medium text-slate-400">
                Kalkulasi real-time alokasi bonus AO berdasarkan bobot skor dan ketersediaan anggaran
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Controls Panel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-inner">
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-purple-400 mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> Total Anggaran (Budget)
              </label>
              <input
                type="number"
                step="50000000"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full bg-slate-800 text-white font-extrabold rounded-xl px-3.5 py-2.5 border border-slate-700 text-sm focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                {formatRupiah(budget)}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-indigo-400 mb-1.5 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> Min. Skor Eligible
              </label>
              <input
                type="number"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full bg-slate-800 text-white font-extrabold rounded-xl px-3.5 py-2.5 border border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                AO dengan skor ≥ {minScore} dapat insentif
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-emerald-400 mb-1.5">
                Min. Insentif / AO (Rp)
              </label>
              <input
                type="number"
                step="500000"
                value={minInsentif}
                onChange={(e) => setMinInsentif(Number(e.target.value))}
                className="w-full bg-slate-800 text-white font-extrabold rounded-xl px-3.5 py-2.5 border border-slate-700 text-sm focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                {formatRupiah(minInsentif)}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-pink-400 mb-1.5">
                Max. Insentif / AO (Rp)
              </label>
              <input
                type="number"
                step="5000000"
                placeholder="Tak Terbatas (Opsional)"
                value={maxInsentif}
                onChange={(e) => setMaxInsentif(e.target.value)}
                className="w-full bg-slate-800 text-white font-extrabold rounded-xl px-3.5 py-2.5 border border-slate-700 text-sm focus:ring-2 focus:ring-pink-500 placeholder:text-slate-500 placeholder:font-normal"
              />
              <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                {maxInsentif ? formatRupiah(Number(maxInsentif)) : 'Tak Terbatas'}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {loading || !result ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-10 h-10 text-purple-400 animate-spin" />
              <p className="text-sm font-bold text-white">Menghitung Alokasi Anggaran & Distribusi Insentif...</p>
            </div>
          ) : (
            <>
              {/* Summary Cards of Simulation */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-900/30 to-slate-900 p-4 rounded-2xl border border-purple-500/30">
                  <div className="text-xs text-purple-300 font-semibold flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> AO Memenuhi Syarat
                  </div>
                  <div className="text-2xl font-black text-white mt-1">
                    {result.eligibleCount} <span className="text-xs font-medium text-slate-400">/ {result.totalAO} AO</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-900/30 to-slate-900 p-4 rounded-2xl border border-emerald-500/30">
                  <div className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" /> Total Insentif Cair
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white mt-1">
                    {formatRupiah(result.totalDispersed || 0)}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-900/30 to-slate-900 p-4 rounded-2xl border border-blue-500/30">
                  <div className="text-xs text-blue-300 font-semibold">Rata-Rata Insentif / AO</div>
                  <div className="text-xl sm:text-2xl font-black text-white mt-1">
                    {formatRupiah(result.avgInsentifEligible || 0)}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-900/30 to-slate-900 p-4 rounded-2xl border border-amber-500/30">
                  <div className="text-xs text-amber-300 font-semibold">Insentif Tertinggi (Top 1)</div>
                  <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
                    {formatRupiah(result.maxInsentifReceived || 0)}
                  </div>
                </div>
              </div>

              {/* Table of Top Receivers */}
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    🏆 Daftar Penerima Insentif Tertinggi (Hasil Simulasi)
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">Top 50 AO Eligible</span>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/70 text-slate-400 font-bold border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">Rank</th>
                        <th className="py-3 px-4">Account Officer</th>
                        <th className="py-3 px-4">Unit Kerja</th>
                        <th className="py-3 px-4 text-right">Skor Akhir</th>
                        <th className="py-3 px-4 text-right">Alokasi Insentif (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                      {result.topReceivers?.map((ao: any, idx: number) => (
                        <tr key={ao.ao_code || idx} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 text-center font-bold text-slate-400">#{idx + 1}</td>
                          <td className="py-2.5 px-4">
                            <div className="font-bold text-white">{ao.ao_nama}</div>
                            <div className="text-[10px] text-slate-400 font-semibold">{ao.ao_code}</div>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 font-semibold border border-slate-700">
                              {ao.unit_nama}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-extrabold text-indigo-300">{Number(ao.score_akhir).toFixed(2)}</td>
                          <td className="py-2.5 px-4 text-right font-black text-emerald-400 text-sm">
                            {formatRupiah(ao.insentif || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
