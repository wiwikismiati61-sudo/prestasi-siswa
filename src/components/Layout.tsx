import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Database, FileText, PieChart, Settings, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ...(user ? [
      { path: '/master', icon: Database, label: 'Master Data' },
      { path: '/transactions', icon: FileText, label: 'Transaksi' },
      { path: '/reports', icon: PieChart, label: 'Laporan' },
      { path: '/settings', icon: Settings, label: 'Pengaturan' },
    ] : []),
  ];

  return (
    <div className="flex h-screen bg-slate-50 flex-col md:flex-row">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col z-10">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <img src="https://iili.io/KDFk4fI.png" alt="Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
          <h1 className="font-bold text-lg text-slate-800 leading-tight">PRESTASI<br/>SISWA</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-600 font-medium' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          {user ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5 text-slate-400" />
              Logout
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              <LogIn className="w-5 h-5 text-slate-400" />
              Login
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-2">
            <img src="https://iili.io/KDFk4fI.png" alt="Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
            <h1 className="font-bold text-base text-slate-800 leading-tight">PRESTASI SISWA</h1>
          </div>
          {user ? (
            <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={handleLogin} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
              <LogIn className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center p-2 z-30 pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full py-2 gap-1 rounded-lg transition-colors ${
                isActive 
                  ? 'text-indigo-600' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
