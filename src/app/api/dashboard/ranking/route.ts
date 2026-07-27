import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getUnitWhere } from '@/lib/utils';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const unit = searchParams.get('unit');
    const periode = searchParams.get('periode') || '2026-06';
    const limitParam = searchParams.get('limit');
    const limitNum = limitParam ? parseInt(limitParam, 10) : 50; // default 50 untuk tabel lengkap
    
    const w = getUnitWhere(unit, 'p');
    const pool = getPool();
    
    const [tRows] = await pool.query<RowDataPacket[]>("SELECT description, nominal FROM score_thresholds ORDER BY nominal DESC");
    let caseSql = "CASE ";
    tRows.forEach((t) => {
      caseSql += `WHEN total_nilai >= ${Number(t.nominal)} THEN '${t.description}' `;
    });
    caseSql += "ELSE 'Tidak Memenuhi' END";

    const sql = `
      SELECT 
        ao_id as ao_code, nama_ao as ao_nama, nama_unit as unit_nama, 
        nilai_uk_s1 as si_clbk, nilai_uk_sl as sl, nilai_pencapaian_lar_baru as flowrate, nilai_hadir_bayar_full_payment as full_payment, 
        total_nilai as score_akhir, (${caseSql}) as kategori, nama_unit as unit_id, ao_id
      FROM ao_kpi_performances p
      WHERE p.periode = ? AND ${w.clause}
      ORDER BY total_nilai DESC
      LIMIT ?
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql, [periode, ...w.params, limitNum]);

    // Untuk masing-masing AO, hitung ranking di dalam unit kerjanya
    for (let r of rows) {
      const [rankRows] = await pool.query<RowDataPacket[]>(`
        SELECT COUNT(*) + 1 as unit_rank
        FROM ao_kpi_performances
        WHERE periode = ? AND nama_unit = ? AND total_nilai > ?
      `, [periode, r.unit_id, r.score_akhir]);
      r.unit_rank = rankRows[0]?.unit_rank || 1;
    }

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('Error getRanking:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
