import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './AppContext';
import { Navbar } from './components/Navbar';
import PublicDashboard from './pages/PublicDashboard';
import CabinetView from './pages/CabinetView';
import FileView from './pages/FileView';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminFiles from './pages/AdminFiles';
import AdminDocuments from './pages/AdminDocuments';
import AdminCabinets from './pages/AdminCabinets';
import AdminQRs from './pages/AdminQRs';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAppContext();
  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <Navbar />
          <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<PublicDashboard />} />
              <Route path="/cabinet/:id" element={<CabinetView />} />
              <Route path="/file/:id" element={<FileView />} />
              <Route path="/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/files" element={<ProtectedRoute><AdminFiles /></ProtectedRoute>} />
              <Route path="/admin/documents" element={<ProtectedRoute><AdminDocuments /></ProtectedRoute>} />
              <Route path="/admin/cabinets" element={<ProtectedRoute><AdminCabinets /></ProtectedRoute>} />
              <Route path="/admin/qrs" element={<ProtectedRoute><AdminQRs /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
