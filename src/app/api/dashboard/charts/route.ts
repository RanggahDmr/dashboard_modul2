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
    const params = [periode, ...w.params];

    // 1. Donut chart (Per Kategori)
    const donutSql = `
      SELECT kategori as cat, COUNT(*) as c 
      FROM ao_performance_monthly p 
      WHERE p.periode = ? AND ${w.clause}
      GROUP BY kategori
    `;
    const [donutRows] = await pool.query<RowDataPacket[]>(donutSql, params);

    // 2. Gauges (Rata-rata 4 KPI)
    const gaugeSql = `
      SELECT 
        AVG(si_clbk) as si, 
        AVG(sl) as sl, 
        AVG(flowrate) as fr, 
        AVG(full_payment) as fp 
      FROM ao_performance_monthly p 
      WHERE p.periode = ? AND ${w.clause}
    `;
    const [gaugeRows] = await pool.query<RowDataPacket[]>(gaugeSql, params);
    const g = gaugeRows[0] || {};

    // 3. Scatter plot data
    const scatterSql = `
      SELECT m.nama, p.si_clbk, p.sl, p.flowrate, p.full_payment, p.score_akhir, p.kategori as cat
      FROM ao_performance_monthly p
      JOIN ao_master m ON p.ao_id = m.id
      WHERE p.periode = ? AND ${w.clause}
      LIMIT 1000
    `;
    const [scatterRows] = await pool.query<RowDataPacket[]>(scatterSql, params);

    return NextResponse.json({
      donut: donutRows,
      gauges: {
        si: Math.round((Number(g.si) || 0) * 100) / 100,
        sl: Math.round((Number(g.sl) || 0) * 100) / 100,
        fr: Math.round((Number(g.fr) || 0) * 100) / 100,
        fp: Math.round((Number(g.fp) || 0) * 100) / 100
      },
      scatter: scatterRows
    });
  } catch (err: any) {
    console.error('Error getCharts:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
