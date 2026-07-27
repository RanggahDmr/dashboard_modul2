'use client';

import React from 'react';
import { Upload, Sliders, Calculator, Database, ShieldCheck, Sparkles, Building2 } from 'lucide-react';
import { UnitKerja } from '@/types/ao';

interface NavbarProps {
  periodes: string[];
  selectedPeriode: string;
  onSelectPeriode: (periode: string) => void;
  units: UnitKerja[];
  selectedUnit: string;
  onSelectUnit: (unit: string) => void;
  onOpenUpload: () => void;
  onOpenConfig: () => void;
  onOpenSimulate: () => void;
}

export default function Navbar({
  periodes,
  selectedPeriode,
  onSelectPeriode,
  units,
  selectedUnit,
  onSelectUnit,
  onOpenUpload,
  onOpenConfig,
  onOpenSimulate,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-900/80 border-b border-slate-800/80 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              AO Performance Pro
            </h1>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <Database className="w-3 h-3" />
              <span>Laragon MySQL Connected</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 bg-slate-800/60 p-1.5 rounded-xl border border-slate-700/60">
          <div className="flex items-center gap-2 px-2 text-slate-400 text-sm">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span className="hidden md:inline font-medium">Filter:</span>
          </div>
          
          <select
            value={selectedUnit}
            onChange={(e) => onSelectUnit(e.target.value)}
            className="bg-slate-900/90 text-slate-200 text-sm font-medium rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
          >
            <option value="all">🌐 Semua Unit Kerja</option>
            {units.map((u) => (
              <option key={u.id} value={u.id.toString()}>
                {u.nama}
              </option>
            ))}
          </select>

          <select
            value={selectedPeriode}
            onChange={(e) => onSelectPeriode(e.target.value)}
            className="bg-indigo-600/20 text-indigo-300 text-sm font-semibold rounded-lg px-3 py-1.5 border border-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            {periodes.map((p) => (
              <option key={p} value={p} className="bg-slate-900 text-slate-200 font-medium">
                📅 {p}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenUpload}
            className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-teal-400 transition-all duration-200 active:scale-95"
          >
            <Upload className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            <span className="hidden sm:inline">Upload Excel</span>
          </button>

          <button
            onClick={onOpenConfig}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl shadow-md transition-all duration-200 hover:text-white active:scale-95"
            title="Pengaturan Bobot & Threshold"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Bobot & Threshold</span>
          </button>

          <button
            onClick={onOpenSimulate}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:opacity-95 transition-all duration-200 active:scale-95"
            title="Simulasi Insentif"
          >
            <Calculator className="w-4 h-4 text-pink-300" />
            <span className="hidden sm:inline">Simulasi Insentif</span>
          </button>
        </div>
      </div>
    </header>
  );
}
