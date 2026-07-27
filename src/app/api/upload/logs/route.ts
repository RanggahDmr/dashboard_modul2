import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

export async function GET() {
  try {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM upload_logs ORDER BY uploaded_at DESC LIMIT 20");
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('Error getLogs:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
