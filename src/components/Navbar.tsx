import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, UserCircle, QrCode, FileText, Archive } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAppContext } from '../AppContext';

export const Navbar: React.FC = () => {
  const { user } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  return (
    <nav className="bg-slate-900 text-white shadow-md print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Archive className="h-6 w-6 text-indigo-400" />
              <span className="font-bold text-lg hidden sm:block">CabinetSystem</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Home</Link>
            
            {user ? (
              <>
                <Link to="/admin" className="flex items-center text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  Admin
                </Link>
                <Link to="/admin/cabinets" className="flex items-center text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  <Archive className="h-4 w-4 mr-1" />
                  Cabinets
                </Link>
                <Link to="/admin/files" className="flex items-center text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  <FileText className="h-4 w-4 mr-1" />
                  Files
                </Link>
                <Link to="/admin/documents" className="flex items-center text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  <FileText className="h-4 w-4 mr-1" />
                  Docs
                </Link>
                <Link to="/admin/qrs" className="flex items-center text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  <QrCode className="h-4 w-4 mr-1" />
                  QR Print
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-red-400 hover:text-red-300 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="flex items-center text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                <UserCircle className="h-4 w-4 mr-1" />
                Admin Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
