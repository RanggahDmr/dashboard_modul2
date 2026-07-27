import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export async function GET() {
  try {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>("SELECT id, nama, kode_unit FROM units ORDER BY nama ASC");
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('Error getUnits:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
