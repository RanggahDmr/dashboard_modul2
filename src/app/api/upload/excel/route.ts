import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { recomputeScores } from '@/lib/recompute';
import * as xlsx from 'xlsx';
import { RowDataPacket } from 'mysql2/promise';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file Excel yang diunggah.' }, { status: 400 });
    }

    const periode = (formData.get('periode') as string) || '2026-06';
    const uploadedBy = (formData.get('uploaded_by') as string) || 'Administrator';
    const filename = file.name;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Sheet Excel kosong atau format tidak dikenali.' }, { status: 400 });
    }

    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Load semua unit ke memori untuk pencarian cepat
      const [unitRows] = await connection.query<RowDataPacket[]>("SELECT id, nama, kode_unit FROM units");
      const unitMap = new Map<string, number>();
      unitRows.forEach(u => unitMap.set(String(u.nama).trim().toLowerCase(), u.id));

      // 2. Load semua ao_master ke memori
      const [aoRows] = await connection.query<RowDataPacket[]>("SELECT id, ao_code FROM ao_master");
      const aoMap = new Map<string, number>();
      aoRows.forEach(a => aoMap.set(String(a.ao_code).trim().toUpperCase(), a.id));

      let successCount = 0;
      let failedCount = 0;
      const errorDetails: string[] = [];

      // 3. Iterasi baris excel dan proses upsert
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; 
        const aoCode = (row['AO_ID'] || row['Kode AO'] || row['AO CODE'] || '') + '';
        const nama = row['Nama_AO'] || row['Nama AO'] || row['NAMA'] || '';
        const unitNama = row['Unit_Kerja'] || row['Unit Kerja'] || row['UNIT'] || '';

        if (!aoCode.trim() || !nama.trim() || !unitNama.trim()) {
          failedCount++;
          errorDetails.push(`Baris ${rowNum}: AO_ID, Nama_AO, atau Unit_Kerja kosong.`);
          continue;
        }

        // Resolusi Unit Kerja
        let unitId = unitMap.get(unitNama.trim().toLowerCase());
        if (!unitId) {
          const [resUnit]: any = await connection.query("INSERT INTO units (nama) VALUES (?)", [unitNama.trim()]);
          unitId = resUnit.insertId;
          unitMap.set(unitNama.trim().toLowerCase(), unitId!);
        }

        // Resolusi AO Master
        const cleanCode = aoCode.trim().toUpperCase();
        let aoId = aoMap.get(cleanCode);
        if (!aoId) {
          const [resAo]: any = await connection.query(
            "INSERT INTO ao_master (ao_code, nama, unit_id) VALUES (?, ?, ?)",
            [cleanCode, nama.trim(), unitId]
          );
          aoId = resAo.insertId;
          aoMap.set(cleanCode, aoId!);
        } else {
          await connection.query("UPDATE ao_master SET nama = ?, unit_id = ? WHERE id = ?", [nama.trim(), unitId, aoId]);
        }

        // Ambil nilai KPI (default 0 jika tidak valid)
        const si = parseFloat(row['SI_CLBK'] || row['SI/CLBK'] || 0) || 0;
        const sl = parseFloat(row['SL'] || 0) || 0;
        const fr = parseFloat(row['Flowrate'] || row['FLOWRATE'] || 0) || 0;
        const fp = parseFloat(row['Full_Payment'] || row['Full Payment'] || row['FP'] || 0) || 0;

        const si_flag = parseInt(row['SI_Flag'] || 0, 10) || 0;
        const sl_flag = parseInt(row['SL_Flag'] || 0, 10) || 0;
        const fr_flag = parseInt(row['FR_Flag'] || 0, 10) || 0;
        const fp_flag = parseInt(row['FP_Flag'] || 0, 10) || 0;

        // Upsert ke ao_performance_monthly
        await connection.query(`
          INSERT INTO ao_performance_monthly (
            periode, ao_id, unit_id, si_clbk, sl, flowrate, full_payment,
            si_flag, sl_flag, fr_flag, fp_flag
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            unit_id = VALUES(unit_id), si_clbk = VALUES(si_clbk), sl = VALUES(sl),
            flowrate = VALUES(flowrate), full_payment = VALUES(full_payment),
            si_flag = VALUES(si_flag), sl_flag = VALUES(sl_flag),
            fr_flag = VALUES(fr_flag), fp_flag = VALUES(fp_flag)
        `, [periode, aoId, unitId, si, sl, fr, fp, si_flag, sl_flag, fr_flag, fp_flag]);

        successCount++;
      }

      // 4. Catat ke tabel upload_logs
      const errorLogStr = errorDetails.length > 0 ? JSON.stringify(errorDetails) : null;
      await connection.query(`
        INSERT INTO upload_logs (filename, periode, total_rows, success_rows, failed_rows, error_log, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [filename, periode, rows.length, successCount, failedCount, errorLogStr, uploadedBy]);

      await connection.commit();

      // 5. Hitung ulang seluruh skor akhir dan kategori
      await recomputeScores(pool);

      return NextResponse.json({
        success: true,
        message: `Upload selesai. ${successCount} baris berhasil, ${failedCount} baris gagal.`,
        stats: {
          totalRows: rows.length,
          successRows: successCount,
          failedRows: failedCount,
          errors: errorDetails.slice(0, 10)
        }
      });
    } catch (err: any) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err: any) {
    console.error('Error uploadExcel:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem saat memproses file Excel: ' + err.message }, { status: 500 });
  }
}
