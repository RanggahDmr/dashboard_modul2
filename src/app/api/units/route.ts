import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export async function GET() {
  try {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>("SELECT nama_unit as id, nama_unit as nama, MAX(cabang_id) as kode_unit FROM ao_kpi_performances GROUP BY nama_unit ORDER BY nama_unit ASC");
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('Error getUnits:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
