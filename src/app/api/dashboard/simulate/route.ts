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
      SELECT p.ao_id, p.score_akhir, m.ao_code, m.nama as ao_nama, u.nama as unit_nama
      FROM ao_performance_monthly p
      JOIN ao_master m ON p.ao_id = m.id
      JOIN units u ON p.unit_id = u.id
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

    eligibleAO.forEach(r => {
      let calc = totalScoreEligible > 0 ? (Number(r.score_akhir) / totalScoreEligible) * budgetRp : 0;
      if (calc < minRp) calc = minRp;
      if (calc > maxRp) calc = maxRp;
      r.insentif = Math.round(calc);
      totalDispersed += r.insentif;
    });

    // Bucketing untuk chart distribusi insentif
    const buckets = [
      { label: '< 60 (Not Eligible)', count: 0, min: 0, max: 0, sum: 0, avg: 0 },
      { label: '60 - 69', count: 0, min: Infinity, max: 0, sum: 0, avg: 0 },
      { label: '70 - 79', count: 0, min: Infinity, max: 0, sum: 0, avg: 0 },
      { label: '80 - 89', count: 0, min: Infinity, max: 0, sum: 0, avg: 0 },
      { label: '90 - 99', count: 0, min: Infinity, max: 0, sum: 0, avg: 0 },
      { label: '100+', count: 0, min: Infinity, max: 0, sum: 0, avg: 0 },
    ];

    allRows.forEach(r => {
      const score = Number(r.score_akhir);
      let idx = 0;
      if (score < Number(minScore)) idx = 0;
      else if (score < 70) idx = 1;
      else if (score < 80) idx = 2;
      else if (score < 90) idx = 3;
      else if (score < 100) idx = 4;
      else idx = 5;

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
