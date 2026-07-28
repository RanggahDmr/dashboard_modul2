import * as xlsx from 'xlsx';
import { prisma } from '@/lib/prisma';
import { AoKpiExcelRow } from '@/types/ao-kpi';

export async function processAoKpiExcel(
  buffer: Buffer,
  periode: string
): Promise<{ success: boolean; message: string; rowsImported: number; error?: string }> {
  try {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON, treat first row as header, defval null
    const rows: AoKpiExcelRow[] = xlsx.utils.sheet_to_json(sheet, { defval: null });

    if (rows.length === 0) {
      return { success: false, message: 'Import failed.', error: 'Sheet Excel kosong.', rowsImported: 0 };
    }

    // Map rows to db objects
    const dataToInsert = rows
      .filter((row) => {
        // Ignore completely empty rows
        return Object.values(row).some((val) => val !== null && val !== '');
      })
      .map((row) => {
        // Date parsing helper
        const parseDate = (val: any) => {
          if (!val) return null;
          if (val instanceof Date) return val;
          if (typeof val === 'number') {
            // Excel date number
            const date = new Date((val - (25567 + 2)) * 86400 * 1000);
            return isNaN(date.getTime()) ? null : date;
          }
          const parsed = new Date(val);
          return isNaN(parsed.getTime()) ? null : parsed;
        };

        const parseDecimal = (val: any) => {
          if (val === null || val === undefined || val === '') return null;
          const num = Number(val);
          return isNaN(num) ? null : num;
        };

        const parseString = (val: any) => {
          if (val === null || val === undefined) return null;
          return String(val).trim();
        };

        return {
          periode,
          nama_unit: parseString((row as any).nama_unit) || parseString((row as any).Nama_Unit) || parseString((row as any).NamaUnit) || parseString((row as any)['Nama Unit']) || 'Unknown',
          tanggal_tarik: parseDate(row.TanggalTarik),
          cabang_id: parseString(row.CabangId),
          ao_id: parseString(row.AOId),
          nama_ao: parseString(row.NamaAO),
          jumlah_noc: parseDecimal(row.Jumlah_NOC),
          jumlah_noa: parseDecimal(row.Jumlah_NOA),
          os: parseDecimal(row.OS),
          jumlah_lar: parseDecimal(row.Jumlah_LAR),
          jumlah_kelompok: parseDecimal(row.Jumlah_Kelompok),
          penambabahan_lar_baru: parseDecimal(row.Penambabahan_Lar_Baru),
          penambabahan_os_lar_baru: parseDecimal(row.Penambabahan_OS_Lar_Baru),
          os_1a_eom: parseDecimal(row.OS_1A_EOM),
          target_lar_baru: parseDecimal(row.Target_Lar_Baru),
          realisasi_persen_lar_baru: parseDecimal(row.Realisasi_Persen_Lar_Baru),
          pencapaian_lar_baru: parseDecimal(row.Pencapaian_Lar_Baru),
          bobot_pencapaian_lar_baru: parseDecimal(row.Bobot_Pencapaian_Lar_Baru),
          nilai_pencapaian_lar_baru: parseDecimal(row.Nilai_Pencapaian_Lar_Baru),
          target_ao_s1_harian: parseDecimal(row.Target_Ao_S1_Harian),
          target_ao_sl_harian: parseDecimal(row.Target_Ao_SL_Harian),
          realisasi_s1: parseDecimal(row.Realisasi_S1),
          realisasi_sl: parseDecimal(row.Realisasi_SL),
          pencapaian_uk_s1: parseDecimal(row.Pencapaian_UK_S1),
          bobot_uk_s1: parseDecimal(row.Bobot_UK_S1),
          nilai_uk_s1: parseDecimal(row.Nilai_UK_S1),
          pencapaian_uk_sl: parseDecimal(row.Pencapaian_UK_SL),
          bobot_uk_sl: parseDecimal(row.Bobot_UK_SL),
          nilai_uk_sl: parseDecimal(row.Nilai_UK_SL),
          persen_hadir_bayar_full_payment: parseDecimal(row.Persen_Hadir_BayarFullPayment),
          target_persen_hadir_bayar_full_payment: parseDecimal(row.Target_Persen_Hadir_BayarFullPayment),
          pencapaian_hadir_bayar_full_payment: parseDecimal(row.Pencapaian_Hadir_BayarFullPayment),
          bobot_hadir_bayar_full_payment: parseDecimal(row.Bobot_Hadir_BayarFullPayment),
          nilai_hadir_bayar_full_payment: parseDecimal(row.Nilai_Hadir_BayarFullPayment),
          pencairan_s1: parseDecimal(row.Pencairan_S1),
          pencairan_sl: parseDecimal(row.Pencairan_SL),
          persen_pencairan_s1: parseDecimal(row.Persen_Pencairan_S1),
          persen_pencairan_sl: parseDecimal(row.Persen_Pencairan_SL),
          qualifier_s1: parseString(row.Qualifier_S1),
          qualifier_sl: parseString(row.Qualifier_SL),
          pencapaian_uk_s1_new: parseDecimal(row.Pencapaian_UK_S1_New),
          pencapaian_uk_sl_new: parseDecimal(row.Pencapaian_UK_SL_New),
          total_nilai: parseDecimal(row.Total_Nilai),
        };
      });

    if (dataToInsert.length === 0) {
      return { success: false, message: 'Import failed.', error: 'Semua baris kosong atau invalid.', rowsImported: 0 };
    }

    // Insert to DB using batches within transaction
    const BATCH_SIZE = 1500;
    const uniqueUnits = [...new Set(dataToInsert.map(r => r.nama_unit).filter(Boolean))];

    await prisma.$transaction(async (tx: any) => {
      if (uniqueUnits.length > 0) {
        await tx.aoKpiPerformance.deleteMany({
          where: {
            periode,
            nama_unit: {
              in: uniqueUnits
            }
          }
        });
      }

      for (let i = 0; i < dataToInsert.length; i += BATCH_SIZE) {
        const batch = dataToInsert.slice(i, i + BATCH_SIZE);
        await tx.aoKpiPerformance.createMany({
          data: batch,
        });
      }
    }, {
      timeout: 120000
    });

    return {
      success: true,
      message: 'File imported successfully.',
      rowsImported: dataToInsert.length,
    };
  } catch (error: any) {
    console.error('Error importing Excel:', error);
    return {
      success: false,
      message: 'Import failed.',
      error: error.message || 'Unknown error occurred.',
      rowsImported: 0,
    };
  }
}
