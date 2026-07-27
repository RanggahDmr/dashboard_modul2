'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import SummaryCards from '@/components/SummaryCards';
import CategoryDistributionChart from '@/components/charts/CategoryDistributionChart';
import PerformanceTrendChart from '@/components/charts/PerformanceTrendChart';
import RankingTable from '@/components/RankingTable';
import UploadModal from '@/components/modals/UploadModal';
import ConfigModal from '@/components/modals/ConfigModal';
import SimulationModal from '@/components/modals/SimulationModal';
import { DashboardSummary, UnitKerja, AOPerformance, CategoryDistribution } from '@/types/ao';
import { Sparkles, RefreshCw, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const [selectedPeriode, setSelectedPeriode] = useState('2026-06');
  const [selectedUnit, setSelectedUnit] = useState('all');

  const [summary, setSummary] = useState<DashboardSummary>({
    totalAoAktif: 0,
    avgScore: 0,
    totalEligible: 0,
    totalUnits: 0,
    eligiblePct: 0,
    topUnit: { nama: 'N/A', avgScore: 0 },
    periodes: ['2026-06'],
  });
  const [units, setUnits] = useState<UnitKerja[]>([]);
  const [chartsData, setChartsData] = useState<{
    donut: CategoryDistribution[];
    gauges: { si: number; sl: number; fr: number; fp: number };
  }>({
    donut: [],
    gauges: { si: 0, sl: 0, fr: 0, fp: 0 },
  });
  const [rankingData, setRankingData] = useState<AOPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/units');
      if (res.ok) {
        const data = await res.json();
        setUnits(data);
      }
    } catch (err) {
      console.error('Failed to fetch units:', err);
    }
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        periode: selectedPeriode,
        unit: selectedUnit,
      });

      const [resSummary, resCharts, resRanking] = await Promise.all([
        fetch(`/api/dashboard/summary?${params.toString()}`),
        fetch(`/api/dashboard/charts?${params.toString()}`),
        fetch(`/api/dashboard/ranking?${params.toString()}&limit=100`),
      ]);

      if (resSummary.ok) {
        const dataSum = await resSummary.json();
        setSummary({
          totalAoAktif: dataSum.totalAO || 0,
          avgScore: dataSum.avgScore || 0,
          totalEligible: dataSum.eligibleAO || 0,
          totalUnits: dataSum.totalUnits || 0,
          eligiblePct: dataSum.eligiblePct || 0,
          topUnit: { nama: 'Unit Unggulan 01', avgScore: dataSum.avgScore || 0 },
          periodes: dataSum.periodes || ['2026-06'],
        });
      }

      if (resCharts.ok) {
        const dataCharts = await resCharts.json();
        setChartsData({
          donut: dataCharts.donut || [],
          gauges: dataCharts.gauges || { si: 0, sl: 0, fr: 0, fp: 0 },
        });
      }

      if (resRanking.ok) {
        const dataRank = await resRanking.json();
        setRankingData(dataRank || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriode, selectedUnit]);

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 right-10 w-[400px] h-[400px] bg-gradient-to-tl from-cyan-600/10 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Bar */}
      <Navbar
        periodes={summary.periodes}
        selectedPeriode={selectedPeriode}
        onSelectPeriode={(p) => setSelectedPeriode(p)}
        units={units}
        selectedUnit={selectedUnit}
        onSelectUnit={(u) => setSelectedUnit(u)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenSimulate={() => setIsSimulateOpen(true)}
      />

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-8">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-indigo-950/40 p-6 rounded-3xl border border-slate-800/80 shadow-2xl backdrop-blur-md"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-2">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Executive Performance Center</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              Monitoring & Evaluasi Kinerja AO
            </h2>
            <p className="text-sm font-medium text-slate-400 mt-1">
              Periode Laporan: <span className="text-indigo-300 font-bold">{selectedPeriode}</span> • {selectedUnit === 'all' ? 'Seluruh Kantor Cabang / Unit Kerja' : `Unit Kerja ID #${selectedUnit}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Memuat Data...' : 'Segarkan Data'}</span>
            </button>
          </div>
        </motion.div>

        {/* KPI Summary Cards */}
        <section>
          <SummaryCards summary={summary} loading={loading} />
        </section>

        {/* Charts Section (Donut & Gauges Bar) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryDistributionChart data={chartsData.donut} loading={loading} />
          <PerformanceTrendChart gauges={chartsData.gauges} loading={loading} />
        </section>

        {/* Ranking Table Section */}
        <section>
          <RankingTable data={rankingData} loading={loading} onRefresh={fetchAllData} />
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 py-8 px-4 mt-12 text-center text-xs font-medium text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-300">AO Performance Pro</span>
            <span>— Built with Next.js 15, TypeScript & Tailwind CSS</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 font-semibold">
            <span>© 2026 Executive Dashboard Modul 2</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Laragon Ready
            </span>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={fetchAllData}
      />
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSuccess={fetchAllData}
      />
      <SimulationModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        selectedPeriode={selectedPeriode}
        selectedUnit={selectedUnit}
      />
    </div>
  );
}
