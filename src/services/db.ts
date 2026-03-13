import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const getStudents = async (): Promise<any[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'students'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'students');
    return [];
  }
};

export const addStudent = async (student: any) => {
  try {
    const docRef = await addDoc(collection(db, 'students'), student);
    return { id: docRef.id, ...student };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'students');
  }
};

export const updateStudent = async (id: string, student: any) => {
  try {
    await updateDoc(doc(db, 'students', id), student);
    return { id, ...student };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `students/${id}`);
  }
};

export const deleteStudent = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'students', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `students/${id}`);
  }
};

export const bulkAddStudents = async (students: any[]) => {
  try {
    const batch = writeBatch(db);
    students.forEach(student => {
      const docRef = doc(collection(db, 'students'));
      batch.set(docRef, student);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'students');
  }
};

export const getHomeroomTeachers = async (): Promise<any[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'homeroom_teachers'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'homeroom_teachers');
    return [];
  }
};

export const addHomeroomTeacher = async (teacher: any) => {
  try {
    const docRef = await addDoc(collection(db, 'homeroom_teachers'), teacher);
    return { id: docRef.id, ...teacher };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'homeroom_teachers');
  }
};

export const deleteHomeroomTeacher = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'homeroom_teachers', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `homeroom_teachers/${id}`);
  }
};

export const bulkAddHomeroomTeachers = async (teachers: any[]) => {
  try {
    const batch = writeBatch(db);
    teachers.forEach(teacher => {
      const docRef = doc(collection(db, 'homeroom_teachers'));
      batch.set(docRef, teacher);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'homeroom_teachers');
  }
};

export const getCounselingTeachers = async (): Promise<any[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'counseling_teachers'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'counseling_teachers');
    return [];
  }
};

export const addCounselingTeacher = async (teacher: any) => {
  try {
    const docRef = await addDoc(collection(db, 'counseling_teachers'), teacher);
    return { id: docRef.id, ...teacher };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'counseling_teachers');
  }
};

export const deleteCounselingTeacher = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'counseling_teachers', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `counseling_teachers/${id}`);
  }
};

export const bulkAddCounselingTeachers = async (teachers: any[]) => {
  try {
    const batch = writeBatch(db);
    teachers.forEach(teacher => {
      const docRef = doc(collection(db, 'counseling_teachers'));
      batch.set(docRef, teacher);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'counseling_teachers');
  }
};

export const getTransactions = async (): Promise<any[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'transactions'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'transactions');
    return [];
  }
};

export const addTransaction = async (transaction: any) => {
  try {
    const docRef = await addDoc(collection(db, 'transactions'), transaction);
    return { id: docRef.id, ...transaction };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'transactions');
  }
};

export const updateTransaction = async (id: string, transaction: any) => {
  try {
    await updateDoc(doc(db, 'transactions', id), transaction);
    return { id, ...transaction };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `transactions/${id}`);
  }
};

export const deleteTransaction = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'transactions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
  }
};
