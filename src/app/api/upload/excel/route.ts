import { NextRequest, NextResponse } from 'next/server';
import { aoKpiUploadSchema } from '@/schemas/ao-kpi-upload.schema';
import { processAoKpiExcel } from '@/services/ao-kpi-import.service';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Parse form data to object for validation
    const file = formData.get('file');
    const periode = formData.get('periode');
    const nama_unit = formData.get('nama_unit');

    // Validation
    const validationResult = aoKpiUploadSchema.safeParse({
      file,
      periode,
      nama_unit,
    });

    if (!validationResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: 'Import failed.', 
        error: validationResult.error.issues.map((e: any) => e.message).join(', ') 
      }, { status: 400 });
    }

    const validData = validationResult.data;
    const validFile = validData.file;

    // Check extension
    const extension = validFile.name.split('.').pop()?.toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls') {
      return NextResponse.json({ 
        success: false, 
        message: 'Import failed.', 
        error: 'Only .xlsx and .xls files are allowed.' 
      }, { status: 400 });
    }

    const arrayBuffer = await validFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await processAoKpiExcel(buffer, validData.periode, validData.nama_unit);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        periode: validData.periode,
        nama_unit: validData.nama_unit,
        rowsImported: result.rowsImported,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message,
        error: result.error,
      }, { status: 500 });
    }

  } catch (err: any) {
    console.error('Error in upload route:', err);
    return NextResponse.json({ 
      success: false, 
      message: 'Import failed.', 
      error: err.message 
    }, { status: 500 });
  }
}
