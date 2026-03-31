import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UserData {
  uid: string;
  email: string;
  username: string;
  displayName?: string;
  role: 'admin' | 'editor' | 'viewer';
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  userData: null,
  isAdmin: false, 
  isEditor: false,
  isViewer: false,
  loading: true 
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          } else if (currentUser.email === 'wiwikismiati61@guru.smp.belajar.id') {
             // Bootstrap default admin
             const newAdmin: UserData = {
               uid: currentUser.uid,
               email: currentUser.email,
               username: 'admin',
               displayName: currentUser.displayName || 'Admin',
               role: 'admin'
             };
             try {
               await setDoc(doc(db, 'users', currentUser.uid), newAdmin);
               setUserData(newAdmin);
             } catch (e) {
               console.error("Error bootstrapping admin:", e);
               // Even if it fails to save to Firestore, grant admin rights locally for this session
               // so they can fix the rules or perform necessary actions
               setUserData(newAdmin);
             }
          } else {
            setUserData(null);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = userData?.role === 'admin';
  const isEditor = isAdmin || userData?.role === 'editor';
  const isViewer = isEditor || userData?.role === 'viewer';

  return (
    <AuthContext.Provider value={{ user, userData, isAdmin, isEditor, isViewer, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
