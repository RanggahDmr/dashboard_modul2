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



    // 3. Ambil semua baris performa (semua periode)
    const [perfRows] = await connection.query<RowDataPacket[]>(`
      SELECT id, pencapaian_uk_s1, pencapaian_uk_sl, pencapaian_lar_baru, pencapaian_hadir_bayar_full_payment 
      FROM ao_kpi_performances
    `);
    
    await connection.beginTransaction();
    for (const row of perfRows) {
      const si = Math.min(120, Math.max(0, Number(row.pencapaian_uk_s1) || 0));
      const sl = Math.min(120, Math.max(0, Number(row.pencapaian_uk_sl) || 0));
      const fr = Math.min(120, Math.max(0, Number(row.pencapaian_lar_baru) || 0));
      const fp = Math.min(120, Math.max(0, Number(row.pencapaian_hadir_bayar_full_payment) || 0));

      const score = (si * w_si) + (sl * w_sl) + (fr * w_fr) + (fp * w_fp);
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
