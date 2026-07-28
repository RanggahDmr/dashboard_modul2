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

    // Fetch dynamic thresholds
    const [tRows] = await pool.query<RowDataPacket[]>("SELECT description, nominal FROM score_thresholds ORDER BY nominal DESC");
    let caseSql = "CASE ";
    tRows.forEach((t) => {
      caseSql += `WHEN total_nilai >= ${Number(t.nominal)} THEN '${t.description}' `;
    });
    // Find lowest threshold to use as a baseline, anything below is 'Kurang' or similar
    caseSql += "ELSE 'Tidak Memenuhi' END";

    // 1. Donut chart (Per Kategori)
    const donutSql = `
      SELECT (${caseSql}) as cat, COUNT(*) as c 
      FROM ao_kpi_performances p 
      WHERE p.periode = ? AND ${w.clause}
      GROUP BY cat
    `;
    const [donutRows] = await pool.query<RowDataPacket[]>(donutSql, params);

    // 2. Gauges (Rata-rata 4 KPI)
    const gaugeSql = `
      SELECT 
        AVG(LEAST(120, GREATEST(0, pencapaian_uk_s1))) as si, 
        AVG(LEAST(120, GREATEST(0, pencapaian_uk_sl))) as sl, 
        AVG(LEAST(120, GREATEST(0, pencapaian_lar_baru))) as fr, 
        AVG(LEAST(120, GREATEST(0, pencapaian_hadir_bayar_full_payment))) as fp 
      FROM ao_kpi_performances p 
      WHERE p.periode = ? AND ${w.clause}
    `;
    const [gaugeRows] = await pool.query<RowDataPacket[]>(gaugeSql, params);
    const g = gaugeRows[0] || {};

    // 3. Scatter plot data
    const scatterSql = `
      SELECT 
        nama_ao as nama, 
        LEAST(120, GREATEST(0, pencapaian_uk_s1)) as si_clbk, 
        LEAST(120, GREATEST(0, pencapaian_uk_sl)) as sl, 
        LEAST(120, GREATEST(0, pencapaian_lar_baru)) as flowrate, 
        LEAST(120, GREATEST(0, pencapaian_hadir_bayar_full_payment)) as full_payment, 
        total_nilai as score_akhir, 
        (${caseSql}) as cat
      FROM ao_kpi_performances p
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
