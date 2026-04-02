import React, { useState, useRef } from 'react';
import { User, Download, Upload, AlertTriangle, CheckCircle2, Loader2, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getFullBackup, restoreFullBackup } from '../services/db';

export default function Settings() {
  const { user, userData, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const data = await getFullBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_prestasi_siswa_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Backup berhasil diunduh.' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal melakukan backup.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmMessage = 'PERINGATAN: Restore akan MENGHAPUS SEMUA data lama dan menggantinya dengan data dari file backup. Tindakan ini tidak dapat dibatalkan. Lanjutkan?';
    if (!window.confirm(confirmMessage)) {
      e.target.value = '';
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);
          
          // Basic validation
          if (!data || typeof data !== 'object') {
            throw new Error('Format file tidak valid.');
          }

          await restoreFullBackup(data);
          setMessage({ type: 'success', text: 'Restore berhasil! Seluruh data telah diperbarui.' });
        } catch (err) {
          console.error(err);
          setMessage({ type: 'error', text: 'Gagal restore: Pastikan file backup valid.' });
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal membaca file.' });
      setLoading(false);
    }
    e.target.value = '';
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Pengaturan Sistem</h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">Kelola informasi dan data sistem.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Sistem */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <User className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-800">Status Pengguna</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Mode Akses</label>
              <p className="text-slate-900 font-medium">{user ? 'Terautentikasi' : 'Publik (Tanpa Login)'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Peran</label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                userData?.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                userData?.role === 'editor' ? 'bg-blue-100 text-blue-800' : 
                'bg-gray-100 text-gray-800'
              }`}>
                {userData?.role === 'admin' ? 'Administrator (Full Access)' : 
                 userData?.role === 'editor' ? 'Editor (Input & Edit)' : 
                 userData?.role === 'viewer' ? 'Viewer (Hanya Melihat)' : 'Guest'}
              </span>
            </div>
          </div>
        </div>

        {/* Backup & Restore - Only for Admin */}
        {isAdmin && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <Database className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-slate-800">Manajemen Data</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  Cadangkan seluruh data sistem ke dalam file JSON atau pulihkan data dari cadangan sebelumnya.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleBackup}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Backup Full Data
                  </button>
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestore}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Restore Data
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>Peringatan:</strong> Fungsi Restore akan menghapus data yang ada saat ini dan menggantinya dengan data dari file backup. Pastikan file backup Anda benar.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
