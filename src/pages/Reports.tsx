import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Download, Search, FileSpreadsheet } from 'lucide-react';
import { getTransactions, getStudents } from '../services/db';

export default function Reports() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        const [transData, studData] = await Promise.all([
          getTransactions(),
          getStudents()
        ]);

        const enrichedTransactions = transData.map(t => {
          const student = studData.find(s => s.id === t.student_id);
          return {
            ...t,
            student_name: student ? student.name : 'Unknown',
            class_name: student ? student.class_name : 'Unknown'
          };
        });

        setTransactions(enrichedTransactions);
      } catch (err) {
        console.error("Error fetching reports data:", err);
      }
    };

    fetchReportsData();
  }, []);

  const handleDownloadExcel = () => {
    const dataToExport = transactions.map(t => ({
      'Tanggal': t.date,
      'Nama Siswa': t.student_name,
      'Kelas': t.class_name,
      'Jenis Prestasi': t.achievement_type,
      'Nama Lomba': t.competition_name,
      'Juara/Peringkat': t.rank,
      'Wali Kelas': t.homeroom_teacher,
      'Guru BK': t.counseling_teacher
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Prestasi');
    XLSX.writeFile(wb, `Laporan_Prestasi_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredTransactions = transactions.filter(t => 
    t.student_name.toLowerCase().includes(search.toLowerCase()) || 
    t.competition_name.toLowerCase().includes(search.toLowerCase()) ||
    t.class_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Laporan Prestasi</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">Unduh laporan pencapaian siswa dalam format Excel.</p>
        </div>
        <button 
          onClick={handleDownloadExcel}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm font-medium w-full sm:w-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Download Excel
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama, kelas, atau lomba..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                <th className="px-6 py-4 font-medium">Tanggal</th>
                <th className="px-6 py-4 font-medium">Siswa</th>
                <th className="px-6 py-4 font-medium">Prestasi</th>
                <th className="px-6 py-4 font-medium">Guru / BK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">{t.date}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{t.student_name}</p>
                      <p className="text-xs text-slate-500 font-mono">Kls {t.class_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{t.competition_name}</p>
                      <p className="text-xs text-slate-500">{t.achievement_type} - {t.rank}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">Wali: {t.homeroom_teacher}</p>
                      <p className="text-sm text-slate-700">BK: {t.counseling_teacher}</p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    Tidak ada data laporan ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
