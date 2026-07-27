'use client';

import React, { useState } from 'react';
import { Search, Trophy, ArrowUpDown, ChevronLeft, ChevronRight, Filter, ShieldAlert } from 'lucide-react';
import { AOPerformance } from '@/types/ao';
import { motion } from 'framer-motion';

interface RankingTableProps {
  data: AOPerformance[];
  loading?: boolean;
  onRefresh?: () => void;
}

export default function RankingTable({ data, loading = false }: RankingTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter Data
  const filteredData = data.filter((item) => {
    const matchesSearch =
      (item.nama_ao || item.ao_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.unit_nama || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.kategori === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getCategoryBadge = (kategori: string) => {
    switch (kategori) {
      case 'Sangat Tinggi':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Tinggi':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Sedang':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Rendah':
      default:
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };

  const getRankBadge = (idx: number, page: number) => {
    const rankNum = (page - 1) * itemsPerPage + idx + 1;
    if (rankNum === 1) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/50">1 👑</span>;
    if (rankNum === 2) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black shadow-md">2 🥈</span>;
    if (rankNum === 3) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-black shadow-md">3 🥉</span>;
    return <span className="font-bold text-slate-400">#{rankNum}</span>;
  };

  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700/60 shadow-xl backdrop-blur-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-6 border-b border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
            Peringkat Performa Account Officer (AO)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Menampilkan daftar peringkat pencapaian akhir dari tertinggi ke terendah
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, kode, unit..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-900/90 text-slate-200 text-sm font-medium pl-9 pr-4 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full sm:w-64 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">⚡ Semua Kategori</option>
              <option value="Sangat Tinggi" className="bg-slate-900">🌟 Sangat Tinggi (≥90)</option>
              <option value="Tinggi" className="bg-slate-900">🚀 Tinggi (75-89)</option>
              <option value="Sedang" className="bg-slate-900">⭐ Sedang (60-74)</option>
              <option value="Rendah" className="bg-slate-900">⚠️ Rendah (&lt;60)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/60 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-700/60">
              <th className="py-4 px-6 text-center w-16">Rank</th>
              <th className="py-4 px-4">Account Officer</th>
              <th className="py-4 px-4">Unit Kerja</th>
              <th className="py-4 px-3 text-right">SI / CLBK</th>
              <th className="py-4 px-3 text-right">SL</th>
              <th className="py-4 px-3 text-right">Flowrate</th>
              <th className="py-4 px-3 text-right">Full Payment</th>
              <th className="py-4 px-4 text-right">Skor Akhir</th>
              <th className="py-4 px-6 text-center">Kategori</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm font-medium text-slate-300">
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={9} className="py-6 px-6">
                    <div className="h-6 bg-slate-800/60 rounded-lg w-full" />
                  </td>
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                  <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  Tidak ditemukan data AO yang sesuai dengan filter pencarian.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <motion.tr
                  key={row.ao_code || idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="py-4 px-6 text-center whitespace-nowrap">
                    {getRankBadge(idx, currentPage)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {row.nama_ao || 'N/A'}
                    </div>
                    <div className="text-xs font-semibold text-slate-400 mt-0.5">{row.ao_code || 'N/A'}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-700">
                      {row.unit_nama || 'N/A'}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-right font-semibold text-slate-300">{Number(row.si_clbk || 0).toFixed(1)}</td>
                  <td className="py-4 px-3 text-right font-semibold text-slate-300">{Number(row.sl || 0).toFixed(1)}</td>
                  <td className="py-4 px-3 text-right font-semibold text-slate-300">{Number(row.flowrate || 0).toFixed(1)}</td>
                  <td className="py-4 px-3 text-right font-semibold text-slate-300">{Number(row.full_payment || 0).toFixed(1)}</td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-base font-extrabold text-white bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/20">
                      {Number(row.score_akhir || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getCategoryBadge(row.kategori)}`}>
                      {row.kategori}
                    </span>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && filteredData.length > 0 && (
        <div className="p-4 bg-slate-900/60 border-t border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-400">
          <div>
            Menampilkan <span className="text-white font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-white font-bold">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> dari total <span className="text-white font-bold">{filteredData.length}</span> AO
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold">
              Hal {currentPage} / {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
