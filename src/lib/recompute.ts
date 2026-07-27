import { Pool, RowDataPacket } from 'mysql2/promise';

export async function recomputeScores(dbPool: Pool): Promise<void> {
  const connection = await dbPool.getConnection();
  try {
    // 1. Ambil bobot aktif
    const [wRows] = await connection.query<RowDataPacket[]>("SELECT * FROM kpi_weights WHERE periode = 'ALL' LIMIT 1");
    const w = wRows[0] || { w_si: 30, w_sl: 30, w_fr: 20, w_fp: 20 };
    const w_si = Number(w.w_si) / 100;
    const w_sl = Number(w.w_sl) / 100;
    const w_fr = Number(w.w_fr) / 100;
    const w_fp = Number(w.w_fp) / 100;

    // 2. Ambil thresholds aktif
    const [tRows] = await connection.query<RowDataPacket[]>("SELECT * FROM score_thresholds LIMIT 1");
    const t = tRows[0] || { sangat_tinggi: 90, tinggi: 75, sedang: 60 };
    const st_limit = Number(t.sangat_tinggi);
    const t_limit = Number(t.tinggi);
    const s_limit = Number(t.sedang);

    // 3. Ambil semua baris performa (semua periode)
    const [perfRows] = await connection.query<RowDataPacket[]>(`
      SELECT id, nilai_uk_s1, nilai_uk_sl, nilai_pencapaian_lar_baru, nilai_hadir_bayar_full_payment 
      FROM ao_kpi_performances
    `);
    
    await connection.beginTransaction();
    for (const row of perfRows) {
      const score = (Number(row.nilai_uk_s1) * w_si) + 
                    (Number(row.nilai_uk_sl) * w_sl) + 
                    (Number(row.nilai_pencapaian_lar_baru) * w_fr) + 
                    (Number(row.nilai_hadir_bayar_full_payment) * w_fp);
      const roundedScore = Math.round(score * 100) / 100;

      await connection.query(
        "UPDATE ao_kpi_performances SET total_nilai = ? WHERE id = ?",
        [roundedScore, row.id]
      );
    }
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}
