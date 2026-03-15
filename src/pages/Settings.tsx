import React from 'react';
import { User } from 'lucide-react';

export default function Settings() {
  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Pengaturan Sistem</h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">Informasi sistem.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <User className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-800">Status Sistem</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Mode Akses</label>
            <p className="text-slate-900 font-medium">Publik (Tanpa Login)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Peran</label>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
              Administrator (Akses Penuh)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
