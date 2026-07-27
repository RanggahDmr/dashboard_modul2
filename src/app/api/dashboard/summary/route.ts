import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getUnitWhere } from '@/lib/utils';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const unit = searchParams.get('unit');
    const periode = searchParams.get('periode') || '2026-06';
    const w = getUnitWhere(unit, 'p');
    const pool = getPool();

    // 1. Ambil threshold eligible
    const eligibleThres = 60;

    // 2. Ambil agregat KPI & AO
    const sql = `
      SELECT 
        COUNT(*) as c, 
        AVG(total_nilai) as s,
        SUM(CASE WHEN total_nilai >= ? THEN 1 ELSE 0 END) as e,
        AVG(nilai_si_clbk) as avg_si,
        AVG(nilai_sl) as avg_sl,
        AVG(nilai_flowrate) as avg_fr,
        AVG(nilai_full_payment) as avg_fp,
        SUM(CASE WHEN total_nilai < 40 THEN 1 ELSE 0 END) as outlier
      FROM ao_kpi_performances p 
      WHERE p.periode = ? AND ${w.clause}
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql, [eligibleThres, periode, ...w.params]);
    const agg = rows[0] || {};

    // 3. Ambil total unit kerja aktif
    const [unitRows] = await pool.query<RowDataPacket[]>("SELECT COUNT(DISTINCT nama_unit) as uc FROM ao_kpi_performances");

    // 4. Ambil daftar periode yang tersedia
    const [periodeRows] = await pool.query<RowDataPacket[]>("SELECT DISTINCT periode FROM ao_kpi_performances ORDER BY periode DESC");
    const periodes = periodeRows.map((r: any) => r.periode);
    if (periodes.length === 0) periodes.push('2026-06');

    // 5. Generate AI Insights
    const insights = [];
    const total = Number(agg.c) || 0;
    const avgScore = Number(agg.s) || 0;
    const eligibleAO = Number(agg.e) || 0;
    const eligiblePct = total > 0 ? (eligibleAO / total * 100) : 0;

    // a. Eligible AO
    insights.push({
      type: eligiblePct >= 60 ? 'good' : 'warn',
      text: `<b>${eligiblePct.toFixed(1).replace('.', ',')}% AO</b> (${eligibleAO.toLocaleString('id-ID')} dari ${total.toLocaleString('id-ID')}) masuk kategori eligible (Skor &ge; ${eligibleThres}) dan berhak menerima insentif.`
    });

    // b. Bandingkan dengan baseline (Mei 2026: 75.5)
    const baselineAvg = 75.5;
    const deltaScore = ((avgScore - baselineAvg) / baselineAvg) * 100;
    insights.push({
      type: deltaScore >= 0 ? 'good' : 'warn',
      text: `Skor rata-rata AO saat ini <b>${avgScore.toFixed(1).replace('.', ',')}</b>, ${deltaScore >= 0 ? 'naik' : 'turun'} <b>${Math.abs(deltaScore).toFixed(1).replace('.', ',')}%</b> dibanding periode sebelumnya.`
    });

    // c. KPI paling lemah & terbaik
    const kpiList = [
      { key: 'SI/CLBK', val: Number(agg.avg_si) || 0 },
      { key: 'SL', val: Number(agg.avg_sl) || 0 },
      { key: 'Flowrate', val: Number(agg.avg_fr) || 0 },
      { key: 'Hadir Bayar Full Payment', val: Number(agg.avg_fp) || 0 }
    ];
    if (total > 0) {
      const weakest = kpiList.reduce((a, b) => (b.val < a.val ? b : a));
      const strongest = kpiList.reduce((a, b) => (b.val > a.val ? b : a));
      insights.push({
        type: 'warn',
        text: `Fokus peningkatan utama: <b>${weakest.key} (${weakest.val.toFixed(1).replace('.', ',')}%)</b> &mdash; capaian paling rendah di antara 4 KPI, berpotensi menahan Skor Akhir banyak AO.`
      });
      insights.push({
        type: 'good',
        text: `KPI dengan capaian terbaik: <b>${strongest.key} (${strongest.val.toFixed(1).replace('.', ',')}%)</b> &mdash; pertahankan momentum ini di unit-unit lain.`
      });
    }

    // d. Unit terbaik & terlemah (hanya jika view Semua Unit)
    let topUnit = null;
    if (unit === 'all' && total > 0) {
      const [unitAvgRows] = await pool.query<RowDataPacket[]>(`
        SELECT nama_unit, AVG(total_nilai) as s, COUNT(*) as c
        FROM ao_kpi_performances p
        WHERE p.periode = ?
        GROUP BY nama_unit HAVING c >= 5 ORDER BY s DESC
      `, [periode]);
      if (unitAvgRows.length > 1) {
        const best = unitAvgRows[0];
        const worst = unitAvgRows[unitAvgRows.length - 1];
        topUnit = { nama: best.nama_unit, avgScore: best.s };
        insights.push({
          type: 'good',
          text: `Unit dengan performa tertinggi: <b>${best.nama_unit}</b> (rata-rata skor ${Number(best.s).toFixed(1).replace('.', ',')}).`
        });
        insights.push({
          type: 'warn',
          text: `Unit yang perlu perhatian/pendampingan lebih: <b>${worst.nama_unit}</b> (rata-rata skor ${Number(worst.s).toFixed(1).replace('.', ',')}).`
        });
      } else if (unitAvgRows.length === 1) {
        topUnit = { nama: unitAvgRows[0].nama_unit, avgScore: unitAvgRows[0].s };
      }
    }

    // e. Outlier < 40
    const outlierCount = Number(agg.outlier) || 0;
    if (outlierCount > 0) {
      insights.push({
        type: 'warn',
        text: `Terdeteksi <b>${outlierCount} AO</b> dengan Skor Akhir di bawah 40 &mdash; kandidat prioritas untuk coaching/pendampingan individual.`
      });
    }

    // f. Proyeksi AI naif
    if (deltaScore !== 0 && total > 0) {
      const proyeksi = avgScore + (avgScore - baselineAvg);
      const clamp = Math.max(0, Math.min(100, proyeksi));
      insights.push({
        type: 'info',
        text: `Proyeksi AI (naif, asumsi tren linear berlanjut): rata-rata skor bulan depan diperkirakan sekitar <b>${clamp.toFixed(1).replace('.', ',')}</b>. Gunakan sebagai indikasi awal, bukan angka final.`
      });
    }

    return NextResponse.json({
      totalAO: total,
      avgScore: Math.round(avgScore * 100) / 100,
      eligibleAO: eligibleAO,
      eligiblePct: total ? Math.round(((eligibleAO / total) * 100) * 10) / 10 : 0,
      totalUnits: Number(unitRows[0]?.uc) || 0,
      periodes,
      insights,
      topUnit
    });
  } catch (err: any) {
    console.error('Error getSummary:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
