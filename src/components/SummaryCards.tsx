'use client';

import React from 'react';
import { Users, Award, TrendingUp, Building, ArrowUpRight } from 'lucide-react';
import { DashboardSummary } from '@/types/ao';
import { motion } from 'framer-motion';

interface SummaryCardsProps {
  summary: DashboardSummary;
  loading?: boolean;
}

export default function SummaryCards({ summary, loading = false }: SummaryCardsProps) {
  const cards = [
    {
      title: 'Total AO Aktif',
      value: summary.totalAoAktif.toLocaleString('id-ID'),
      subtitle: `Dari total ${summary.totalUnits || 0} unit kerja`,
      icon: Users,
      gradient: 'from-blue-600/20 via-indigo-600/10 to-transparent',
      borderColor: 'border-blue-500/30',
      iconBg: 'bg-blue-500/20 text-blue-400',
      trend: '+12% bulan ini',
    },
    {
      title: 'Rata-Rata Skor Akhir',
      value: summary.avgScore.toFixed(2),
      subtitle: 'Skor gabungan 4 KPI',
      icon: Award,
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      borderColor: 'border-amber-500/30',
      iconBg: 'bg-amber-500/20 text-amber-400',
      trend: 'Target: 75.00',
    },
    {
      title: 'Eligible Insentif',
      value: `${summary.totalEligible.toLocaleString('id-ID')} AO`,
      subtitle: `${((summary.totalEligible / (summary.totalAoAktif || 1)) * 100).toFixed(1)}% memenuhi syarat`,
      icon: TrendingUp,
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      borderColor: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      trend: 'Threshold ≥ 60.00',
    },
    {
      title: 'Unit Performa Terbaik',
      value: summary.topUnit?.nama || 'N/A',
      subtitle: `Rata-rata skor: ${summary.topUnit?.avgScore?.toFixed(2) || '0.00'}`,
      icon: Building,
      gradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
      borderColor: 'border-purple-500/30',
      iconBg: 'bg-purple-500/20 text-purple-400',
      trend: '🏆 Peringkat 1',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 my-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-slate-800/50 animate-pulse border border-slate-700/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 my-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/90 border ${card.borderColor} p-6 shadow-xl backdrop-blur-sm transition-all duration-300 group`}
          >
            {/* Background Glow */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-300`}
            />

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-400 group-hover:text-slate-300 transition-colors">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-xl ${card.iconBg} shadow-inner`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1">
                  {card.value}
                </div>
                <p className="mt-1 text-xs font-medium text-slate-400 flex items-center justify-between">
                  <span>{card.subtitle}</span>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span className="flex items-center gap-1 text-indigo-400">
                  {card.trend}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
