import React from 'react';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function Settings() {
  const { user, isAdmin } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Pengaturan Sistem</h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">Kelola akun Anda.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <User className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-800">Profil Pengguna</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Nama</label>
            <p className="text-slate-900 font-medium">{user?.displayName || 'Tidak ada nama'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Email</label>
            <p className="text-slate-900 font-medium">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Peran</label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isAdmin ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {isAdmin ? 'Administrator' : 'Pengguna'}
            </span>
          </div>
          
          <div className="pt-6 border-t border-slate-100 mt-6">
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              Keluar (Logout)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
