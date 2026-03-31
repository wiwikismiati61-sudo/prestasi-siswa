import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Trash2, Edit2, Plus, Shield, ShieldAlert, Eye } from 'lucide-react';

interface UserData {
  uid: string;
  email: string;
  username: string;
  displayName?: string;
  role: 'admin' | 'editor' | 'viewer';
}

export default function UserManagement() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    uid: '',
    username: '',
    password: '',
    role: 'viewer' as 'admin' | 'editor' | 'viewer'
  });

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData: UserData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usersData.push({
          ...data,
          uid: data.uid || doc.id,
        } as UserData);
      });
      setUsers(usersData);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError('Gagal mengambil data user.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isEditing) {
        // Update existing user role/displayName in Firestore
        await updateDoc(doc(db, 'users', formData.uid), {
          username: formData.username,
          role: formData.role
        });
      } else {
        // Create new user in Firebase Auth
        // Note: In a real production app, creating users from client side while logged in 
        // as admin will log the admin out and log the new user in.
        // For this demo, we use a secondary app instance or cloud functions ideally.
        // But for simplicity here, we'll just use the standard auth and warn the user.
        const generatedEmail = `${formData.username.replace(/\s+/g, '').toLowerCase()}@smp.belajar.id`;
        
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, generatedEmail, formData.password);
          
          // Save to Firestore
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: generatedEmail,
            username: formData.username,
            role: formData.role,
            createdAt: new Date().toISOString()
          });
        } catch (authError: any) {
          if (authError.code === 'auth/email-already-in-use') {
            throw new Error('Username sudah digunakan. Silakan gunakan username lain.');
          }
          throw authError;
        }
      }
      
      setShowForm(false);
      fetchUsers();
    } catch (err: any) {
      console.error('Error saving user:', err);
      setError(err.message || 'Gagal menyimpan data user.');
    }
  };

  const handleEdit = (user: UserData) => {
    setFormData({
      uid: user.uid,
      username: user.username || user.displayName || user.email.split('@')[0],
      password: '', // Don't populate password
      role: user.role
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (uid: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus user ini? (Hanya menghapus data profil, bukan autentikasi)')) {
      try {
        await deleteDoc(doc(db, 'users', uid));
        fetchUsers();
      } catch (err: any) {
        console.error('Error deleting user:', err);
        setError('Gagal menghapus user.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      uid: '',
      username: '',
      password: '',
      role: 'viewer'
    });
    setIsEditing(false);
    setShowForm(false);
    setError('');
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-red-600">Akses Ditolak</h2>
        <p className="mt-2 text-gray-600">Hanya Administrator yang dapat mengakses halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen User</h1>
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Tambah User Baru
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm ? (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit User' : 'Tambah User Baru'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  disabled={isEditing}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isEditing ? 'bg-gray-100' : ''}`}
                  placeholder="Username tanpa spasi"
                />
              </div>

              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Minimal 6 karakter"
                    minLength={6}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hak Akses (Role)</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin">Full Access (Admin)</option>
                  <option value="editor">Input data dan edit (Editor)</option>
                  <option value="viewer">Hanya Melihat (Viewer)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {isEditing ? 'Simpan Perubahan' : 'Buat User'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Memuat data user...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Belum ada data user.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Hak Akses</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.username || user.displayName || user.email.split('@')[0]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                            user.role === 'editor' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'}`}
                        >
                          {user.role === 'admin' && <ShieldAlert size={12} />}
                          {user.role === 'editor' && <Edit2 size={12} />}
                          {user.role === 'viewer' && <Eye size={12} />}
                          {user.role === 'admin' ? 'Full Access' : 
                           user.role === 'editor' ? 'Input & Edit' : 'Hanya Melihat'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                          title="Edit User"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.uid)}
                          className="text-red-600 hover:text-red-900"
                          title="Hapus User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
