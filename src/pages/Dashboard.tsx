import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, Trophy, Award, Medal, BarChart3, Database } from 'lucide-react';
import { getStudents, getTransactions } from '../services/db';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [chartGrade, setChartGrade] = useState('All');
  const [tableGrade, setTableGrade] = useState('All');
  const [tableLimit, setTableLimit] = useState(5);
  const [rekapClass, setRekapClass] = useState('7A');
  const [rekapType, setRekapType] = useState('All');
  const [rekapRank, setRekapRank] = useState('All');

  useEffect(() => {
    const fetchAndComputeStats = async () => {
      try {
        const [students, transactions] = await Promise.all([
          getStudents(),
          getTransactions()
        ]);

        const totalStudents = students.length;
        const totalAchievements = transactions.length;
        
        const overallStudentAchievementCount: Record<string, number> = {};
        transactions.forEach(t => {
          overallStudentAchievementCount[t.student_id] = (overallStudentAchievementCount[t.student_id] || 0) + 1;
        });
        const totalAchievingStudents = Object.keys(overallStudentAchievementCount).length;

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

        Object.keys(overallStudentAchievementCount).forEach(studentId => {
          const student = students.find(s => s.id === studentId);
          if (student && classStatsMap[student.class_name]) {
            classStatsMap[student.class_name].achieving_student_count++;
          }
        });

        const classStats = Object.keys(classStatsMap).map(key => ({
          class_name: key,
          ...classStatsMap[key]
        }));

        // Data for Top Students (overall)
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

        // Data for Rekapitulasi (Nested View)
        // Filter transactions based on rekapType and rekapRank
        const filteredTransactionsForRekap = transactions.filter(t => {
          const matchesType = rekapType === 'All' || t.achievement_type === rekapType;
          const matchesRank = rekapRank === 'All' || t.rank === rekapRank;
          return matchesType && matchesRank;
        });

        // Group by student for the rekap view
        const rekapNestedData: Record<string, any> = {};
        filteredTransactionsForRekap.forEach(t => {
          const student = students.find(s => s.id === t.student_id);
          if (student) {
            const className = student.class_name.toUpperCase().replace(/\s+/g, '');
            if (!rekapNestedData[className]) rekapNestedData[className] = {};
            
            if (!rekapNestedData[className][student.id]) {
              rekapNestedData[className][student.id] = {
                name: student.name,
                achievements: []
              };
            }
            rekapNestedData[className][student.id].achievements.push({
              competition_name: t.competition_name,
              rank: t.rank,
              type: t.achievement_type,
              level: t.level || '-'
            });
          }
        });

        setStats({
          totalStudents,
          totalTransactions: totalAchievements,
          totalAchievingStudents,
          typeStats,
          classStats,
          topStudents,
          rekapNestedData
        });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setStats({ error: true });
      }
    };

    fetchAndComputeStats();
  }, [chartGrade, tableGrade, tableLimit, rekapType, rekapRank]);

  if (!stats) return <div className="p-8 text-slate-500">Memuat data...</div>;
  if (stats.error) return <div className="p-8 text-red-500">Gagal memuat data.</div>;

  const COLORS = ['#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

  const pieData = (stats.typeStats || []).map((s: any) => ({
    name: s.achievement_type,
    value: s.count
  }));

  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const allClassOptions: string[] = [];
  ['7', '8', '9'].forEach(g => letters.forEach(l => allClassOptions.push(`${g}${l}`)));

  const currentRekapClassData = stats.rekapNestedData[rekapClass] || {};
  const rekapStudents = Object.values(currentRekapClassData).sort((a: any, b: any) => a.name.localeCompare(b.name));

  const rankOptions = ['Juara 1', 'Juara 2', 'Juara 3', 'Harapan 1', 'Harapan 2', 'Harapan 3', 'Partisipasi'];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Prestasi</h1>
        <p className="text-slate-500 mt-1">Ringkasan pencapaian siswa secara keseluruhan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Siswa</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalStudents}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-600">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Prestasi</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalTransactions}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Siswa Berprestasi</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalAchievingStudents}</p>
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
              <BarChart3 className="w-5 h-5 text-cyan-500" />
              Jumlah Siswa Berprestasi
            </h2>
            <select 
              value={chartGrade} 
              onChange={(e) => setChartGrade(e.target.value)}
              className="text-sm border-slate-200 rounded-lg focus:ring-purple-500 focus:border-purple-500 py-1.5 pl-3 pr-8 bg-slate-50"
            >
              <option value="All">Semua Kelas</option>
              <option value="7">Kelas 7</option>
              <option value="8">Kelas 8</option>
              <option value="9">Kelas 9</option>
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.classStats.filter((s: any) => chartGrade === 'All' || s.class_name.startsWith(chartGrade))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="class_name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} interval={0} angle={-45} textAnchor="end" height={40} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="achieving_student_count" name="Siswa Berprestasi" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabel Rekapitulasi Kelas (Model Terlampir) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-slate-800">Kelas</h2>
              <select 
                value={rekapClass} 
                onChange={(e) => setRekapClass(e.target.value)}
                className="text-lg font-bold border-none bg-purple-100 text-purple-700 rounded-lg py-1 px-3 focus:ring-0"
              >
                {allClassOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select 
                value={rekapType} 
                onChange={(e) => setRekapType(e.target.value)}
                className="text-sm border-slate-200 rounded-lg focus:ring-purple-500 focus:border-purple-500 py-1.5 pl-3 pr-8 bg-slate-50"
              >
                <option value="All">Semua Jenis</option>
                <option value="Akademik">Akademik</option>
                <option value="Non Akademik">Non Akademik</option>
              </select>
              <select 
                value={rekapRank} 
                onChange={(e) => setRekapRank(e.target.value)}
                className="text-sm border-slate-200 rounded-lg focus:ring-purple-500 focus:border-purple-500 py-1.5 pl-3 pr-8 bg-slate-50"
              >
                <option value="All">Semua Juara</option>
                {rankOptions.map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shadow-inner">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 flex items-center justify-between">
              <span className="font-bold text-lg">Prestasi Siswa</span>
              <Database className="w-5 h-5 opacity-80" />
            </div>
            <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-200">
              {rekapStudents.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {rekapStudents.map((student: any, sIdx: number) => (
                    <div key={sIdx} className="bg-white">
                      <div className="bg-slate-50/80 px-4 py-3 flex items-center gap-3 border-b border-slate-100">
                        <div className="w-5 h-5 rounded border border-slate-300 flex items-center justify-center text-[10px] text-slate-500 bg-white shadow-sm font-bold">−</div>
                        <span className="font-bold text-slate-800 uppercase text-sm tracking-wider">{student.name}</span>
                      </div>
                      <div className="pl-12 pr-6 py-5 space-y-6">
                        {student.achievements.map((ach: any, aIdx: number) => (
                          <div key={aIdx} className="relative pl-6 border-l-2 border-purple-100 space-y-2">
                            <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-white border-2 border-purple-400 shadow-sm"></div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm leading-tight">{ach.competition_name}</span>
                            </div>
                            <div className="space-y-1.5">
                              <div className="text-sm font-bold text-purple-600">
                                {ach.rank}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">TINGKAT:</span>
                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                                  {ach.level}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 italic bg-white">
                  Tidak ada data prestasi untuk kelas ini dengan filter yang dipilih.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Students */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Medal className="w-5 h-5 text-pink-500" />
              Siswa Berprestasi Teratas
            </h2>
            <div className="flex items-center gap-3">
              <select 
                value={tableGrade} 
                onChange={(e) => setTableGrade(e.target.value)}
                className="text-sm border-slate-200 rounded-lg focus:ring-pink-500 focus:border-pink-500 py-1.5 pl-3 pr-8 bg-slate-50"
              >
                <option value="All">Semua Kelas</option>
                <option value="7">Kelas 7</option>
                <option value="8">Kelas 8</option>
                <option value="9">Kelas 9</option>
              </select>
              <select 
                value={tableLimit} 
                onChange={(e) => setTableLimit(Number(e.target.value))}
                className="text-sm border-slate-200 rounded-lg focus:ring-pink-500 focus:border-pink-500 py-1.5 pl-3 pr-8 bg-slate-50"
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
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-pink-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm ${
                      idx === 0 ? 'bg-amber-100 text-amber-600' :
                      idx === 1 ? 'bg-slate-200 text-slate-600' :
                      idx === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-pink-50 text-pink-600'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{student.name}</p>
                      <p className="text-sm text-slate-500">Kelas {student.class_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-pink-500" />
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
