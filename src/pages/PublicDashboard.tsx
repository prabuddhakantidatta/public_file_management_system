import React from 'react';
import { Link } from 'react-router-dom';
import { Archive, Layers, Columns } from 'lucide-react';
import { useAppContext } from '../AppContext';

export default function PublicDashboard() {
  const { cabinets, loading } = useAppContext();

  if (loading) {
    return <div className="text-center p-8 text-slate-500">Loading Cabinets...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Available Cabinets</h1>
        <p className="text-slate-500 mt-2">Select a cabinet to view stored files and structure.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cabinets.map((cabinet) => (
          <Link
            key={cabinet.id}
            to={`/cabinet/${cabinet.id}`}
            className="group block bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-indigo-50 p-3 rounded-lg group-hover:bg-indigo-100 transition-colors">
                  <Archive className="h-6 w-6 text-indigo-600" />
                </div>
                {cabinet.hasLocker && (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                    Locker Storage
                  </span>
                )}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{cabinet.name}</h3>
              <div className="flex space-x-4 text-sm text-slate-500 mb-4">
                <div className="flex items-center">
                  <Layers className="h-4 w-4 mr-1 text-slate-400" />
                  {cabinet.levels} Levels
                </div>
                <div className="flex items-center">
                  <Columns className="h-4 w-4 mr-1 text-slate-400" />
                  {cabinet.columns} Columns
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-center text-indigo-600 font-medium text-sm group-hover:text-indigo-700 transition">
                <Layers className="w-4 h-4 mr-2" />
                Preview Cabinet Drawing
              </div>
            </div>
          </Link>
        ))}
        {cabinets.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
            No cabinets available yet.
          </div>
        )}
      </div>
    </div>
  );
}
