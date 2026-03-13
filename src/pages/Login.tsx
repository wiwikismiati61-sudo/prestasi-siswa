import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Loader2 } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      let data;
      try {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (jsonErr) {
          console.error('Failed to parse JSON response. Raw text:', text);
          throw new Error('Invalid server response: ' + text.substring(0, 100));
        }
      } catch (err: any) {
        if (err.message.startsWith('Invalid server response')) throw err;
        console.error('Failed to read response text:', err);
        throw new Error('Failed to read server response');
      }

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err: any) {
      console.error('Login exception:', err);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-24 w-auto object-contain"
          src="https://iili.io/KDFk4fI.png"
          alt="Prestasi Siswa"
          referrerPolicy="no-referrer"
        />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          PRESTASI SISWA
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Sistem Informasi Manajemen Prestasi
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm break-words">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700">Username</label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 text-base sm:text-sm border-slate-300 rounded-xl py-3 border bg-slate-50/50"
                  placeholder="Masukkan username"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 text-base sm:text-sm border-slate-300 rounded-xl py-3 border bg-slate-50/50"
                  placeholder="Masukkan password"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                    Memproses...
                  </>
                ) : (
                  'Masuk ke Sistem'
                )}
              </button>
            </div>
            
            <div className="mt-4 text-center text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p>Default Login:</p>
              <p>Username: <span className="font-semibold text-slate-700">admin</span></p>
              <p>Password: <span className="font-semibold text-slate-700">admin123</span></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
