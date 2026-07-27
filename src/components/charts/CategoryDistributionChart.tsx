'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CategoryDistribution } from '@/types/ao';
import { PieChart as PieIcon } from 'lucide-react';

interface CategoryDistributionChartProps {
  data: CategoryDistribution[];
  loading?: boolean;
}

const COLORS: Record<string, string> = {
  'Sangat Tinggi': '#10b981', // Emerald 500
  'Tinggi': '#3b82f6',        // Blue 500
  'Sedang': '#f59e0b',        // Amber 500
  'Rendah': '#ef4444',        // Red 500
};

export default function CategoryDistributionChart({ data, loading = false }: CategoryDistributionChartProps) {
  if (loading) {
    return (
      <div className="h-96 rounded-2xl bg-slate-800/60 border border-slate-700/60 p-6 flex items-center justify-center animate-pulse">
        <div className="w-48 h-48 rounded-full border-4 border-slate-700 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.kategori,
    value: Number(item.count),
    color: COLORS[item.kategori] || '#8b5cf6',
  }));

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700/60 p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-indigo-400" />
            Distribusi Kategori Performa AO
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Total {total.toLocaleString('id-ID')} AO pada periode & unit terpilih
          </p>
        </div>
      </div>

      <div className="w-full h-64 relative flex items-center justify-center">
        {chartData.length === 0 || total === 0 ? (
          <div className="text-slate-400 text-sm font-medium">Belum ada data kategori untuk ditampilkan</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke="#0f172a" 
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const pct = ((d.value / total) * 100).toFixed(1);
                      return (
                        <div className="bg-slate-900/95 border border-slate-700 px-3 py-2 rounded-xl shadow-2xl text-xs">
                          <p className="font-bold text-white mb-1" style={{ color: d.color }}>{d.name}</p>
                          <p className="text-slate-300">Jumlah: <span className="font-semibold text-white">{d.value} AO</span></p>
                          <p className="text-slate-400">Proporsi: <span className="font-semibold text-indigo-300">{pct}%</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white">{total}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total AO</span>
            </div>
          </>
        )}
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-700/60 text-xs">
        {chartData.map((d) => (
          <div key={d.name} className="flex items-center justify-between bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700/40">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-slate-300 font-medium">{d.name}</span>
            </div>
            <span className="font-bold text-white">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
