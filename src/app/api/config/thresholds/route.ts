import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { recomputeScores } from '@/lib/recompute';
import { RowDataPacket } from 'mysql2/promise';

export async function GET() {
  try {
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM score_thresholds LIMIT 1");
    if (rows.length === 0) {
      return NextResponse.json({ sangat_tinggi: 90, tinggi: 75, sedang: 60, eligible_insentif: 60 });
    }
    return NextResponse.json(rows[0]);
  } catch (err: any) {
    console.error('Error getThresholds:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sangat_tinggi, tinggi, sedang, eligible_insentif } = body;
    if (sangat_tinggi == null || tinggi == null || sedang == null || eligible_insentif == null) {
      return NextResponse.json({ error: 'Semua threshold harus diisi.' }, { status: 400 });
    }
    if (Number(sangat_tinggi) <= Number(tinggi) || Number(tinggi) <= Number(sedang)) {
      return NextResponse.json({ error: 'Urutan threshold tidak valid: Sangat Tinggi > Tinggi > Sedang.' }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query("DELETE FROM score_thresholds");
      await connection.query(
        "INSERT INTO score_thresholds (sangat_tinggi, tinggi, sedang, eligible_insentif) VALUES (?, ?, ?, ?)",
        [sangat_tinggi, tinggi, sedang, eligible_insentif]
      );
      await connection.commit();
      await recomputeScores(pool);
      return NextResponse.json({ success: true, message: 'Threshold berhasil diperbarui dan kategori AO telah dihitung ulang.' });
    } catch (err: any) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err: any) {
    console.error('Error saveThresholds:', err);
    return NextResponse.json({ error: 'Gagal memperbarui threshold: ' + err.message }, { status: 500 });
  }
}
