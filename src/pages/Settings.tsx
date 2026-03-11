import React, { useState, useRef } from 'react';
import { Save, Upload, Download, KeyRound, Database } from 'lucide-react';

export default function Settings() {
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setMessage({ text: 'Password baru harus diisi', type: 'error' });
      return;
    }

    const res = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ newUsername: username, newPassword: password })
    });

    if (res.ok) {
      setMessage({ text: 'Kredensial berhasil diperbarui. Silakan login kembali.', type: 'success' });
      localStorage.setItem('username', username);
      setPassword('');
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }, 2000);
    } else {
      const data = await res.json();
      setMessage({ text: data.error || 'Gagal memperbarui kredensial', type: 'error' });
    }
  };

  const handleBackup = () => {
    window.open('/api/database/backup?token=' + localStorage.getItem('token'), '_blank');
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Peringatan: Restore database akan menimpa semua data saat ini. Lanjutkan?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('database', file);

    const res = await fetch('/api/database/restore', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: formData
    });

    if (res.ok) {
      alert('Database berhasil di-restore. Halaman akan dimuat ulang.');
      window.location.reload();
    } else {
      alert('Gagal me-restore database.');
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Pengaturan Sistem</h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">Kelola akun dan backup data aplikasi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Akun */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-800">Ubah Kredensial</h2>
          </div>
          <div className="p-6">
            {message.text && (
              <div className={`mb-6 px-4 py-3 rounded-xl text-sm ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}
            <form onSubmit={handleUpdateCredentials} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username Baru</label>
                <input 
                  type="text" 
                  required 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  className="w-full rounded-xl border-slate-300 border py-2.5 px-3 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password Baru</label>
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full rounded-xl border-slate-300 border py-2.5 px-3 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50" 
                  placeholder="Masukkan password baru"
                />
              </div>
              <button 
                type="submit" 
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </button>
            </form>
          </div>
        </div>

        {/* Database */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-fit">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <Database className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-800">Backup & Restore</h2>
          </div>
          <div className="p-6 space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed">
              Lakukan backup secara berkala untuk mencegah kehilangan data. File backup berupa format SQLite (.sqlite).
            </p>
            
            <div className="space-y-3">
              <button 
                onClick={handleBackup}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download Backup Database
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 bg-white text-xs text-slate-400 uppercase tracking-wider">Atau</span>
                </div>
              </div>

              <input 
                type="file" 
                accept=".sqlite" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleRestore}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium"
              >
                <Upload className="w-4 h-4" />
                Restore Database
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
