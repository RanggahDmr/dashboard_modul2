import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { recomputeScores } from '@/lib/recompute';
import { RowDataPacket } from 'mysql2/promise';

export async function GET() {
  try {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM kpi_weights WHERE periode = 'ALL' LIMIT 1");
    if (rows.length === 0) {
      return NextResponse.json({ w_si: 30, w_sl: 30, w_fr: 20, w_fp: 20 });
    }
    return NextResponse.json(rows[0]);
  } catch (err: any) {
    console.error('Error getWeights:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { w_si, w_sl, w_fr, w_fp } = body;
    if (w_si == null || w_sl == null || w_fr == null || w_fp == null) {
      return NextResponse.json({ error: 'Semua bobot KPI (SI, SL, Flowrate, Full Payment) harus diisi.' }, { status: 400 });
    }
    const total = Number(w_si) + Number(w_sl) + Number(w_fr) + Number(w_fp);
    if (Math.abs(total - 100) > 0.01) {
      return NextResponse.json({ error: `Total bobot harus tepat 100%. Saat ini totalnya: ${total}%` }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query("DELETE FROM kpi_weights WHERE periode = 'ALL'");
      await connection.query(
        "INSERT INTO kpi_weights (periode, w_si, w_sl, w_fr, w_fp) VALUES ('ALL', ?, ?, ?, ?)",
        [w_si, w_sl, w_fr, w_fp]
      );
      await connection.commit();
      await recomputeScores(pool);
      return NextResponse.json({ success: true, message: 'Bobot berhasil diperbarui dan skor AO telah dihitung ulang.' });
    } catch (err: any) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err: any) {
    console.error('Error saveWeights:', err);
    return NextResponse.json({ error: 'Gagal memperbarui bobot: ' + err.message }, { status: 500 });
  }
}
