import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Filters
    const periode = searchParams.get('periode');
    const nama_unit = searchParams.get('nama_unit');
    const ao_id = searchParams.get('ao_id');
    const nama_ao = searchParams.get('nama_ao');

    const where: any = {};
    if (periode) where.periode = periode;
    if (nama_unit) where.nama_unit = { contains: nama_unit };
    if (ao_id) where.ao_id = { contains: ao_id };
    if (nama_ao) where.nama_ao = { contains: nama_ao };

    const [data, total] = await Promise.all([
      prisma.aoKpiPerformance.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc'
        }
      }),
      prisma.aoKpiPerformance.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching AO KPI:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch data.', 
      error: error.message 
    }, { status: 500 });
  }
}
