import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Search, Edit2 } from 'lucide-react';
import { getTransactions, getStudents, getHomeroomTeachers, getCounselingTeachers, addTransaction, updateTransaction, deleteTransaction } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

export default function Transactions() {
  const { isEditor, isAdmin } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [homeroomTeachers, setHomeroomTeachers] = useState<any[]>([]);
  const [counselingTeachers, setCounselingTeachers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    student_id: '',
    achievement_type: 'Akademik',
    competition_name: '',
    rank: 'Juara 1',
    level: 'Antar Sekolah',
    homeroom_teacher: '',
    counseling_teacher: '',
    certificate: null as File | null
  });

  const fetchData = async () => {
    try {
      const [transData, studData, homeData, counsData] = await Promise.all([
        getTransactions(),
        getStudents(),
        getHomeroomTeachers(),
        getCounselingTeachers()
      ]);
      
      setTransactions(transData);
      setStudents(studData);
      setHomeroomTeachers(homeData);
      setCounselingTeachers(counsData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert formData to a simple object for Firestore
    const dataToSave = {
      date: formData.date,
      student_id: formData.student_id,
      achievement_type: formData.achievement_type,
      competition_name: formData.competition_name,
      rank: formData.rank,
      level: formData.level,
      homeroom_teacher: formData.homeroom_teacher,
      counseling_teacher: formData.counseling_teacher,
      // For now, we'll just ignore the certificate file or handle it differently
      // In a real app, you'd upload it to Firebase Storage and save the URL
    };

    try {
      if (editingId) {
        await updateTransaction(editingId, dataToSave);
      } else {
        await addTransaction(dataToSave);
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        student_id: '',
        achievement_type: 'Akademik',
        competition_name: '',
        rank: 'Juara 1',
        level: 'Antar Sekolah',
        homeroom_teacher: '',
        counseling_teacher: '',
        certificate: null
      });
      setSelectedClass('');
      fetchData();
    } catch (err) {
      console.error("Error saving transaction:", err);
      alert("Gagal menyimpan transaksi.");
    }
  };

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setSelectedClass(t.class_name);
    setFormData({
      date: t.date,
      student_id: t.student_id.toString(),
      achievement_type: t.achievement_type,
      competition_name: t.competition_name,
      rank: t.rank,
      level: t.level || 'Antar Sekolah',
      homeroom_teacher: t.homeroom_teacher,
      counseling_teacher: t.counseling_teacher,
      certificate: null
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingId) {
      try {
        await deleteTransaction(deletingId);
        setDeletingId(null);
        fetchData();
      } catch (err) {
        console.error("Gagal menghapus transaksi:", err);
        alert("Gagal menghapus transaksi.");
      }
    }
  };

  const enrichedTransactions = transactions.map(t => {
    const student = students.find(s => s.id === t.student_id);
    return {
      ...t,
      student_name: student ? student.name : 'Unknown',
      class_name: student ? student.class_name : 'Unknown'
    };
  });

  const filteredTransactions = enrichedTransactions.filter(t => {
    const matchSearch = (t.student_name || '').toLowerCase().includes(search.toLowerCase()) || 
                        (t.competition_name || '').toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass ? t.class_name === filterClass : true;
    return matchSearch && matchClass;
  });

  const uniqueClasses = Array.from(new Set(students.map(s => s.class_name))).sort();
  const filteredStudents = selectedClass ? students.filter(s => s.class_name === selectedClass) : [];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Data Transaksi Prestasi</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">Catat dan kelola pencapaian siswa.</p>
        </div>
        {isEditor && (
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({
                date: new Date().toISOString().split('T')[0],
                student_id: '',
                achievement_type: 'Akademik',
                competition_name: '',
                rank: 'Juara 1',
                level: 'Antar Sekolah',
                homeroom_teacher: '',
                counseling_teacher: '',
                certificate: null
              });
              setSelectedClass('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Tambah Prestasi
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-4 bg-slate-50/50">
          <div className="relative w-full sm:flex-1 sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama siswa atau lomba..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
            />
          </div>
          <div className="w-full sm:w-auto">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full sm:w-48 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm bg-white"
            >
              <option value="">Semua Kelas</option>
              {uniqueClasses.map((cls: any) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="border-b border-slate-100 text-slate-500 text-sm">
                <th className="px-6 py-4 font-medium bg-slate-50">Tanggal</th>
                <th className="px-6 py-4 font-medium bg-slate-50">Siswa</th>
                <th className="px-6 py-4 font-medium bg-slate-50">Jenis</th>
                <th className="px-6 py-4 font-medium bg-slate-50">Lomba</th>
                <th className="px-6 py-4 font-medium bg-slate-50">Tingkat</th>
                <th className="px-6 py-4 font-medium bg-slate-50">Peringkat</th>
                <th className="px-6 py-4 font-medium bg-slate-50">Sertifikat</th>
                {isEditor && <th className="px-6 py-4 font-medium text-right bg-slate-50">Aksi</th>}
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        t.achievement_type === 'Akademik' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {t.achievement_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{t.competition_name}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{t.level || '-'}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{t.rank}</td>
                    <td className="px-6 py-4">
                      {t.certificate_file ? (
                        <a href={t.certificate_file} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm font-medium">
                          <FileText className="w-4 h-4" /> Lihat
                        </a>
                      ) : (
                        <span className="text-slate-400 text-sm italic">-</span>
                      )}
                    </td>
                    {isEditor && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(t)}
                            className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button 
                              onClick={() => setDeletingId(t.id)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Tidak ada data prestasi ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit Prestasi */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">{editingId ? 'Edit Prestasi Siswa' : 'Tambah Prestasi Siswa'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <form id="prestasiForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full rounded-xl border-slate-300 border py-1.5 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Pilih Kelas</label>
                    <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setFormData({...formData, student_id: ''}); }} className="w-full rounded-xl border-slate-300 border py-1.5 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="">Pilih Kelas...</option>
                      {uniqueClasses.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Siswa</label>
                    <select required value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})} disabled={!selectedClass} className="w-full rounded-xl border-slate-300 border py-1.5 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100">
                      <option value="">Pilih Siswa...</option>
                      {filteredStudents.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Jenis Prestasi</label>
                    <select required value={formData.achievement_type} onChange={e => setFormData({...formData, achievement_type: e.target.value})} className="w-full rounded-xl border-slate-300 border py-1.5 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="Akademik">Akademik</option>
                      <option value="Non Akademik">Non Akademik</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Nama Lomba</label>
                    <input type="text" required value={formData.competition_name} onChange={e => setFormData({...formData, competition_name: e.target.value})} className="w-full rounded-xl border-slate-300 border py-1.5 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Contoh: Olimpiade Sains Nasional" />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Juara / Peringkat</label>
                    <select required value={formData.rank} onChange={e => setFormData({...formData, rank: e.target.value})} className="w-full rounded-xl border-slate-300 border py-1.5 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                      {['Juara 1', 'Juara 2', 'Juara 3', 'Harapan 1', 'Harapan 2', 'Harapan 3', 'Partisipasi'].map(rank => (
                        <option key={rank} value={rank}>{rank}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Tingkat Lomba</label>
                    <select required value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} className="w-full rounded-xl border-slate-300 border py-1.5 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="Antar Sekolah">Antar Sekolah</option>
                      <option value="Kabupaten/Kota">Kabupaten/Kota</option>
                      <option value="Propinsi">Propinsi</option>
                      <option value="Nasional">Nasional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Bukti Sertifikat</label>
                    <input type="file" accept="image/*,.pdf" onChange={e => setFormData({...formData, certificate: e.target.files?.[0] || null})} className="w-full rounded-xl border-slate-300 border py-1.5 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Nama Wali Kelas</label>
                    <select required value={formData.homeroom_teacher} onChange={e => setFormData({...formData, homeroom_teacher: e.target.value})} className="w-full rounded-xl border-slate-300 border py-1.5 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="">Pilih Wali Kelas...</option>
                      {homeroomTeachers.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Nama Guru BK</label>
                    <select required value={formData.counseling_teacher} onChange={e => setFormData({...formData, counseling_teacher: e.target.value})} className="w-full rounded-xl border-slate-300 border py-1.5 px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="">Pilih Guru BK...</option>
                      {counselingTeachers.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </form>
            </div>
            <div className="p-4 sm:p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm sm:text-base text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 font-medium">Batal</button>
              <button type="submit" form="prestasiForm" className="px-4 py-2 text-sm sm:text-base text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 font-medium shadow-sm">Simpan Data</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deletingId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Hapus Data Prestasi?</h2>
              <p className="text-slate-500">Apakah Anda yakin ingin menghapus data prestasi ini? Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button onClick={() => setDeletingId(null)} className="flex-1 px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 font-medium">Batal</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 text-white bg-red-600 rounded-xl hover:bg-red-700 font-medium shadow-sm">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
