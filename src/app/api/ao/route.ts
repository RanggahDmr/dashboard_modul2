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

    const pool = getPool();
    const [tRows] = await pool.query<RowDataPacket[]>("SELECT description, nominal FROM score_thresholds ORDER BY nominal DESC");
    
    let caseSql = "CASE ";
    tRows.forEach((t) => {
      caseSql += `WHEN total_nilai >= ${Number(t.nominal)} THEN '${t.description}' `;
    });
    caseSql += "ELSE 'Tidak Memenuhi' END";

    if (unit && unit !== 'all') {
      whereClauses.push('p.nama_unit = ?');
      params.push(unit);
    }

    if (category && category !== 'all') {
      whereClauses.push(`(${caseSql}) = ?`);
      params.push(category);
    }

    if (search && search.trim() !== '') {
      whereClauses.push('(p.nama_ao LIKE ? OR p.ao_id LIKE ?)');
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const allowedSorts: Record<string, string> = {
      'ao.ao_code': 'p.ao_id',
      'ao.nama': 'p.nama_ao',
      'unit_nama': 'p.nama_unit',
      'si_clbk': 'p.nilai_uk_s1',
      'sl': 'p.nilai_uk_sl',
      'flowrate': 'p.nilai_pencapaian_lar_baru',
      'full_payment': 'p.nilai_hadir_bayar_full_payment',
      'score_akhir': 'p.total_nilai',
      'cat': `(${caseSql})`
    };
    const orderBy = allowedSorts[sortCol] || 'p.ao_id';
    const direction = sortDir.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Hitung total baris
    const countSql = `
      SELECT COUNT(*) as total 
      FROM ao_kpi_performances p
      ${whereSql}
    `;
    const [countRows] = await pool.query<RowDataPacket[]>(countSql, params);
    const total = countRows[0]?.total || 0;

    // Ambil data paginasi
    const dataSql = `
      SELECT 
        p.id as perf_id, p.ao_id, p.nama_unit as unit_id, p.nilai_uk_s1 as si_clbk, p.nilai_uk_sl as sl, p.nilai_pencapaian_lar_baru as flowrate, p.nilai_hadir_bayar_full_payment as full_payment,
        p.total_nilai as score_akhir, (${caseSql}) as cat,
        p.ao_id as ao_code, p.nama_ao, p.nama_unit
      FROM ao_kpi_performances p
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
        nama: r.nama_ao,
        unit_id: r.unit_id,
        unit_nama: r.nama_unit,
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

      // For denormalized table, just insert or update based on ao_id and periode
      const checkSql = "SELECT id FROM ao_kpi_performances WHERE ao_id = ? AND periode = ?";
      const [exist] = await connection.query<RowDataPacket[]>(checkSql, [ao_code, periode]);

      if (exist.length > 0) {
        await connection.query(`
          UPDATE ao_kpi_performances 
          SET nama_ao = ?, nama_unit = ?, nilai_uk_s1 = ?, nilai_uk_sl = ?, nilai_pencapaian_lar_baru = ?, nilai_hadir_bayar_full_payment = ?
          WHERE ao_id = ? AND periode = ?
        `, [nama, unit_id, si_clbk, sl, flowrate, full_payment, ao_code, periode]);
      } else {
        await connection.query(`
          INSERT INTO ao_kpi_performances (
            periode, ao_id, nama_ao, nama_unit, nilai_uk_s1, nilai_uk_sl, nilai_pencapaian_lar_baru, nilai_hadir_bayar_full_payment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [periode, ao_code, nama, unit_id, si_clbk, sl, flowrate, full_payment]);
      }

      await connection.commit();
      
      // recalculate total_nilai after inserting/updating manual data
      await recomputeScores(pool);
      
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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 });
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query("DELETE FROM ao_kpi_performances WHERE ao_id = ?", [id]);
      await connection.commit();
      return NextResponse.json({ success: true, message: 'AO berhasil dihapus' });
    } catch (err: any) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err: any) {
    console.error('Error deleteAO:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

