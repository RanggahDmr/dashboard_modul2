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

    // 3. Ambil semua baris performa bulanan
    const [perfRows] = await connection.query<RowDataPacket[]>("SELECT id, si_clbk, sl, flowrate, full_payment FROM ao_performance_monthly");
    
    await connection.beginTransaction();
    for (const row of perfRows) {
      const score = (Number(row.si_clbk) * w_si) + 
                    (Number(row.sl) * w_sl) + 
                    (Number(row.flowrate) * w_fr) + 
                    (Number(row.full_payment) * w_fp);
      const roundedScore = Math.round(score * 100) / 100;
      
      let kategori = 'Rendah';
      if (roundedScore >= st_limit) kategori = 'Sangat Tinggi';
      else if (roundedScore >= t_limit) kategori = 'Tinggi';
      else if (roundedScore >= s_limit) kategori = 'Sedang';

      await connection.query(
        "UPDATE ao_performance_monthly SET score_akhir = ?, kategori = ? WHERE id = ?",
        [roundedScore, kategori, row.id]
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
