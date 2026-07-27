import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export async function GET() {
  try {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>("SELECT DISTINCT nama_unit as nama, cabang_id as kode_unit FROM ao_kpi_performances ORDER BY nama_unit ASC");
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('Error getUnits:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
