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
    
    const sql = `
      SELECT 
        m.ao_code, m.nama as ao_nama, u.nama as unit_nama, 
        p.si_clbk, p.sl, p.flowrate, p.full_payment, p.score_akhir, p.kategori, p.unit_id, p.ao_id
      FROM ao_performance_monthly p
      JOIN ao_master m ON p.ao_id = m.id
      JOIN units u ON p.unit_id = u.id
      WHERE p.periode = ? AND ${w.clause}
      ORDER BY p.score_akhir DESC
      LIMIT ?
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql, [periode, ...w.params, limitNum]);

    // Untuk masing-masing AO, hitung ranking di dalam unit kerjanya
    for (let r of rows) {
      const [rankRows] = await pool.query<RowDataPacket[]>(`
        SELECT COUNT(*) + 1 as unit_rank
        FROM ao_performance_monthly
        WHERE periode = ? AND unit_id = ? AND score_akhir > ?
      `, [periode, r.unit_id, r.score_akhir]);
      r.unit_rank = rankRows[0]?.unit_rank || 1;
    }

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('Error getRanking:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
