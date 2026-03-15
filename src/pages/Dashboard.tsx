import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, Trophy, Award, Medal, BarChart3, Database } from 'lucide-react';
import { getStudents, getTransactions } from '../services/db';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [chartGrade, setChartGrade] = useState('All');
  const [tableGrade, setTableGrade] = useState('All');
  const [tableLimit, setTableLimit] = useState(5);

  useEffect(() => {
    const fetchAndComputeStats = async () => {
      try {
        const [students, transactions] = await Promise.all([
          getStudents(),
          getTransactions()
        ]);

        const totalStudents = students.length;
        const totalAchievements = transactions.length;
        
        const typeStatsMap: Record<string, number> = {};
        transactions.forEach(t => {
          typeStatsMap[t.achievement_type] = (typeStatsMap[t.achievement_type] || 0) + 1;
        });
        const typeStats = Object.keys(typeStatsMap).map(key => ({
          achievement_type: key,
          count: typeStatsMap[key]
        }));

        const classStatsMap: Record<string, { student_count: number, achieving_student_count: number }> = {};
        students.forEach(s => {
          if (!classStatsMap[s.class_name]) {
            classStatsMap[s.class_name] = { student_count: 0, achieving_student_count: 0 };
          }
          classStatsMap[s.class_name].student_count++;
        });

        const studentAchievementCount: Record<string, { name: string, class_name: string, count: number }> = {};
        transactions.forEach(t => {
          const student = students.find(s => s.id === t.student_id);
          if (student) {
            if (!studentAchievementCount[student.id]) {
              studentAchievementCount[student.id] = { name: student.name, class_name: student.class_name, count: 0 };
            }
            studentAchievementCount[student.id].count++;
          }
        });

        Object.values(studentAchievementCount).forEach(student => {
          if (!classStatsMap[student.class_name]) {
            classStatsMap[student.class_name] = { student_count: 0, achieving_student_count: 0 };
          }
          classStatsMap[student.class_name].achieving_student_count++;
        });

        const classStats = Object.keys(classStatsMap).map(key => ({
          class_name: key,
          ...classStatsMap[key]
        }));

        const classDetails: any[] = Object.values(studentAchievementCount).map(student => ({
          class_name: student.class_name.toUpperCase().replace(/\s+/g, ''),
          name: student.name,
          achievement_count: student.count
        }));

        classDetails.sort((a, b) => b.achievement_count - a.achievement_count);

        let filteredTopStudents = Object.values(studentAchievementCount);
        if (tableGrade !== 'All') {
          filteredTopStudents = filteredTopStudents.filter(s => s.class_name.startsWith(tableGrade));
        }
        filteredTopStudents.sort((a, b) => b.count - a.count);
        const topStudents = filteredTopStudents.slice(0, tableLimit).map(s => ({
          name: s.name,
          class_name: s.class_name,
          achievement_count: s.count
        }));

        setStats({
          totalStudents,
          totalTransactions: totalAchievements,
          typeStats,
          classStats,
          classDetails,
          topStudents
        });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setStats({ error: true });
      }
    };

    fetchAndComputeStats();
  }, [chartGrade, tableGrade, tableLimit]);

  if (!stats) return <div className="p-8 text-slate-500">Memuat data...</div>;
  if (stats.error) return <div className="p-8 text-red-500">Gagal memuat data. Pastikan Anda sudah login.</div>;

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

  const pieData = (stats.typeStats || []).map((s: any) => ({
    name: s.achievement_type,
    value: s.count
  }));

  const allClasses: string[] = [];
  const grades = chartGrade === 'All' ? ['7', '8', '9'] : [chartGrade];
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  
  grades.forEach(g => {
    letters.forEach(l => {
      allClasses.push(`${g}${l}`);
    });
  });

  const fullClassStats = allClasses.map(c => {
    const found = (stats.classStats || []).find((s: any) => s.class_name.toUpperCase().replace(/\s+/g, '') === c);
    return {
      class_name: c,
      student_count: found ? found.student_count : 0,
      achieving_student_count: found ? found.achieving_student_count : 0
    };
  });

  const classDetailsMap = (stats.classDetails || []).reduce((acc: any, curr: any) => {
    const className = curr.class_name.toUpperCase().replace(/\s+/g, '');
    if (!acc[className]) acc[className] = [];
    acc[className].push(curr);
    return acc;
  }, {});

  const tableData = letters.map(letter => {
    return {
      letter,
      grade7: classDetailsMap[`7${letter}`] || [],
      grade8: classDetailsMap[`8${letter}`] || [],
      grade9: classDetailsMap[`9${letter}`] || []
    };
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Prestasi</h1>
        <p className="text-slate-500 mt-1">Ringkasan pencapaian siswa secara keseluruhan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Siswa</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalStudents}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Prestasi</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalTransactions}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart: Akademik vs Non Akademik */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-slate-400" />
            Persentase Jenis Prestasi
          </h2>
          <div className="h-72">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">Belum ada data prestasi</div>
            )}
          </div>
        </div>

        {/* Chart: Jumlah Siswa Berprestasi per Kelas */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-slate-400" />
              Jumlah Siswa Berprestasi
            </h2>
            <select 
              value={chartGrade} 
              onChange={(e) => setChartGrade(e.target.value)}
              className="text-sm border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-1.5 pl-3 pr-8"
            >
              <option value="All">Semua Kelas</option>
              <option value="7">Kelas 7</option>
              <option value="8">Kelas 8</option>
              <option value="9">Kelas 9</option>
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fullClassStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="class_name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} interval={0} angle={-45} textAnchor="end" height={40} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="achieving_student_count" name="Siswa Berprestasi" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabel Rekapitulasi Kelas */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-6">
            <Database className="w-5 h-5 text-slate-400" />
            Tabel Rekapitulasi Siswa Berprestasi per Kelas
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                  <th className="px-4 py-3 font-medium w-16 text-center border-r border-slate-100">Kelas</th>
                  <th className="px-4 py-3 font-medium border-r border-slate-100">Kelas 7</th>
                  <th className="px-4 py-3 font-medium border-r border-slate-100">Kelas 8</th>
                  <th className="px-4 py-3 font-medium">Kelas 9</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900 text-center border-r border-slate-100 bg-slate-50/30">{row.letter}</td>
                    <td className="px-4 py-3 align-top border-r border-slate-100">
                      {row.grade7.length > 0 ? (
                        <ul className="space-y-1">
                          {row.grade7.map((student: any, sIdx: number) => (
                            <li key={sIdx} className="text-sm text-slate-700 flex justify-between items-center">
                              <span>{student.name}</span>
                              <span className="inline-flex items-center justify-center bg-indigo-50 text-indigo-600 text-xs font-bold w-5 h-5 rounded-full ml-2">{student.achievement_count}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-sm text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top border-r border-slate-100">
                      {row.grade8.length > 0 ? (
                        <ul className="space-y-1">
                          {row.grade8.map((student: any, sIdx: number) => (
                            <li key={sIdx} className="text-sm text-slate-700 flex justify-between items-center">
                              <span>{student.name}</span>
                              <span className="inline-flex items-center justify-center bg-indigo-50 text-indigo-600 text-xs font-bold w-5 h-5 rounded-full ml-2">{student.achievement_count}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-sm text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {row.grade9.length > 0 ? (
                        <ul className="space-y-1">
                          {row.grade9.map((student: any, sIdx: number) => (
                            <li key={sIdx} className="text-sm text-slate-700 flex justify-between items-center">
                              <span>{student.name}</span>
                              <span className="inline-flex items-center justify-center bg-indigo-50 text-indigo-600 text-xs font-bold w-5 h-5 rounded-full ml-2">{student.achievement_count}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-sm text-slate-400 italic">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Students */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Medal className="w-5 h-5 text-slate-400" />
              Siswa Berprestasi Teratas
            </h2>
            <div className="flex items-center gap-3">
              <select 
                value={tableGrade} 
                onChange={(e) => setTableGrade(e.target.value)}
                className="text-sm border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-1.5 pl-3 pr-8"
              >
                <option value="All">Semua Kelas</option>
                <option value="7">Kelas 7</option>
                <option value="8">Kelas 8</option>
                <option value="9">Kelas 9</option>
              </select>
              <select 
                value={tableLimit} 
                onChange={(e) => setTableLimit(Number(e.target.value))}
                className="text-sm border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-1.5 pl-3 pr-8"
              >
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <option key={num} value={num}>Top {num}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(stats.topStudents || []).length > 0 ? (
              stats.topStudents.map((student: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      idx === 0 ? 'bg-amber-100 text-amber-600' :
                      idx === 1 ? 'bg-slate-200 text-slate-600' :
                      idx === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-indigo-50 text-indigo-600'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{student.name}</p>
                      <p className="text-sm text-slate-500">Kelas {student.class_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-500" />
                    <span className="font-bold text-slate-700">{student.achievement_count}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 col-span-full">Belum ada data siswa berprestasi</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
