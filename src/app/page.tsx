'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend as ChartLegend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle
} from 'chart.js';
import { Doughnut, Bar, Scatter } from 'react-chartjs-2';
import {
  BarChart3,
  TrendingUp,
  Scale,
  Wallet,
  Settings,
  FolderGit2,
  FileText,
  Wrench,
  Menu,
  Download,
  Play,
  Save,
  Plus,
  Search,
  Trash2,
  Edit,
  X,
  CheckCircle2,
  RefreshCw,
  Upload,
  Users,
  Star,
  Award,
  Building2,
  Medal,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { UnitKerja } from '@/types/ao';

ChartJS.register(
  ArcElement,
  Tooltip,
  ChartLegend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle
);

const CATEGORY_COLORS: Record<string, string> = {
  'Sangat Tinggi': '#17378fff',
  'sangat_tinggi': '#17378fff',
  'Tinggi': '#4caf50',
  'tinggi': '#4caf50',
  'Sedang': '#e3a022',
  'sedang': '#e3a022',
  'Rendah': '#d94f3d',
  'rendah': '#d94f3d',
  'Tidak Memenuhi': '#d94f3d',
  'tidak_memenuhi': '#d94f3d',
  'Kurang': '#d94f3d',
  'kurang': '#d94f3d',
  'eligible_insentif': '#e3a022'
};

function formatCategoryLabel(cat: string | undefined | null): string {
  if (!cat) return 'Tidak Memenuhi';
  const lower = cat.toString().toLowerCase().replace(/_/g, ' ').trim();
  if (lower === 'sangat tinggi') return 'Sangat Tinggi';
  if (lower === 'tinggi') return 'Tinggi';
  if (lower === 'sedang') return 'Sedang';
  if (lower === 'rendah' || lower === 'tidak memenuhi' || lower === 'kurang') return 'Tidak Memenuhi';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function rupiah(n: number | undefined | null): string {
  const val = Math.round(n || 0);
  return 'Rp ' + val.toLocaleString('id-ID');
}

function fmt1(n: number | undefined | null): string {
  return (Math.round((n || 0) * 10) / 10).toLocaleString('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}

function formatNumberInput(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '';
  const num = typeof val === 'number' ? val : Number(val.toString().replace(/\D/g, ''));
  if (isNaN(num)) return '';
  return num.toLocaleString('id-ID');
}

function parseNumberInput(str: string): number {
  const digits = str.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}


export default function HomePage() {
  // Navigation & UI State
  const [activeView, setActiveView] = useState<'ringkasan' | 'param' | 'data'>('ringkasan');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Global Filters
  const [selectedPeriode, setSelectedPeriode] = useState('2026-06');
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [units, setUnits] = useState<UnitKerja[]>([]);

  // Dashboard Data State
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalAoAktif: 0,
    avgScore: 0,
    totalEligible: 0,
    totalUnits: 0,
    eligiblePct: 0,
    topUnit: { nama: 'N/A', avgScore: 0 },
    periodes: ['2026-06'],
    insights: [] as any[]
  });
  const [chartsData, setChartsData] = useState<{
    donut: any[];
    gauges: { si: number; sl: number; fr: number; fp: number };
    scatter: any[];
  }>({
    donut: [],
    gauges: { si: 0, sl: 0, fr: 0, fp: 0 },
    scatter: []
  });
  const [rankingData, setRankingData] = useState<any[]>([]);

  // Parameter & Weights State
  const [weights, setWeights] = useState({ si: 30, sl: 30, fr: 20, fp: 20 });
  const [thresholds, setThresholds] = useState({
    sangatTinggi: 90,
    tinggi: 75,
    sedang: 60,
    eligible: 60
  });

  // Simulation State
  const [simBudget, setSimBudget] = useState(1000000000);
  const [simUnitBudget, setSimUnitBudget] = useState<number>(0);
  const [simMinScore, setSimMinScore] = useState(60);
  const [simMinInsentif, setSimMinInsentif] = useState(0);
  const [simMaxInsentif, setSimMaxInsentif] = useState<string>('');
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  const simParamsRef = useRef({
    budget: simBudget,
    minScore: simMinScore,
    minInsentif: simMinInsentif,
    maxInsentif: simMaxInsentif
  });
  simParamsRef.current = {
    budget: selectedUnit === 'all' ? simBudget : simUnitBudget,
    minScore: simMinScore,
    minInsentif: simMinInsentif,
    maxInsentif: simMaxInsentif
  };

  // Data AO CRUD & Table State
  const [aoList, setAoList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAoCount, setTotalAoCount] = useState(0);
  const [sortCol, setSortCol] = useState('ao.ao_code');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Upload Excel State
  const [uploadPeriode, setUploadPeriode] = useState('2026-06');
  const [uploadNamaUnit, setUploadNamaUnit] = useState('Unit Bandung');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadResult, setUploadResult] = useState('');

  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editAoId, setEditAoId] = useState<number | null>(null);
  const [aoForm, setAoForm] = useState({
    ao_code: '',
    nama: '',
    unit_id: '1',
    si_clbk: 80,
    sl: 80,
    flowrate: 80,
    full_payment: 80
  });

  const showToastMsg = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // 1. Fetch Units
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

  // 2. Fetch Config (Weights & Thresholds)
  const fetchConfig = async () => {
    try {
      const [wRes, tRes] = await Promise.all([
        fetch('/api/config/weights'),
        fetch('/api/config/thresholds')
      ]);
      if (wRes.ok) {
        const wData = await wRes.json();
        setWeights({
          si: Number(wData.w_si || 30),
          sl: Number(wData.w_sl || 30),
          fr: Number(wData.w_fr || 20),
          fp: Number(wData.w_fp || 20)
        });
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        setThresholds({
          sangatTinggi: Number(tData.sangat_tinggi || 90),
          tinggi: Number(tData.tinggi || 75),
          sedang: Number(tData.sedang || 60),
          eligible: Number(tData.eligible_insentif || 60)
        });
        setSimMinScore(Number(tData.eligible_insentif || 60));
      }
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  };

  // 3. Run Simulation
  const runSimulation = useCallback(async () => {
    setSimLoading(true);
    try {
      const res = await fetch('/api/dashboard/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: simParamsRef.current.budget,
          minScore: simParamsRef.current.minScore,
          minInsentif: simParamsRef.current.minInsentif,
          maxInsentif: simParamsRef.current.maxInsentif ? Number(simParamsRef.current.maxInsentif) : null,
          unit: selectedUnit,
          periode: selectedPeriode
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSimResult(data);
        if (data.topReceivers) {
          setRankingData(data.topReceivers);
        }
      }
    } catch (err) {
      console.error('Error running simulation:', err);
    } finally {
      setSimLoading(false);
    }
  }, [selectedUnit, selectedPeriode]);

  // 4. Fetch Dashboard Data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        periode: selectedPeriode,
        unit: selectedUnit
      });

      const [resSummary, resCharts, resRanking] = await Promise.all([
        fetch(`/api/dashboard/summary?${params.toString()}`),
        fetch(`/api/dashboard/charts?${params.toString()}`),
        fetch(`/api/dashboard/ranking?${params.toString()}&limit=10`)
      ]);

      if (resSummary.ok) {
        const dataSum = await resSummary.json();
        setSummary({
          totalAoAktif: dataSum.totalAO || 0,
          avgScore: dataSum.avgScore || 0,
          totalEligible: dataSum.eligibleAO || 0,
          totalUnits: dataSum.totalUnits || 0,
          eligiblePct: dataSum.eligiblePct || 0,
          topUnit: dataSum.topUnit || { nama: 'N/A', avgScore: 0 },
          periodes: dataSum.periodes || ['2026-06'],
          insights: dataSum.insights || []
        });
      }

      if (resCharts.ok) {
        const dataCharts = await resCharts.json();
        setChartsData({
          donut: dataCharts.donut || [],
          gauges: dataCharts.gauges || { si: 0, sl: 0, fr: 0, fp: 0 },
          scatter: dataCharts.scatter || []
        });
      }

      if (resRanking.ok) {
        const dataRank = await resRanking.json();
        setRankingData(dataRank || []);
      }

      await runSimulation();
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriode, selectedUnit, runSimulation]);

  // 5. Fetch AO Data List (CRUD Table)
  const fetchAoList = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: searchQuery,
        unit: unitFilter,
        category: categoryFilter,
        sortCol,
        sortDir,
        periode: selectedPeriode
      });
      const res = await fetch(`/api/ao?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAoList(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalAoCount(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch AO list:', err);
    }
  }, [page, searchQuery, unitFilter, categoryFilter, sortCol, sortDir, selectedPeriode]);

  useEffect(() => {
    fetchUnits();
    fetchConfig();
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (activeView === 'data') {
      fetchAoList();
    }
  }, [activeView, fetchAoList]);

  // Save Weights
  const handleSaveWeights = async () => {
    const total = weights.si + weights.sl + weights.fr + weights.fp;
    if (Math.abs(total - 100) > 0.01) {
      showToastMsg('⚠️ Total bobot harus tepat 100%');
      return;
    }
    try {
      const res = await fetch('/api/config/weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          w_si: weights.si,
          w_sl: weights.sl,
          w_fr: weights.fr,
          w_fp: weights.fp
        })
      });
      if (res.ok) {
        showToastMsg('💾 Bobot berhasil disimpan & dihitung ulang!');
        fetchAllData();
      } else {
        const err = await res.json();
        showToastMsg('❌ Gagal: ' + (err.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      showToastMsg('❌ Gagal menyimpan bobot');
    }
  };

  // Save Thresholds
  const handleSaveThresholds = async () => {
    try {
      const res = await fetch('/api/config/thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sangat_tinggi: thresholds.sangatTinggi,
          tinggi: thresholds.tinggi,
          sedang: thresholds.sedang,
          eligible_insentif: thresholds.eligible
        })
      });
      if (res.ok) {
        showToastMsg('💾 Klasifikasi berhasil disimpan!');
        fetchAllData();
      } else {
        const err = await res.json();
        showToastMsg('❌ Gagal: ' + (err.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      showToastMsg('❌ Gagal menyimpan klasifikasi');
    }
  };

  // Upload Excel Handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToastMsg('⚠️ Pilih file Excel terlebih dahulu');
      return;
    }
    setUploadProgress(true);
    setUploadResult('');
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('periode', uploadPeriode);
    formData.append('nama_unit', uploadNamaUnit);

    try {
      const res = await fetch('/api/upload/excel', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setUploadProgress(false);
      if (res.ok) {
        setUploadResult(`✅ Sukses! ${data.processed || 0} data AO berhasil diproses dan dihitung ulang.`);
        showToastMsg('🚀 Upload dan recompute berhasil!');
        fetchAllData();
        if (activeView === 'data') fetchAoList();
      } else {
        setUploadResult(`❌ Gagal: ${data.error || 'Terjadi kesalahan saat upload'}`);
      }
    } catch (err: any) {
      setUploadProgress(false);
      setUploadResult(`❌ Error: ${err.message || 'Gagal terhubung ke server'}`);
    }
  };

  // Handle Sort Table
  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  // Handle Delete AO
  const handleDeleteAo = async (id: number, nama: string) => {
    if (!confirm(`Hapus data AO "${nama}"?`)) return;
    try {
      const res = await fetch(`/api/ao?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToastMsg('🗑️ AO berhasil dihapus');
        fetchAoList();
        fetchAllData();
      } else {
        showToastMsg('❌ Gagal menghapus AO');
      }
    } catch (err) {
      showToastMsg('❌ Terjadi kesalahan');
    }
  };

  // Open Modal Add/Edit
  const openAddModal = () => {
    setModalMode('add');
    setEditAoId(null);
    setAoForm({
      ao_code: `AO${Math.floor(1000 + Math.random() * 9000)}`,
      nama: '',
      unit_id: units[0]?.id ? units[0].id.toString() : '1',
      si_clbk: 80,
      sl: 80,
      flowrate: 80,
      full_payment: 80
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ao: any) => {
    setModalMode('edit');
    setEditAoId(ao.id || ao.perf_id);
    setAoForm({
      ao_code: ao.ao_code || '',
      nama: ao.nama || '',
      unit_id: ao.unit_id ? ao.unit_id.toString() : '1',
      si_clbk: Number(ao.si_clbk) || 0,
      sl: Number(ao.sl) || 0,
      flowrate: Number(ao.flowrate) || 0,
      full_payment: Number(ao.full_payment) || 0
    });
    setIsModalOpen(true);
  };

  // Submit Modal Form
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/ao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...aoForm, unit_id: Number(aoForm.unit_id), periode: selectedPeriode })
      });
      if (res.ok) {
        setIsModalOpen(false);
        showToastMsg(modalMode === 'add' ? '✅ AO baru berhasil ditambahkan' : '✅ AO berhasil diperbarui');
        fetchAoList();
        fetchAllData();
      } else {
        const err = await res.json();
        showToastMsg('❌ Gagal: ' + (err.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      showToastMsg('❌ Gagal menyimpan AO');
    }
  };

  // Chart Data Constructions
  const donutLabels = chartsData.donut.map(d => formatCategoryLabel(d.cat || d.kategori || 'N/A'));
  const donutCounts = chartsData.donut.map(d => Number(d.c || d.count) || 0);
  const donutColors = chartsData.donut.map(d => {
    const rawCat = d.cat || d.kategori || 'N/A';
    return CATEGORY_COLORS[rawCat] || CATEGORY_COLORS[formatCategoryLabel(rawCat)] || '#2b6fb3';
  });

  const gaugeList = [
    { label: 'SI/CLBK', val: chartsData.gauges.si, weight: `${Math.round(weights.si)}%`, color: '#1e7a34' },
    { label: 'SL', val: chartsData.gauges.sl, weight: `${Math.round(weights.sl)}%`, color: '#2b6fb3' },
    { label: 'Flowrate', val: chartsData.gauges.fr, weight: `${Math.round(weights.fr)}%`, color: '#e3a022' },
    { label: 'Hadir Bayar Full Payment', val: chartsData.gauges.fp, weight: `${Math.round(weights.fp)}%`, color: '#0f7c8a' }
  ];

  const totalWeightSum = weights.si + weights.sl + weights.fr + weights.fp;

  return (
    <div className="app">
      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'show' : ''}`} id="sidebar">
        <div className="brand">
          <div className="brand-badge">PNM</div>
          <div>
            <div className="brand-name">mekaar</div>
            <div className="brand-sub">AO Performance Dashboard</div>
          </div>
        </div>

        <div className="nav-group-label">Utama</div>
        <div
          className={`nav-item ${activeView === 'ringkasan' ? 'active' : ''}`}
          onClick={() => { setActiveView('ringkasan'); setSidebarOpen(false); }}
        >
          <span className="ico"><BarChart3 className="w-4 h-4 text-emerald-400" /></span> Ringkasan Eksekutif
        </div>
        <div className="nav-item soon">
          <span className="ico"><TrendingUp className="w-4 h-4" /></span> Kinerja AO <span className="soon-tag">segera</span>
        </div>
        <div className="nav-item soon">
          <span className="ico"><Scale className="w-4 h-4" /></span> Efisiensi &amp; Perbandingan <span className="soon-tag">segera</span>
        </div>
        <div className="nav-item soon">
          <span className="ico"><Wallet className="w-4 h-4" /></span> Anggaran Insentif <span className="soon-tag">segera</span>
        </div>

        <div className="nav-group-label">Data &amp; Konfigurasi</div>
        <div
          className={`nav-item ${activeView === 'param' ? 'active' : ''}`}
          onClick={() => { setActiveView('param'); setSidebarOpen(false); }}
        >
          <span className="ico"><Settings className="w-4 h-4 text-blue-400" /></span> Parameter &amp; Bobot KPI
        </div>
        <div
          className={`nav-item ${activeView === 'data' ? 'active' : ''}`}
          onClick={() => { setActiveView('data'); setSidebarOpen(false); }}
        >
          <span className="ico"><FolderGit2 className="w-4 h-4 text-amber-400" /></span> Data AO &amp; Assignment
        </div>
        <div className="nav-item soon">
          <span className="ico"><FileText className="w-4 h-4" /></span> Laporan &amp; Export <span className="soon-tag">segera</span>
        </div>
        <div className="nav-item soon">
          <span className="ico"><Wrench className="w-4 h-4" /></span> Pengaturan <span className="soon-tag">segera</span>
        </div>

        <div className="sidebar-footer">
          <b>Manajemen Pusat</b>
          Administrator · Data simulasi/dummy
        </div>
      </aside>

      {/* Main Content */}
      <div className="main">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="topbar-left">
            <button
              className="btn btn-ghost d-mobile"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 id="page-title">AO Account Assignment Performance Score Dashboard</h1>
              <div className="sub" id="page-sub">Simulasi Kinerja, Insentif &amp; Efisiensi</div>
            </div>
          </div>

          <div className="topbar-controls" id="global-filters">
            <div className="field">
              <label>Periode</label>
              <select
                value={selectedPeriode}
                onChange={(e) => setSelectedPeriode(e.target.value)}
              >
                <option value="2026-06">Juni 2026</option>
                <option value="2026-05" disabled>Mei 2026 (segera hadir)</option>
              </select>
            </div>
            <div className="field">
              <label>Unit Kerja</label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
              >
                <option value="all">Semua Unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id.toString()}>{u.nama}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>&nbsp;</label>
              <button
                className="btn btn-primary"
                onClick={() => showToastMsg('⬇ Mengekspor laporan dalam format Excel...')}
              >
                <Download className="w-4 h-4 inline mr-1" /> Export Laporan
              </button>
            </div>
          </div>
        </div>

        {/* VIEW: RINGKASAN EKSEKUTIF */}
        {activeView === 'ringkasan' && (
          <div className="view active" id="view-ringkasan">
            {/* KPI ROW */}
            <div className="kpi-row" id="kpi-row">
              <div className="kpi-card" style={{ background: '#2b6fb3' }}>
                <div className="kpi-top">
                  <div className="kpi-ic"><Users className="w-5 h-5 text-white" /></div>
                  <div className="kpi-label">Total AO Aktif</div>
                </div>
                <div className="kpi-value">{summary.totalAoAktif.toLocaleString('id-ID')} AO</div>
                <div className="kpi-delta up"> Dari seluruh unit kerja</div>
                <div className="kpi-note">Cabang / Unit Mekaar aktif</div>
              </div>

              <div className="kpi-card" style={{ background: '#1e7a34' }}>
                <div className="kpi-top">
                  <div className="kpi-ic"><Star className="w-5 h-5 text-white fill-white" /></div>
                  <div className="kpi-label">Rata-rata Skor AO</div>
                </div>
                <div className="kpi-value">{summary.avgScore.toFixed(1)}</div>
                <div className="kpi-delta up"> Target minimal: 75.0</div>
                <div className="kpi-note">Gabungan 4 KPI Utama</div>
              </div>

              <div className="kpi-card" style={{ background: '#0f7c8a' }}>
                <div className="kpi-top">
                  <div className="kpi-ic"><Award className="w-5 h-5 text-white" /></div>
                  <div className="kpi-label">AO Eligible Insentif</div>
                </div>
                <div className="kpi-value">{summary.totalEligible.toLocaleString('id-ID')} AO</div>
                <div className="kpi-delta up"> {summary.eligiblePct}% memenuhi syarat</div>
                <div className="kpi-note">Ambang batas skor &ge; 60</div>
              </div>

              <div className="kpi-card" style={{ background: '#c88a1a' }}>
                <div className="kpi-top">
                  <div className="kpi-ic"><Wallet className="w-5 h-5 text-white" /></div>
                  <div className="kpi-label">Total Budget Insentif</div>
                </div>
                <div className="kpi-value">{rupiah(simParamsRef.current.budget)}</div>
                <div className="kpi-note">Periode {selectedPeriode}</div>
              </div>

              <div className="kpi-card" style={{ background: '#6a4fa0' }}>
                <div className="kpi-top">
                  <div className="kpi-ic"><Sparkles className="w-5 h-5 text-white" /></div>
                  <div className="kpi-label">Potensi Efisiensi</div>
                </div>
                <div className="kpi-value">{rupiah(simResult?.efficiencyRp || 0)}</div>
                <div className="kpi-note">{simResult?.efficiencyPct ? Number(simResult.efficiencyPct).toFixed(1).replace('.', ',') + '% dari skema lama' : 'Jalankan simulasi'}</div>
              </div>
            </div>

            {/* GRID 3 (DONUT, GAUGES, SCATTER) */}
            <div className="grid-row grid-3">
              <div className="card">
                <div className="card-head">
                  <div>
                    <h3>Distribusi Skor AO (Seluruh AO)</h3>
                  </div>
                </div>
                <div className="donut-wrap">
                  <div className="donut-canvas-box">
                    <Doughnut
                      data={{
                        labels: donutLabels,
                        datasets: [{
                          data: donutCounts,
                          backgroundColor: donutColors,
                          borderWidth: 2,
                          borderColor: '#ffffff',
                          hoverOffset: 4
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        cutout: '72%'
                      }}
                    />
                    <div className="donut-center">
                      <b>{summary.totalAoAktif}</b>
                      <span>Total AO</span>
                    </div>
                  </div>
                  <div className="legend-row" id="donut-legend">
                    {chartsData.donut.map((item, idx) => {
                      const rawCat = item.cat || item.kategori || 'N/A';
                      const cat = formatCategoryLabel(rawCat);
                      const count = Number(item.c || item.count) || 0;
                      const pct = summary.totalAoAktif ? ((count / summary.totalAoAktif) * 100).toFixed(1) + '%' : '0%';
                      const color = CATEGORY_COLORS[rawCat] || CATEGORY_COLORS[cat] || '#2b6fb3';
                      return (
                        <div key={idx} className="legend-item">
                          <span className="legend-dot" style={{ background: color }} />
                          <span>{cat}</span>
                          <span className="cnt">({count} AO)</span>
                          <span className="pct">{pct}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="total-ao-badge">
                  <span className="lbl">Total AO Aktif</span>
                  <span className="val">{summary.totalAoAktif} AO</span>
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <div>
                    <h3>Performa Berdasarkan 4 KPI Utama</h3>
                    <div className="card-sub">Rata-rata pencapaian (dibatasi 0–120%)</div>
                  </div>
                </div>
                <div className="gauge-grid" id="gauge-grid">
                  {gaugeList.map((g, idx) => {
                    const pct = Math.min(100, Math.max(0, (g.val / 120) * 100));
                    return (
                      <div key={idx} className="gauge-item">
                        <div className="glabel">{g.label}</div>
                        <div style={{ position: 'relative', width: 75, height: 75, margin: '8px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                            <path stroke="#eef1f6" strokeWidth="3.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path stroke={g.color} strokeWidth="3.5" strokeDasharray={`${pct}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          </svg>
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#0e3159' }}>
                            {fmt1(g.val)}%
                          </div>
                        </div>
                        <div className="gweight">Bobot ({g.weight})</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <div>
                    <h3>Sebaran Skor AO (Seluruh AO)</h3>
                  </div>
                </div>
                <div className="scatter-wrap">
                  <div className="chart-box" style={{ flex: 1, height: 210 }}>
                    <Scatter
                      data={{
                        datasets: ['Sangat Tinggi', 'Tinggi', 'Sedang', 'Tidak Memenuhi'].map(cat => ({
                          label: cat,
                          data: (chartsData.scatter || []).filter(r => formatCategoryLabel(r.cat) === cat).map(r => ({
                            x: Number(r.flowrate) || 0,
                            y: Number(r.score_akhir) || 0,
                            nama: r.nama
                          })),
                          backgroundColor: CATEGORY_COLORS[cat] || '#2b6fb3',
                          pointRadius: 4,
                          pointHoverRadius: 6
                        }))
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (ctx: any) => `${ctx.raw.nama || 'AO'}: FR ${ctx.raw.x}%, Skor ${ctx.raw.y}`
                            }
                          }
                        },
                        scales: {
                          x: { title: { display: true, text: 'Flowrate (%)', font: { size: 10, weight: 'bold' } }, grid: { color: '#f0f2f6' } },
                          y: { title: { display: true, text: 'Skor Akhir', font: { size: 10, weight: 'bold' } }, grid: { color: '#f0f2f6' } }
                        }
                      }}
                    />
                  </div>
                  <div className="legend-row" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', width: '100%', marginTop: '4px' }}>
                    {['Sangat Tinggi', 'Tinggi', 'Sedang', 'Tidak Memenuhi'].map(cat => (
                      <div key={cat} className="legend-item" style={{ width: 'auto' }}>
                        <span className="legend-dot" style={{ background: CATEGORY_COLORS[cat] || '#2b6fb3' }} />
                        <span style={{ fontWeight: 600, color: 'var(--navy-800)', whiteSpace: 'nowrap' }}>{cat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* GRID 3 (SIMULATION) */}
            <div className="grid-row grid-3">
              <div className="card">
                <div className="card-head">
                  <div>
                    <h3>Simulasi Anggaran &amp; Distribusi Insentif</h3>
                    <div className="card-sub">Metode: Performance Pool</div>
                  </div>
                </div>
                <div className="sim-form" style={{ gridTemplateColumns: '1fr', gap: '8px' }}>
                  <div className="field full">
                    <label>Total Budget Insentif (Rp)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatNumberInput(simBudget)}
                      onChange={(e) => setSimBudget(parseNumberInput(e.target.value))}
                    />
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label>Budget insentif unit (Rp)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={selectedUnit === 'all' ? rupiah(simBudget) : formatNumberInput(simUnitBudget)}
                      onChange={(e) => setSimUnitBudget(parseNumberInput(e.target.value))}
                      disabled={selectedUnit === 'all'}
                      style={selectedUnit === 'all' ? { background: '#f6f8fb' } : {}}
                    />
                  </div>
                  <div className="field full">
                    <label>Metode Distribusi</label>
                    <select disabled style={{ background: '#f6f8fb' }}>
                      <option>Performance Pool</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="field" style={{ flex: 1 }}>
                      <label>Skor Minimum</label>
                      <input
                        type="number"
                        value={simMinScore}
                        onChange={(e) => setSimMinScore(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="field" style={{ flex: 1 }}>
                      <label>Min Insentif (Rp)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumberInput(simMinInsentif)}
                        onChange={(e) => setSimMinInsentif(parseNumberInput(e.target.value))}
                      />
                    </div>
                    <div className="field" style={{ flex: 1 }}>
                      <label>Max Insentif (Rp)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumberInput(simMaxInsentif)}
                        placeholder="Tanpa batas"
                        onChange={(e) => {
                          const val = parseNumberInput(e.target.value);
                          setSimMaxInsentif(val ? val.toString() : '');
                        }}
                      />
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={runSimulation}
                  disabled={simLoading}
                  style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                >
                  <Play className="w-4 h-4 inline mr-1" /> {simLoading ? 'Menghitung...' : 'Jalankan Simulasi'}
                </button>
              </div>

              <div className="card">
                <div className="card-head">
                  <div>
                    <h3>Hasil Simulasi Distribusi Insentif (Performance Pool)</h3>
                  </div>
                </div>
                <div className="sim-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: 12, marginBottom: 16 }}>
                  <div style={{ padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Total Penerima (Eligible)</span>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#0e3159', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {(simResult?.eligibleCount || 0).toLocaleString('id-ID')} <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>AO</span>
                    </div>
                  </div>
                  <div style={{ padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Total Insentif Terdistribusi</span>
                    <div style={{ fontSize: '19px', fontWeight: 800, color: '#166534', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={rupiah(simResult?.totalDispersed || 0)}>
                      {rupiah(simResult?.totalDispersed || 0)}
                    </div>
                  </div>
                  <div style={{ padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Rata-rata Insentif per AO</span>
                    <div style={{ fontSize: '19px', fontWeight: 800, color: '#0f7c8a', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={rupiah(simResult?.avgInsentifEligible || 0)}>
                      {rupiah(simResult?.avgInsentifEligible || 0)}
                    </div>
                  </div>
                  <div style={{ padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>Potensi Efisiensi (Saving)</span>
                    <div style={{ fontSize: '19px', fontWeight: 800, color: '#6a4fa0', marginTop: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={rupiah(simResult?.efficiencyRp || 0)}>
                      {rupiah(simResult?.efficiencyRp || 0)}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: 11, color: 'var(--navy-800)', margin: '6px 0 2px' }}>
                    Distribusi Insentif per Range Skor (AO Eligible &ge; {simMinScore})
                  </h4>
                </div>
                <div className="chart-box">
                  <Bar
                    data={{
                      labels: (simResult?.buckets || []).map((b: any) => b.label),
                      datasets: [
                        {
                          label: 'Jumlah AO',
                          data: (simResult?.buckets || []).map((b: any) => b.count),
                          backgroundColor: '#93c5fd',
                          yAxisID: 'y',
                          borderRadius: 0
                        },
                        {
                          label: 'Total Insentif (Rp)',
                          data: (simResult?.buckets || []).map((b: any) => b.sum),
                          backgroundColor: '#166534',
                          yAxisID: 'y1',
                          borderRadius: 0
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { 
                          display: true, 
                          position: 'bottom',
                          labels: { boxWidth: 12, usePointStyle: true, pointStyle: 'rect' }
                        },
                        tooltip: {
                          callbacks: {
                            label: (ctx: any) => {
                              if (ctx.dataset.label === 'Jumlah AO') return `${ctx.raw} AO`;
                              return rupiah(ctx.raw);
                            }
                          }
                        }
                      },
                      scales: {
                        x: { grid: { display: false } },
                        y: { 
                          type: 'linear',
                          display: true,
                          position: 'left',
                          title: { display: true, text: 'Jumlah AO', font: { size: 10 } },
                          grid: { color: '#f0f2f6' }
                        },
                        y1: {
                          type: 'linear',
                          display: true,
                          position: 'right',
                          title: { display: true, text: 'Insentif (Rp)', font: { size: 10 } },
                          grid: { drawOnChartArea: false },
                          ticks: { callback: (val: any) => (val / 1000000) + 'jt' }
                        }
                      }
                    }}
                  />
                </div>
                <div
                  className="footnote"
                  style={{ marginTop: 12, background: '#fdeceb', color: 'var(--red)', padding: 10, borderRadius: 6, textAlign: 'center', fontWeight: 600, borderTop: 'none' }}
                >
                  AO tidak eligible (Skor &lt; <span>{simMinScore}</span>) : <span>{simResult?.notEligibleCount || 0}</span> AO (<span>{simResult?.totalAO ? ((simResult.notEligibleCount / simResult.totalAO) * 100).toFixed(1) : 0}%</span>) - Tidak Menerima Insentif
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <div>
                    <h3>Perbandingan Skema Insentif</h3>
                  </div>
                </div>
                <div className="table-scroll">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th style={{ color: 'var(--navy-800)', textAlign: 'left' }}>KETERANGAN</th>
                        <th style={{ color: 'var(--navy-800)', textAlign: 'center' }}>SKEMA SEBELUMNYA<br /><span style={{ fontSize: 9, fontWeight: 'normal' }}>(SAMA RATA)</span></th>
                        <th style={{ color: 'var(--navy-800)', textAlign: 'center' }}>SKEMA BARU<br /><span style={{ fontSize: 9, fontWeight: 'normal' }}>(PERFORMANCE POOL)</span></th>
                        <th style={{ color: 'var(--navy-800)', textAlign: 'center' }}>SELISIH / EFISIENSI</th>
                        <th style={{ color: 'var(--navy-800)', textAlign: 'center' }}>% PERUBAHAN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const tBudget = simParamsRef.current.budget;
                        const tAO = simResult?.totalAO || 0;
                        const eAO = simResult?.eligibleCount || 0;
                        
                        const lama = {
                          budget: tBudget,
                          ao: tAO,
                          rata: tAO > 0 ? tBudget / tAO : 0,
                          max: tAO > 0 ? tBudget / tAO : 0,
                          min: tAO > 0 ? tBudget / tAO : 0,
                          dist: tBudget
                        };

                        const baru = {
                          budget: tBudget,
                          ao: eAO,
                          rata: simResult?.avgInsentifEligible || 0,
                          max: simResult?.maxInsentifReceived || 0,
                          min: simResult?.minInsentifReceived || 0,
                          dist: simResult?.totalDispersed || 0,
                          eff: simResult?.efficiencyRp || 0,
                          effPct: simResult?.efficiencyPct || 0
                        };

                        const calcDiff = (b: number, l: number) => ({
                          selisih: b - l,
                          pct: l !== 0 ? ((b - l) / l) * 100 : 0
                        });

                        const diffAO = calcDiff(baru.ao, lama.ao);
                        const diffRata = calcDiff(baru.rata, lama.rata);
                        const diffMax = calcDiff(baru.max, lama.max);
                        const diffMin = calcDiff(baru.min, lama.min);
                        const diffDist = calcDiff(baru.dist, lama.dist);

                        const renderDiffRp = (val: number) => {
                          if (val === 0) return <span style={{ color: 'var(--green-dark)' }}>+ Rp 0</span>;
                          if (val > 0) return <span style={{ color: 'var(--green-dark)' }}>+ {rupiah(val)}</span>;
                          return <span style={{ color: 'var(--red)' }}>- {rupiah(Math.abs(val))}</span>;
                        };

                        const renderDiffNum = (val: number, suffix: string) => {
                          if (val === 0) return <span style={{ color: 'var(--green-dark)' }}>+ 0 {suffix}</span>;
                          if (val > 0) return <span style={{ color: 'var(--green-dark)' }}>+ {val} {suffix}</span>;
                          return <span style={{ color: 'var(--red)' }}>- {Math.abs(val)} {suffix}</span>;
                        };

                        const renderDiffPct = (val: number) => {
                          if (val === 0) return <span style={{ color: 'var(--green-dark)' }}>+0,0%</span>;
                          if (val > 0) return <span style={{ color: 'var(--green-dark)' }}>+{val.toFixed(1).replace('.', ',')}%</span>;
                          return <span style={{ color: 'var(--red)' }}>{val.toFixed(1).replace('.', ',')}%</span>;
                        };

                        return (
                          <>
                            <tr>
                              <td style={{ fontWeight: 600, color: 'var(--navy-800)' }}>Total Budget</td>
                              <td style={{ fontWeight: 600, color: 'var(--navy-800)', textAlign: 'center' }}>{rupiah(lama.budget)}</td>
                              <td style={{ fontWeight: 600, color: 'var(--navy-800)', textAlign: 'center' }}>{rupiah(baru.budget)}</td>
                              <td style={{ fontWeight: 600, color: 'var(--blue)', textAlign: 'center' }}>-</td>
                              <td style={{ fontWeight: 600, color: 'var(--blue)', textAlign: 'center' }}>-</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600, color: 'var(--navy-800)' }}>Total AO Eligible</td>
                              <td style={{ fontWeight: 600, color: 'var(--navy-800)', textAlign: 'center' }}>{lama.ao} AO (100%)</td>
                              <td style={{ fontWeight: 600, color: 'var(--navy-800)', textAlign: 'center' }}>{baru.ao} AO ({lama.ao ? ((baru.ao / lama.ao) * 100).toFixed(1).replace('.', ',') : 0}%)</td>
                              <td style={{ fontWeight: 700, textAlign: 'center' }}>{renderDiffNum(diffAO.selisih, 'AO')}</td>
                              <td style={{ fontWeight: 700, textAlign: 'center' }}>{renderDiffPct(diffAO.pct)}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600, color: 'var(--navy-800)' }}>Rata-rata Insentif</td>
                              <td style={{ fontWeight: 600, color: 'var(--navy-800)', textAlign: 'center' }}>{rupiah(lama.rata)}</td>
                              <td style={{ fontWeight: 600, color: 'var(--navy-800)', textAlign: 'center' }}>{rupiah(baru.rata)}</td>
                              <td style={{ fontWeight: 700, textAlign: 'center' }}>{renderDiffRp(diffRata.selisih)}</td>
                              <td style={{ fontWeight: 700, textAlign: 'center' }}>{renderDiffPct(diffRata.pct)}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600, color: 'var(--navy-800)' }}>Insentif Tertinggi</td>
                              <td style={{ fontWeight: 600, color: 'var(--navy-800)', textAlign: 'center' }}>{rupiah(lama.max)}</td>
                              <td style={{ fontWeight: 600, color: 'var(--navy-800)', textAlign: 'center' }}>{rupiah(baru.max)}</td>
                              <td style={{ fontWeight: 700, textAlign: 'center' }}>{renderDiffRp(diffMax.selisih)}</td>
                              <td style={{ fontWeight: 700, textAlign: 'center' }}>{renderDiffPct(diffMax.pct)}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600, color: 'var(--navy-800)' }}>Insentif Terendah</td>
                              <td style={{ fontWeight: 600, color: 'var(--navy-800)', textAlign: 'center' }}>{rupiah(lama.min)}</td>
                              <td style={{ fontWeight: 600, color: 'var(--navy-800)', textAlign: 'center' }}>{rupiah(baru.min)}</td>
                              <td style={{ fontWeight: 700, textAlign: 'center' }}>{renderDiffRp(diffMin.selisih)}</td>
                              <td style={{ fontWeight: 700, textAlign: 'center' }}>{renderDiffPct(diffMin.pct)}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 600, color: 'var(--navy-800)' }}>Total Terdistribusi</td>
                              <td style={{ fontWeight: 600, color: 'var(--navy-800)', textAlign: 'center' }}>{rupiah(lama.dist)}</td>
                              <td style={{ fontWeight: 600, color: 'var(--navy-800)', textAlign: 'center' }}>{rupiah(baru.dist)}</td>
                              <td style={{ fontWeight: 700, textAlign: 'center' }}>{renderDiffRp(diffDist.selisih)}</td>
                              <td style={{ fontWeight: 700, textAlign: 'center' }}>{renderDiffPct(diffDist.pct)}</td>
                            </tr>
                            <tr style={{ background: '#f0fdf4' }}>
                              <td style={{ fontWeight: 700, color: 'var(--navy-800)' }}>Potensi Efisiensi (Savings)</td>
                              <td style={{ fontWeight: 700, color: 'var(--blue)', textAlign: 'center' }}>-</td>
                              <td style={{ fontWeight: 700, color: 'var(--green-dark)', textAlign: 'center' }}>{rupiah(baru.eff)}</td>
                              <td style={{ fontWeight: 700, color: 'var(--green-dark)', textAlign: 'center' }}>{rupiah(baru.eff)}</td>
                              <td style={{ fontWeight: 700, color: 'var(--green-dark)', textAlign: 'center' }}>{baru.effPct.toFixed(1).replace('.', ',')}%</td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* GRID 2-1 (RANKING, INSIGHTS) */}
            <div className="grid-row grid-2-1">
              <div className="card">
                <div className="card-head">
                  <div>
                    <h3>Ranking AO (Top 10)</h3>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th rowSpan={2} style={{ textAlign: 'center' }}>Peringkat</th>
                        <th rowSpan={2}>AO ID</th>
                        <th rowSpan={2}>Nama AO</th>
                        <th rowSpan={2}>Unit Kerja</th>
                        <th rowSpan={2} style={{ textAlign: 'center' }}>Skor Akhir</th>
                        <th colSpan={4} style={{ textAlign: 'center', borderBottom: '1px solid #e2e7f0' }}>Skor per KPI</th>
                        <th rowSpan={2} style={{ textAlign: 'right' }}>Insentif (Rp)</th>
                        <th rowSpan={2} style={{ textAlign: 'center' }}>Peringkat Unit</th>
                      </tr>
                      <tr>
                        <th style={{ textAlign: 'center' }}>SI/CLBK<br /><span style={{ fontSize: 9 }}>(30%)</span></th>
                        <th style={{ textAlign: 'center' }}>SL<br /><span style={{ fontSize: 9 }}>(30%)</span></th>
                        <th style={{ textAlign: 'center' }}>Flowrate<br /><span style={{ fontSize: 9 }}>(20%)</span></th>
                        <th style={{ textAlign: 'center' }}>Hadir Bayar<br /><span style={{ fontSize: 9 }}>(20%)</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankingData.slice(0, 10).map((ao, idx) => (
                        <tr key={ao.id || idx}>
                          <td style={{ textAlign: 'center' }}>
                            <div className="rank-pill mx-auto">{idx + 1}</div>
                          </td>
                          <td><b>{ao.ao_code}</b></td>
                          <td>{ao.nama || ao.ao_nama}</td>
                          <td>{ao.unit_nama || 'Unit'}</td>
                          <td style={{ textAlign: 'center' }}><b>{Number(ao.score_akhir || 0).toFixed(2)}</b></td>
                          <td style={{ textAlign: 'center' }}>{Number(ao.si_clbk || 0).toFixed(1)}%</td>
                          <td style={{ textAlign: 'center' }}>{Number(ao.sl || 0).toFixed(1)}%</td>
                          <td style={{ textAlign: 'center' }}>{Number(ao.flowrate || 0).toFixed(1)}%</td>
                          <td style={{ textAlign: 'center' }}>{Number(ao.full_payment || 0).toFixed(1)}%</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--green-dark)' }}>
                            {rupiah(ao.insentif || 0)}
                          </td>
                          <td style={{ textAlign: 'center' }}>#{idx + 1}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-head">
                  <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles className="w-4 h-4 text-emerald-600" /> Insight &amp; Rekomendasi
                    </h3>
                    <div className="card-sub">Dihasilkan otomatis dari data saat ini (diproses langsung di browser Anda)</div>
                  </div>
                </div>
                <ul className="insight-list" style={{ marginTop: 10 }}>
                  {summary.insights && summary.insights.length > 0 ? (
                    summary.insights.map((insight: any, i: number) => (
                      <li key={i} className={insight.type === 'good' ? 'ai-good' : (insight.type === 'warn' ? 'ai-warn' : 'ai-info')}>
                        <div style={{ fontSize: 14 }}>
                          {insight.type === 'good' ? '✓' : (insight.type === 'warn' ? '⚠' : '✨')}
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: insight.text }}></div>
                      </li>
                    ))
                  ) : (
                    <li>Belum ada insight.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: PARAMETER & BOBOT KPI */}
        {activeView === 'param' && (
          <div className="view active" id="view-param">
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="card-head">
                <div>
                  <h3>Bobot 4 KPI Utama</h3>
                  <div className="card-sub">
                    Total bobot harus 100%. Mengubah nilai akan menghitung ulang Score Akhir seluruh AO.
                  </div>
                </div>
              </div>
              <div className="param-grid">
                <div className="param-box">
                  <label>SI/CLBK (%)</label>
                  <input
                    type="number"
                    value={weights.si}
                    onChange={(e) => setWeights({ ...weights, si: Number(e.target.value) })}
                  />
                </div>
                <div className="param-box">
                  <label>SL (%)</label>
                  <input
                    type="number"
                    value={weights.sl}
                    onChange={(e) => setWeights({ ...weights, sl: Number(e.target.value) })}
                  />
                </div>
                <div className="param-box">
                  <label>Flowrate (%)</label>
                  <input
                    type="number"
                    value={weights.fr}
                    onChange={(e) => setWeights({ ...weights, fr: Number(e.target.value) })}
                  />
                </div>
                <div className="param-box">
                  <label>Hadir Bayar Full Payment (%)</label>
                  <input
                    type="number"
                    value={weights.fp}
                    onChange={(e) => setWeights({ ...weights, fp: Number(e.target.value) })}
                  />
                </div>
              </div>
              <p style={{ margin: '12px 0 4px' }}>
                Total bobot:{' '}
                <span className={`weight-total ${Math.abs(totalWeightSum - 100) <= 0.01 ? 'good' : 'bad'}`}>
                  {totalWeightSum}%
                </span>
              </p>
              <button
                className="btn btn-primary"
                onClick={handleSaveWeights}
                style={{ marginTop: 8 }}
              >
                <Save className="w-4 h-4 inline mr-1" /> Simpan &amp; Hitung Ulang
              </button>
            </div>

            <div className="card">
              <div className="card-head">
                <div>
                  <h3>Klasifikasi Score Akhir</h3>
                  <div className="card-sub">Ambang batas kategori distribusi skor AO</div>
                </div>
              </div>
              <div className="param-grid">
                <div className="param-box">
                  <label>Sangat Tinggi (Skor ≥)</label>
                  <input
                    type="number"
                    value={thresholds.sangatTinggi}
                    onChange={(e) => setThresholds({ ...thresholds, sangatTinggi: Number(e.target.value) })}
                  />
                </div>
                <div className="param-box">
                  <label>Tinggi (Skor ≥)</label>
                  <input
                    type="number"
                    value={thresholds.tinggi}
                    onChange={(e) => setThresholds({ ...thresholds, tinggi: Number(e.target.value) })}
                  />
                </div>
                <div className="param-box">
                  <label>Sedang (Skor ≥)</label>
                  <input
                    type="number"
                    value={thresholds.sedang}
                    onChange={(e) => setThresholds({ ...thresholds, sedang: Number(e.target.value) })}
                  />
                </div>
                <div className="param-box">
                  <label>Skor Minimum Eligible Insentif</label>
                  <input
                    type="number"
                    value={thresholds.eligible}
                    onChange={(e) => setThresholds({ ...thresholds, eligible: Number(e.target.value) })}
                  />
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleSaveThresholds}
                style={{ marginTop: 12 }}
              >
                <Save className="w-4 h-4 inline mr-1" /> Simpan Klasifikasi
              </button>
            </div>
          </div>
        )}

        {/* VIEW: DATA AO & ASSIGNMENT */}
        {activeView === 'data' && (
          <div className="view active" id="view-data">
            <div
              className="card"
              style={{
                marginBottom: 14,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafd 100%)',
                border: '1.5px dashed var(--navy-300)'
              }}
            >
              <div className="card-head">
                <div>
                  <h3 style={{ color: 'var(--navy-800)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600 inline" /> Upload &amp; Konversi Excel Assignment Bulanan
                  </h3>
                  <div className="card-sub">
                    Unggah laporan Excel assignment AO untuk menghitung ulang skor secara otomatis di MySQL.
                  </div>
                </div>
                <a
                  href="/api/upload/template"
                  className="btn btn-outline"
                  target="_blank"
                  download
                  style={{ textDecoration: 'none' }}
                >
                  <Download className="w-4 h-4 inline mr-1" /> Unduh Template Excel
                </a>
              </div>
              <div style={{ padding: '12px 0' }}>
                <form
                  onSubmit={handleUploadSubmit}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}
                >
                  <div className="field" style={{ width: 180 }}>
                    <label>Periode Data</label>
                    <select
                      value={uploadPeriode}
                      onChange={(e) => setUploadPeriode(e.target.value)}
                    >
                      <option value="2026-06">Juni 2026</option>
                      <option value="2026-07">Juli 2026</option>
                      <option value="2026-05">Mei 2026</option>
                    </select>
                  </div>
                  <div className="field" style={{ flex: 1, minWidth: 200 }}>
                    <label>Nama Unit</label>
                    <input
                      type="text"
                      placeholder="mis. Unit Bandung"
                      value={uploadNamaUnit}
                      onChange={(e) => setUploadNamaUnit(e.target.value)}
                      required
                      style={{ padding: 6, border: '1px solid #ccd5e0', borderRadius: 6, background: '#fff', width: '100%' }}
                    />
                  </div>
                  <div className="field" style={{ flex: 1, minWidth: 240 }}>
                    <label>Pilih File Excel (.xlsx / .csv)</label>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      required
                      style={{ padding: 6, border: '1px solid #ccd5e0', borderRadius: 6, background: '#fff', width: '100%' }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ height: 38 }} disabled={uploadProgress}>
                    <Upload className="w-4 h-4 inline mr-1" /> {uploadProgress ? 'Memproses...' : '🚀 Upload & Proses'}
                  </button>
                </form>
                {uploadProgress && (
                  <div
                    style={{ marginTop: 12, padding: 10, background: '#e8f0fe', borderRadius: 6, color: 'var(--navy-800)', fontWeight: 600, fontSize: 13 }}
                  >
                    Mengunggah dan memproses spreadsheet ke MySQL...
                  </div>
                )}
                {uploadResult && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      borderRadius: 6,
                      fontSize: 13,
                      background: uploadResult.includes('✅') ? '#e6f5ea' : '#fdeceb',
                      color: uploadResult.includes('✅') ? 'var(--green-dark)' : 'var(--red)'
                    }}
                  >
                    {uploadResult}
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <div>
                  <h3>Data AO &amp; Assignment</h3>
                  <div className="card-sub">
                    CRUD dasar di atas data AO — perubahan langsung memicu hitung ulang Score Akhir.
                  </div>
                </div>
                <button className="btn btn-primary" onClick={openAddModal}>
                  <Plus className="w-4 h-4 inline mr-1" /> Tambah AO
                </button>
              </div>

              <div className="search-row">
                <div className="field">
                  <label>Cari (Nama / AO ID)</label>
                  <input
                    type="text"
                    value={searchQuery}
                    placeholder="mis. Siti / AO0001"
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  />
                </div>
                <div className="field">
                  <label>Unit Kerja</label>
                  <select
                    value={unitFilter}
                    onChange={(e) => { setUnitFilter(e.target.value); setPage(1); }}
                  >
                    <option value="all">Semua Unit</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id.toString()}>{u.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Kategori</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                  >
                    <option value="all">Semua Kategori</option>
                    <option value="sangat_tinggi">Sangat Tinggi</option>
                    <option value="tinggi">Tinggi</option>
                    <option value="sedang">Sedang</option>
                    <option value="Tidak Memenuhi">Tidak Memenuhi</option>
                  </select>
                </div>
              </div>

              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th className={`sortable ${sortCol === 'ao.ao_code' ? sortDir : ''}`} onClick={() => handleSort('ao.ao_code')}>AO ID</th>
                      <th className={`sortable ${sortCol === 'ao.nama' ? sortDir : ''}`} onClick={() => handleSort('ao.nama')}>Nama AO</th>
                      <th className={`sortable ${sortCol === 'unit_nama' ? sortDir : ''}`} onClick={() => handleSort('unit_nama')}>Unit Kerja</th>
                      <th className={`sortable ${sortCol === 'si_clbk' ? sortDir : ''}`} onClick={() => handleSort('si_clbk')}>SI/CLBK</th>
                      <th className={`sortable ${sortCol === 'sl' ? sortDir : ''}`} onClick={() => handleSort('sl')}>SL</th>
                      <th className={`sortable ${sortCol === 'flowrate' ? sortDir : ''}`} onClick={() => handleSort('flowrate')}>Flowrate</th>
                      <th className={`sortable ${sortCol === 'full_payment' ? sortDir : ''}`} onClick={() => handleSort('full_payment')}>Full Payment</th>
                      <th className={`sortable ${sortCol === 'score_akhir' ? sortDir : ''}`} onClick={() => handleSort('score_akhir')}>Skor Akhir</th>
                      <th className={`sortable ${sortCol === 'cat' ? sortDir : ''}`} onClick={() => handleSort('cat')}>Kategori</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aoList.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-6 empty-note">Tidak ada data AO yang ditemukan.</td>
                      </tr>
                    ) : (
                      aoList.map((ao) => {
                        let badgeClass = 'badge-amber';
                        const displayCat = formatCategoryLabel(ao.cat);
                        if (displayCat === 'Sangat Tinggi' || displayCat === 'Tinggi') badgeClass = 'badge-green';
                        if (displayCat === 'Tidak Memenuhi' || displayCat === 'Rendah') badgeClass = 'badge-red';

                        return (
                          <tr key={ao.perf_id || ao.id}>
                            <td><b>{ao.ao_code}</b></td>
                            <td>{ao.nama}</td>
                            <td>{ao.unit_nama}</td>
                            <td>{ao.si_clbk}%</td>
                            <td>{ao.sl}%</td>
                            <td>{ao.flowrate}%</td>
                            <td>{ao.full_payment}%</td>
                            <td><b>{ao.score_akhir}</b></td>
                            <td><span className={`badge ${badgeClass}`}>{displayCat}</span></td>
                            <td>
                              <div className="flex items-center gap-1">
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => openEditModal(ao)}
                                  title="Edit"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDeleteAo(ao.id, ao.nama)}
                                  title="Hapus"
                                  style={{ padding: '4px 6px' }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pager">
                <span>Menampilkan {aoList.length} dari {totalAoCount} AO (Halaman {page} dari {totalPages})</span>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4 inline mr-1" /> Sebelumnya
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Berikutnya <ChevronRight className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL ADD/EDIT AO */}
      {isModalOpen && (
        <>
          <div className="modal-backdrop" onClick={() => setIsModalOpen(false)} />
          <div className="modal" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1050 }}>
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 style={{ margin: 0, color: 'var(--navy-800)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {modalMode === 'add' ? (
                  <>
                    <Plus className="w-5 h-5 text-emerald-600 inline" /> Tambah Data AO
                  </>
                ) : (
                  <>
                    <Edit className="w-5 h-5 text-blue-600 inline" /> Edit Data AO
                  </>
                )}
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit}>
              <div className="modal-form">
                <div className="field">
                  <label>AO ID / Code</label>
                  <input
                    type="text"
                    value={aoForm.ao_code}
                    disabled={modalMode === 'edit'}
                    onChange={(e) => setAoForm({ ...aoForm, ao_code: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label>Unit Kerja</label>
                  <select
                    value={aoForm.unit_id}
                    onChange={(e) => setAoForm({ ...aoForm, unit_id: e.target.value })}
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id.toString()}>{u.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="field full">
                  <label>Nama Lengkap AO</label>
                  <input
                    type="text"
                    value={aoForm.nama}
                    placeholder="mis. Siti Aminah"
                    onChange={(e) => setAoForm({ ...aoForm, nama: e.target.value })}
                    required
                  />
                </div>
                <div className="field">
                  <label>SI / CLBK (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={aoForm.si_clbk}
                    onChange={(e) => setAoForm({ ...aoForm, si_clbk: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="field">
                  <label>Service Level (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={aoForm.sl}
                    onChange={(e) => setAoForm({ ...aoForm, sl: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="field">
                  <label>Flowrate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={aoForm.flowrate}
                    onChange={(e) => setAoForm({ ...aoForm, flowrate: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="field">
                  <label>Full Payment (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={aoForm.full_payment}
                    onChange={(e) => setAoForm({ ...aoForm, full_payment: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save className="w-4 h-4 inline mr-1" /> {modalMode === 'add' ? 'Simpan Data AO' : 'Update Data AO'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* TOAST NOTIFICATION */}
      <div className={`toast ${showToast ? 'show' : ''}`} id="toast">
        {toastMsg}
      </div>
    </div>
  );
}
