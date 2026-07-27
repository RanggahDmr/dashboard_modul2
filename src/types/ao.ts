export interface AOMaster {
  id: number;
  ao_code: string;
  nama: string;
  unit_id: number;
  status_aktif: boolean;
  unit_nama?: string;
  kode_unit?: string;
}

export interface UnitKerja {
  id: number;
  kode_unit: string;
  nama: string;
}

export interface AOPerformance {
  id: number;
  periode: string;
  ao_id: number;
  unit_id: number;
  si_clbk: number;
  sl: number;
  flowrate: number;
  full_payment: number;
  si_flag: number;
  sl_flag: number;
  fr_flag: number;
  fp_flag: number;
  score_akhir: number;
  kategori: 'Sangat Tinggi' | 'Tinggi' | 'Sedang' | 'Rendah' | string;
  upload_id?: number;
  ao_code?: string;
  nama_ao?: string;
  unit_nama?: string;
  rank?: number;
}

export interface KPIWeights {
  id?: number;
  periode?: string;
  w_si: number;
  w_sl: number;
  w_fr: number;
  w_fp: number;
}

export interface ScoreThresholds {
  id?: number;
  sangat_tinggi: number;
  tinggi: number;
  sedang: number;
  eligible_insentif: number;
}

export interface UploadLog {
  id: number;
  filename: string;
  periode: string;
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  error_log: string | null;
  uploaded_by: string;
  uploaded_at: string;
}

export interface DashboardSummary {
  totalAoAktif: number;
  avgScore: number;
  totalEligible: number;
  totalUnits?: number;
  eligiblePct?: number;
  topUnit: {
    nama: string;
    avgScore: number;
  };
  periodes: string[];
}

export interface CategoryDistribution {
  kategori: string;
  count: number;
}

export interface TrendChartData {
  periode: string;
  avgScore: number;
  totalAo: number;
}

export interface SimulationResult {
  poolName: string;
  minScore: number;
  minInsentif: number;
  maxInsentif: number;
  totalAoEligible: number;
  totalBudget: number;
  simulationList: {
    rank: number;
    ao_code: string;
    nama_ao: string;
    unit_nama: string;
    score_akhir: number;
    kategori: string;
    insentif_rp: number;
  }[];
}
