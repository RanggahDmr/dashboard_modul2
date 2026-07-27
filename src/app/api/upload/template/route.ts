import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';

export async function GET() {
  try {
    const data = [
      {
        AO_ID: "AO0001",
        Nama_AO: "Siti Nurhaliza",
        Unit_Kerja: "Unit Bandung 01",
        SI_CLBK: 95.5,
        SL: 88.0,
        Flowrate: 75.0,
        Full_Payment: 92.0,
        SI_Flag: 0,
        SL_Flag: 0,
        FR_Flag: 0,
        FP_Flag: 0
      },
      {
        AO_ID: "AO0002",
        Nama_AO: "Budi Santoso",
        Unit_Kerja: "Unit Surabaya 01",
        SI_CLBK: 80.0,
        SL: 85.0,
        Flowrate: 60.5,
        Full_Payment: 89.0,
        SI_Flag: 0,
        SL_Flag: 0,
        FR_Flag: 0,
        FP_Flag: 0
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
