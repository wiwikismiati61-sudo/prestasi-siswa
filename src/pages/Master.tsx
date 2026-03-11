import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Plus, Trash2, Search } from 'lucide-react';

export default function Master() {
  const [activeTab, setActiveTab] = useState<'siswa' | 'walikelas' | 'bk'>('siswa');
  const [students, setStudents] = useState<any[]>([]);
  const [homeroomTeachers, setHomeroomTeachers] = useState<any[]>([]);
  const [counselingTeachers, setCounselingTeachers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const teacherFileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const [studRes, homeRes, counsRes] = await Promise.all([
        fetch('/api/students', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/homeroom_teachers', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch('/api/counseling_teachers', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      ]);
      
      if (studRes.status === 401 || studRes.status === 403) {
        alert('Sesi Anda telah berakhir. Silakan login kembali.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      const studData = await studRes.json();
      const homeData = await homeRes.json();
      const counsData = await counsRes.json();
      
      if (Array.isArray(studData)) setStudents(studData);
      if (Array.isArray(homeData)) setHomeroomTeachers(homeData);
      if (Array.isArray(counsData)) setCounselingTeachers(counsData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const dataBuffer = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(dataBuffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      if (data.length === 0) {
        alert('File Excel kosong.');
        return;
      }

      // Find header row or assume no headers
      let headerRowIndex = 0;
      let nameColIndex = -1;
      let classColIndex = -1;
      let nisColIndex = -1;

      // Look for headers in the first 5 rows
      for (let i = 0; i < Math.min(5, data.length); i++) {
        const row = data[i];
        if (!Array.isArray(row)) continue;
        
        const findCol = (searchTerms: string[]) => row.findIndex(cell => 
          typeof cell === 'string' && searchTerms.some(term => cell.toLowerCase().replace(/[^a-z0-9]/g, '').includes(term))
        );

        const nIdx = findCol(['nama', 'name', 'siswa', 'student']);
        const cIdx = findCol(['kelas', 'class', 'rombel', 'tingkat']);
        const nisIdx = findCol(['nis', 'nomorinduk', 'noinduk']);

        if (nIdx !== -1) {
          headerRowIndex = i;
          nameColIndex = nIdx;
          classColIndex = cIdx;
          nisColIndex = nisIdx;
          break;
        }
      }

      let startIndex = headerRowIndex + 1;
      
      // If no headers found, assume column 0 is name, column 1 is class
      if (nameColIndex === -1) {
        nameColIndex = 0;
        classColIndex = 1;
        startIndex = 0; // Start from first row since no headers
      }

      const formattedData = [];
      for (let i = startIndex; i < data.length; i++) {
        const row = data[i];
        if (!Array.isArray(row) || row.length === 0) continue;

        const nameVal = row[nameColIndex];
        const classVal = classColIndex !== -1 ? row[classColIndex] : '';
        const nisVal = nisColIndex !== -1 ? row[nisColIndex] : '';

        const nameStr = String(nameVal || '').trim();
        if (nameStr && nameStr !== 'undefined' && nameStr !== 'null') {
          const cleanNis = String(nisVal || '').trim();
          formattedData.push({
            nis: cleanNis || `GEN-${Date.now()}-${i}`,
            name: nameStr,
            class_name: String(classVal || '').trim()
          });
        }
      }

      if (formattedData.length > 0) {
        try {
          const res = await fetch('/api/students/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ students: formattedData })
          });
          
          if (res.ok) {
            fetchData();
            alert(`Berhasil mengunggah ${formattedData.length} data siswa.`);
          } else if (res.status === 401 || res.status === 403) {
            alert('Sesi Anda telah berakhir. Silakan login kembali.');
            localStorage.removeItem('token');
            window.location.href = '/login';
          } else {
            alert('Gagal menyimpan data ke server.');
          }
        } catch (err) {
          console.error(err);
          alert('Terjadi kesalahan jaringan saat mengunggah.');
        }
      } else {
        alert('Format Excel tidak sesuai atau data kosong. Pastikan ada kolom Nama dan Kelas.');
      }
      } catch (e) {
        console.error(e);
        alert('Gagal membaca file Excel. Pastikan format file benar (.xlsx atau .xls).');
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileUploadTeachers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const dataBuffer = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(dataBuffer, { type: 'array' });
        
        let wsname = wb.SheetNames[0];
        if (activeTab === 'bk' && wb.SheetNames.includes('BK')) {
          wsname = 'BK';
        } else if (activeTab === 'walikelas' && wb.SheetNames.includes('WaliKelas')) {
          wsname = 'WaliKelas';
        }
        
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (data.length === 0) {
          alert('File Excel kosong.');
          return;
        }

        let nameColIndex = -1;
        for (let i = 0; i < Math.min(5, data.length); i++) {
          const row = data[i];
          if (!Array.isArray(row)) continue;
          const nIdx = row.findIndex(cell => typeof cell === 'string' && ['nama', 'name', 'guru', 'teacher'].some(term => cell.toLowerCase().replace(/[^a-z0-9]/g, '').includes(term)));
          if (nIdx !== -1) {
            nameColIndex = nIdx;
            break;
          }
        }

        if (nameColIndex === -1) nameColIndex = 0;

        const formattedData = [];
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!Array.isArray(row) || row.length === 0) continue;
          const nameStr = String(row[nameColIndex] || '').trim();
          if (nameStr && nameStr !== 'undefined' && nameStr !== 'null') {
            formattedData.push({ name: nameStr });
          }
        }

        if (formattedData.length > 0) {
          try {
            const endpoint = activeTab === 'bk' ? '/api/counseling_teachers/bulk' : '/api/homeroom_teachers/bulk';
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ teachers: formattedData })
            });
            
            if (res.ok) {
              fetchData();
              alert(`Berhasil mengunggah ${formattedData.length} data guru.`);
            } else {
              alert('Gagal menyimpan data ke server.');
            }
          } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan jaringan saat mengunggah.');
          }
        } else {
          alert('Data kosong. Pastikan ada kolom Nama.');
        }
      } catch (e) {
        console.error(e);
        alert('Gagal membaca file Excel.');
      }
    };
    reader.readAsArrayBuffer(file);
    if (teacherFileInputRef.current) teacherFileInputRef.current.value = '';
  };

  const handleDelete = async (id: number) => {
    if (confirm('Yakin ingin menghapus data ini?')) {
      await fetch(`/api/students/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchData();
    }
  };

  const handleDeleteTeacher = async (id: number, type: 'walikelas' | 'bk') => {
    if (confirm('Yakin ingin menghapus data ini?')) {
      const endpoint = type === 'bk' ? `/api/counseling_teachers/${id}` : `/api/homeroom_teachers/${id}`;
      await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchData();
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredHomeroomTeachers = homeroomTeachers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCounselingTeachers = counselingTeachers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const currentTeachers = activeTab === 'walikelas' ? filteredHomeroomTeachers : filteredCounselingTeachers;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Master Data</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">Kelola data referensi untuk pencatatan prestasi.</p>
        </div>
        <div className="flex gap-4">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            ref={activeTab === 'siswa' ? fileInputRef : teacherFileInputRef}
            onChange={activeTab === 'siswa' ? handleFileUpload : handleFileUploadTeachers}
          />
          <button 
            onClick={() => activeTab === 'siswa' ? fileInputRef.current?.click() : teacherFileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium w-full sm:w-auto"
          >
            <Upload className="w-4 h-4" />
            Upload Excel {activeTab === 'siswa' ? 'Siswa' : activeTab === 'walikelas' ? 'Wali Kelas' : 'Guru BK'}
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button 
          className={`pb-4 px-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'siswa' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('siswa')}
        >
          Data Siswa
        </button>
        <button 
          className={`pb-4 px-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'walikelas' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('walikelas')}
        >
          Data Wali Kelas
        </button>
        <button 
          className={`pb-4 px-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'bk' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('bk')}
        >
          Data Guru BK
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama..." 
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
                <th className="px-6 py-4 font-medium">Nama {activeTab === 'siswa' ? 'Siswa' : activeTab === 'walikelas' ? 'Wali Kelas' : 'Guru BK'}</th>
                {activeTab === 'siswa' && <th className="px-6 py-4 font-medium">Kelas</th>}
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTab === 'siswa' ? (
                filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{student.name}</td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                          {student.class_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDelete(student.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                      Tidak ada data siswa ditemukan.
                    </td>
                  </tr>
                )
              ) : (
                currentTeachers.length > 0 ? (
                  currentTeachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{teacher.name}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteTeacher(teacher.id, activeTab as 'walikelas' | 'bk')}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center text-slate-400">
                      Tidak ada data guru ditemukan.
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
