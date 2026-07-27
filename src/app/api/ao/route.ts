import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { recomputeScores } from '@/lib/recompute';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const unit = searchParams.get('unit') || 'all';
    const category = searchParams.get('category') || 'all';
    const sortCol = searchParams.get('sortCol') || 'ao_code';
    const sortDir = searchParams.get('sortDir') || 'asc';
    const periode = searchParams.get('periode') || '2026-06';

    const offset = (page - 1) * limit;
    const params: any[] = [periode];
    let whereClauses = ['p.periode = ?'];

    if (unit && unit !== 'all') {
      whereClauses.push('p.unit_id = ?');
      params.push(parseInt(unit, 10));
    }

    if (category && category !== 'all') {
      whereClauses.push('p.kategori = ?');
      params.push(category);
    }

    if (search && search.trim() !== '') {
      whereClauses.push('(m.nama LIKE ? OR m.ao_code LIKE ?)');
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const allowedSorts: Record<string, string> = {
      'ao.ao_code': 'm.ao_code',
      'ao.nama': 'm.nama',
      'unit_nama': 'u.nama',
      'si_clbk': 'p.si_clbk',
      'sl': 'p.sl',
      'flowrate': 'p.flowrate',
      'full_payment': 'p.full_payment',
      'score_akhir': 'p.score_akhir',
      'cat': 'p.kategori'
    };
    const orderBy = allowedSorts[sortCol] || 'm.ao_code';
    const direction = sortDir.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const pool = getPool();

    // Hitung total baris
    const countSql = `
      SELECT COUNT(*) as total 
      FROM ao_performance_monthly p
      JOIN ao_master m ON p.ao_id = m.id
      JOIN units u ON p.unit_id = u.id
      ${whereSql}
    `;
    const [countRows] = await pool.query<RowDataPacket[]>(countSql, params);
    const total = countRows[0]?.total || 0;

    // Ambil data paginasi
    const dataSql = `
      SELECT 
        p.id as perf_id, p.ao_id, p.unit_id, p.si_clbk, p.sl, p.flowrate, p.full_payment,
        p.score_akhir, p.kategori as cat,
        m.ao_code, m.nama as ao_nama, u.nama as unit_nama
      FROM ao_performance_monthly p
      JOIN ao_master m ON p.ao_id = m.id
      JOIN units u ON p.unit_id = u.id
      ${whereSql}
      ORDER BY ${orderBy} ${direction}
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query<RowDataPacket[]>(dataSql, [...params, limit, offset]);

    return NextResponse.json({
      data: rows.map(r => ({
        id: r.ao_id,
        perf_id: r.perf_id,
        ao_code: r.ao_code,
        nama: r.ao_nama,
        unit_id: r.unit_id,
        unit_nama: r.unit_nama,
        si_clbk: Number(r.si_clbk),
        sl: Number(r.sl),
        flowrate: Number(r.flowrate),
        full_payment: Number(r.full_payment),
        score_akhir: Number(r.score_akhir),
        cat: r.cat
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err: any) {
    console.error('Error getList:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ao_code, nama, unit_id, si_clbk = 80, sl = 80, flowrate = 80, full_payment = 80, periode = '2026-06' } = body;

    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Cek apakah AO code sudah ada
      const [exist] = await connection.query<RowDataPacket[]>("SELECT id FROM ao_master WHERE ao_code = ?", [ao_code]);
      let aoId: number;
      if (exist.length > 0) {
        aoId = exist[0].id;
        await connection.query("UPDATE ao_master SET nama = ?, unit_id = ? WHERE id = ?", [nama, unit_id, aoId]);
      } else {
        const [resMaster]: any = await connection.query("INSERT INTO ao_master (ao_code, nama, unit_id) VALUES (?, ?, ?)", [ao_code, nama, unit_id]);
        aoId = resMaster.insertId;
      }

      // Insert ke bulanan
      await connection.query(`
        INSERT INTO ao_performance_monthly (periode, ao_id, unit_id, si_clbk, sl, flowrate, full_payment)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          unit_id = VALUES(unit_id), si_clbk = VALUES(si_clbk), sl = VALUES(sl),
          flowrate = VALUES(flowrate), full_payment = VALUES(full_payment)
      `, [periode, aoId, unit_id, si_clbk, sl, flowrate, full_payment]);

      await connection.commit();
      await recomputeScores(pool); // hitung ulang skor
      return NextResponse.json({ success: true, message: 'Data AO berhasil ditambahkan/diupdate.' });
    } catch (err: any) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err: any) {
    console.error('Error createAO:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
