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
        SUM(CASE WHEN total_nilai >= ? THEN 1 ELSE 0 END) as e 
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

    return NextResponse.json({
      totalAO: Number(agg.c) || 0,
      avgScore: Math.round((Number(agg.s) || 0) * 100) / 100,
      eligibleAO: Number(agg.e) || 0,
      eligiblePct: agg.c ? Math.round(((Number(agg.e) / Number(agg.c)) * 100) * 10) / 10 : 0,
      totalUnits: Number(unitRows[0]?.uc) || 0,
      periodes
    });
  } catch (err: any) {
    console.error('Error getSummary:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
