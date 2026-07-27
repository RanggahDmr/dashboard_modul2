import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await prisma.aoKpiPerformance.findUnique({
      where: { id: parseInt(id) },
    });

    if (!data) {
      return NextResponse.json({ success: false, message: 'Data not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Error retrieving data.', error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if exists first
    const exists = await prisma.aoKpiPerformance.findUnique({
      where: { id: parseInt(id) },
    });

    if (!exists) {
      return NextResponse.json({ success: false, message: 'Data not found.' }, { status: 404 });
    }

    await prisma.aoKpiPerformance.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true, message: 'Data deleted successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Error deleting data.', error: error.message }, { status: 500 });
  }
}
