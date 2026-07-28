import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getUnitWhere } from '@/lib/utils';
import { RowDataPacket } from 'mysql2/promise';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      budget = 1000000000,
      minScore = 60,
      minInsentif = 0,
      maxInsentif = null,
      unit = 'all',
      periode = '2026-06'
    } = body;

    const w = getUnitWhere(unit, 'p');
    const pool = getPool();

    // Ambil semua AO untuk periode tersebut
    const [allRows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        ao_id, 
        total_nilai as score_akhir, 
        ao_id as ao_code, 
        nama_ao as ao_nama, 
        nama_unit as unit_nama,
        nilai_uk_s1 as si_clbk, 
        nilai_uk_sl as sl, 
        nilai_pencapaian_lar_baru as flowrate, 
        nilai_hadir_bayar_full_payment as full_payment
      FROM ao_kpi_performances p
      WHERE p.periode = ? AND ${w.clause}
    `, [periode, ...w.params]);

    const totalAO = allRows.length;
    if (totalAO === 0) {
      return NextResponse.json({ error: "Tidak ada data AO pada periode/unit tersebut." }, { status: 400 });
    }

    const eligibleAO = allRows.filter(r => Number(r.score_akhir) >= Number(minScore));
    const notEligibleAO = totalAO - eligibleAO.length;

    // Hitung sum of scores untuk AO eligible
    const totalScoreEligible = eligibleAO.reduce((sum, r) => sum + Number(r.score_akhir), 0);

    let totalDispersed = 0;
    const minRp = Number(minInsentif) || 0;
    const maxRp = maxInsentif ? Number(maxInsentif) : Infinity;
    const budgetRp = Number(budget) || 0;
    
    // Allocate budget proportionally based on eligible AOs vs total AOs
    const allocatedBudget = totalAO > 0 ? budgetRp * (eligibleAO.length / totalAO) : 0;

    eligibleAO.forEach(r => {
      let calc = totalScoreEligible > 0 ? (Number(r.score_akhir) / totalScoreEligible) * allocatedBudget : 0;
      if (calc < minRp) calc = minRp;
      if (calc > maxRp) calc = maxRp;
      r.insentif = Math.round(calc);
      totalDispersed += r.insentif;
    });

    // Bucketing untuk chart distribusi insentif
    const buckets = [
      { label: '< 60', count: 0, min: 0, max: 0, sum: 0, avg: 0 },
      { label: '60-69', count: 0, min: Infinity, max: 0, sum: 0, avg: 0 },
      { label: '70-79', count: 0, min: Infinity, max: 0, sum: 0, avg: 0 },
      { label: '80-89', count: 0, min: Infinity, max: 0, sum: 0, avg: 0 },
      { label: '90-100', count: 0, min: Infinity, max: 0, sum: 0, avg: 0 },
    ];

    allRows.forEach(r => {
      const score = Number(r.score_akhir);
      let idx = 0;
      if (score < Number(minScore)) idx = 0;
      else if (score < 70) idx = 1;
      else if (score < 80) idx = 2;
      else if (score < 90) idx = 3;
      else idx = 4;

      const b = buckets[idx];
      b.count++;
      const ins = r.insentif || 0;
      b.sum += ins;
      if (ins < b.min) b.min = ins;
      if (ins > b.max) b.max = ins;
    });

    buckets.forEach(b => {
      if (b.min === Infinity) b.min = 0;
      b.avg = b.count > 0 ? Math.round(b.sum / b.count) : 0;
    });

    // Top receivers by insentif untuk ranking table
    eligibleAO.sort((a, b) => (b.insentif || 0) - (a.insentif || 0));

    return NextResponse.json({
      totalAO,
      eligibleCount: eligibleAO.length,
      notEligibleCount: notEligibleAO,
      totalBudget: budgetRp,
      totalDispersed,
      efficiencyRp: budgetRp - totalDispersed,
      efficiencyPct: budgetRp > 0 ? ((budgetRp - totalDispersed) / budgetRp) * 100 : 0,
      avgInsentifEligible: eligibleAO.length > 0 ? Math.round(totalDispersed / eligibleAO.length) : 0,
      maxInsentifReceived: eligibleAO[0]?.insentif || 0,
      minInsentifReceived: eligibleAO[eligibleAO.length - 1]?.insentif || 0,
      buckets,
      topReceivers: eligibleAO.slice(0, 50)
    });
  } catch (err: any) {
    console.error('Error simulate:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
