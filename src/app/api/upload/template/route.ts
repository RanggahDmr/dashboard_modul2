import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';

export async function GET() {
  try {
    const data = [
      {
        TanggalTarik: "2023-01-01",
        CabangId: "C001",
        AOId: "AO001",
        NamaAO: "Siti Nurhaliza",
        Jumlah_NOC: 10,
        Jumlah_NOA: 10,
        OS: 10000000,
        Jumlah_LAR: 0,
        Jumlah_Kelompok: 5,
        Penambabahan_Lar_Baru: 0,
        Penambabahan_OS_Lar_Baru: 0,
        OS_1A_EOM: 10000000,
        Target_Lar_Baru: 0,
        Realisasi_Persen_Lar_Baru: 0,
        Pencapaian_Lar_Baru: 0,
        Bobot_Pencapaian_Lar_Baru: 0,
        Nilai_Pencapaian_Lar_Baru: 0,
        Target_Ao_S1_Harian: 0,
        Target_Ao_SL_Harian: 0,
        Realisasi_S1: 0,
        Realisasi_SL: 0,
        Pencapaian_UK_S1: 0,
        Bobot_UK_S1: 0,
        Nilai_UK_S1: 0,
        Pencapaian_UK_SL: 0,
        Bobot_UK_SL: 0,
        Nilai_UK_SL: 0,
        Persen_Hadir_BayarFullPayment: 0,
        Target_Persen_Hadir_BayarFullPayment: 0,
        Pencapaian_Hadir_BayarFullPayment: 0,
        Bobot_Hadir_BayarFullPayment: 0,
        Nilai_Hadir_BayarFullPayment: 0,
        Pencairan_S1: 0,
        Pencairan_SL: 0,
        Persen_Pencairan_S1: 0,
        Persen_Pencairan_SL: 0,
        Qualifier_S1: "LULUS",
        Qualifier_SL: "LULUS",
        Pencapaian_UK_S1_New: 0,
        Pencapaian_UK_SL_New: 0,
        Total_Nilai: 100
      }
    ];
    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Template_AO");
    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="Template_Upload_AO.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
  } catch (err: any) {
    console.error('Error downloadTemplate:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
