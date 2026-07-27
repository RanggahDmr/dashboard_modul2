'use client';

import React, { useState, useEffect } from 'react';
import { X, UploadCloud, Download, CheckCircle2, AlertCircle, FileSpreadsheet, History, RefreshCw } from 'lucide-react';
import { UploadLog } from '@/types/ao';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [periode, setPeriode] = useState('2026-06');
  const [uploadedBy, setUploadedBy] = useState('Administrator');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [logs, setLogs] = useState<UploadLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/upload/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      setMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage({ type: 'error', text: 'Pilih file Excel (.xlsx / .xls) terlebih dahulu.' });
      return;
    }

    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('periode', periode);
    formData.append('uploaded_by', uploadedBy);

    try {
      const res = await fetch('/api/upload/excel', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Upload dan kalkulasi skor berhasil!' });
        setFile(null);
        fetchLogs();
        onSuccess();
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal memproses file Excel.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan koneksi saat mengunggah: ' + err.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Upload Data Excel AO</h2>
              <p className="text-xs font-medium text-slate-400">
                Unggah file spreadsheet bulanan untuk kalkulasi skor otomatis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Template Download Alert */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-blue-900/20 to-slate-900 border border-indigo-500/30">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-indigo-400" />
              <div className="text-xs font-medium">
                <span className="text-white font-bold">Belum punya format Excel?</span>
                <p className="text-slate-300">Unduh template standar dengan kolom dan flag yang sesuai.</p>
              </div>
            </div>
            <a
              href="/api/upload/template"
              download="Template_Upload_AO.xlsx"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh Template
            </a>
          </div>

          {/* Upload Form */}
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Periode Laporan
                </label>
                <input
                  type="month"
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value)}
                  required
                  className="w-full bg-slate-800/80 text-white font-semibold rounded-xl px-4 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Pengunggah (Admin)
                </label>
                <input
                  type="text"
                  value={uploadedBy}
                  onChange={(e) => setUploadedBy(e.target.value)}
                  required
                  className="w-full bg-slate-800/80 text-white font-semibold rounded-xl px-4 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Drop Zone */}
            <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-8 text-center bg-slate-900/40 hover:bg-slate-900/80 transition-all group cursor-pointer">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <div className="p-4 rounded-full bg-slate-800 text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all mb-3">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-white">
                  {file ? file.name : 'Klik atau seret file Excel (.xlsx / .xls) ke sini'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {file ? `Ukuran: ${(file.size / 1024).toFixed(1)} KB` : 'Batas ukuran: Tidak terbatas (Kalkulasi memori dioptimalkan)'}
                </p>
              </div>
            </div>

            {/* Alert Message */}
            {message && (
              <div
                className={`flex items-center gap-3 p-4 rounded-xl border text-xs font-medium ${
                  message.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sedang Memproses & Menghitung Skor...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Proses & Simpan Data Excel</span>
                </>
              )}
            </button>
          </form>

          {/* Audit Logs Section */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                Riwayat Upload Terakhir (Audit Logs)
              </h3>
              <button
                onClick={fetchLogs}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loadingLogs ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">File / Periode</th>
                    <th className="py-2.5 px-3 text-right">Sukses</th>
                    <th className="py-2.5 px-3 text-right">Gagal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">
                        Belum ada riwayat upload dicatat.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                          {new Date(log.uploaded_at).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-white truncate max-w-[200px]">{log.filename}</div>
                          <div className="text-[10px] text-indigo-400 font-semibold">{log.periode}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-emerald-400">{log.success_rows}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-red-400">{log.failed_rows}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
