import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { auth, database } from './firebase';
import { Cabinet, FileDoc, FileType, AppDocument } from './types';

interface AppContextType {
  user: User | null;
  loading: boolean;
  cabinets: Cabinet[];
  files: FileDoc[];
  documents: AppDocument[];
  fileTypes: FileType[];
}

const AppContext = createContext<AppContextType>({
  user: null,
  loading: true,
  cabinets: [],
  files: [],
  documents: [],
  fileTypes: [],
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [files, setFiles] = useState<FileDoc[]>([]);
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // We re-attach listeners whenever `user` changes to prevent disconnected listeners 
    // if Firebase rules initially rejected the connection before login.
    const cabinetsRef = ref(database, 'cabinets');
    const unsubscribeCabinets = onValue(cabinetsRef, (snapshot) => {
      const data = snapshot.val();
      setCabinets(data ? Object.keys(data).map((key) => ({ id: key, ...data[key] })) : []);
    });

    const filesRef = ref(database, 'files');
    const unsubscribeFiles = onValue(filesRef, (snapshot) => {
      const data = snapshot.val();
      setFiles(data ? Object.keys(data).map((key) => ({ id: key, ...data[key] })) : []);
    });

    const documentsRef = ref(database, 'documents');
    const unsubscribeDocuments = onValue(documentsRef, (snapshot) => {
      const data = snapshot.val();
      setDocuments(data ? Object.keys(data).map((key) => ({ id: key, ...data[key] })) : []);
    });

    const fileTypesRef = ref(database, 'fileTypes');
    const unsubscribeFileTypes = onValue(fileTypesRef, (snapshot) => {
      const data = snapshot.val();
      setFileTypes(data ? Object.keys(data).map((key) => ({ id: key, ...data[key] })) : []);
    });

    return () => {
      unsubscribeCabinets();
      unsubscribeFiles();
      unsubscribeDocuments();
      unsubscribeFileTypes();
    };
  }, [user]);

  return (
    <AppContext.Provider value={{ user, loading, cabinets, files, documents, fileTypes }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
