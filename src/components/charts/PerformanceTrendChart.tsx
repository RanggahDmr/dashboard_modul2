'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface GaugesData {
  si: number;
  sl: number;
  fr: number;
  fp: number;
}

interface PerformanceTrendChartProps {
  gauges: GaugesData;
  loading?: boolean;
}

export default function PerformanceTrendChart({ gauges, loading = false }: PerformanceTrendChartProps) {
  if (loading) {
    return (
      <div className="h-96 rounded-2xl bg-slate-800/60 border border-slate-700/60 p-6 flex items-center justify-center animate-pulse">
        <div className="w-full h-full bg-slate-800/40 rounded-xl" />
      </div>
    );
  }

  const data = [
    { name: 'SI / CLBK', value: gauges.si, color: '#38bdf8', fullName: 'Survey Indeks / CLBK' },
    { name: 'Service Level', value: gauges.sl, color: '#818cf8', fullName: 'Service Level (SL)' },
    { name: 'Flowrate', value: gauges.fr, color: '#f472b6', fullName: 'Flowrate Collection' },
    { name: 'Full Payment', value: gauges.fp, color: '#34d399', fullName: 'Full Payment Rate' },
  ];

  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700/60 p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Rata-Rata Pencapaian 4 KPI Utama
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Perbandingan nilai rata-rata tiap komponen indikator kinerja
          </p>
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis dataKey="name" type="category" stroke="#e2e8f0" tick={{ fontSize: 12, fontWeight: 600 }} width={90} />
            <Tooltip
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 border border-slate-700 px-3 py-2 rounded-xl shadow-2xl text-xs">
                      <p className="font-bold text-white mb-1" style={{ color: d.color }}>{d.fullName}</p>
                      <p className="text-slate-300">Rata-rata: <span className="font-extrabold text-white text-sm">{d.value}</span> / 100</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[0, 10, 10, 0]} animationDuration={1200} barSize={26}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* KPI Cards Summary Bottom */}
      <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-700/60 text-center">
        {data.map((d) => (
          <div key={d.name} className="bg-slate-800/40 py-2 px-1 rounded-lg border border-slate-700/30">
            <div className="text-[10px] font-semibold text-slate-400 truncate">{d.name}</div>
            <div className="text-sm font-extrabold text-white mt-0.5" style={{ color: d.color }}>
              {d.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
