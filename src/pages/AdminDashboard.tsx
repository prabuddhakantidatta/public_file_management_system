import {} from 'react';
import { Link } from 'react-router-dom';
import { Archive, FileText, QrCode } from 'lucide-react';
import { useAppContext } from '../AppContext';

export default function AdminDashboard() {
  const { cabinets, files } = useAppContext();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-2">Manage your cabinets, files, and QR codes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/admin/cabinets" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 transition-all flex items-center space-x-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
            <Archive className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Cabinets</h2>
            <p className="text-slate-500">{cabinets.length} total</p>
          </div>
        </Link>

        <Link to="/admin/files" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-300 transition-all flex items-center space-x-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileText className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Files</h2>
            <p className="text-slate-500">{files.length} total</p>
          </div>
        </Link>

        <Link to="/admin/qrs" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-purple-300 transition-all flex items-center space-x-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <QrCode className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">QR Generator</h2>
            <p className="text-slate-500">Print codes</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
