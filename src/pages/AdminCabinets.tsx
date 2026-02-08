import { useState } from 'react';
import { ref, push, set, remove } from 'firebase/database';
import { database } from '../firebase';
import { useAppContext } from '../AppContext';
import { Trash2, Edit2, Plus, LayoutGrid, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminCabinets() {
  const { cabinets } = useAppContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{
    name: string;
    levels: number;
    columns: number;
    levelColumns: Record<number, number>;
    hasLocker: boolean;
    lockers: { level: number; column: number | null }[];
  }>({
    name: '',
    levels: 1,
    columns: 1,
    levelColumns: {},
    hasLocker: false,
    lockers: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await set(ref(database, `cabinets/${editingId}`), formData);
      } else {
        await push(ref(database, 'cabinets'), formData);
      }
      setEditingId(null);
      setFormData({ name: '', levels: 1, columns: 1, levelColumns: {}, hasLocker: false, lockers: [] });
    } catch (error) {
      console.error("Error saving cabinet", error);
    }
  };

  const handleEdit = (cabinet: any) => {
    setEditingId(cabinet.id);
    setFormData({
      name: cabinet.name,
      levels: cabinet.levels,
      columns: cabinet.columns,
      levelColumns: cabinet.levelColumns || {},
      hasLocker: cabinet.hasLocker || false,
      lockers: cabinet.lockers || []
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this cabinet?')) {
      await remove(ref(database, `cabinets/${id}`));
    }
  };

  const updateLevelColumns = (level: number, cols: string) => {
    const val = parseInt(cols);
    setFormData(prev => {
      const newMap = { ...prev.levelColumns };
      if (isNaN(val) || val === prev.columns) {
        delete newMap[level];
      } else {
        newMap[level] = val;
      }
      return { ...prev, levelColumns: newMap };
    });
  };

  const getColsForLevel = (level: number) => {
    return formData.levelColumns[level] || formData.columns;
  };

  const setLockerMode = (level: number, mode: 'none' | 'whole' | 'partial') => {
    setFormData(prev => {
      let filtered = prev.lockers.filter(l => l.level !== level);
      if (mode === 'whole') {
        filtered.push({ level, column: null });
      } else if (mode === 'partial') {
        filtered.push({ level, column: 1 }); // default to first column
      }
      return { ...prev, lockers: filtered, hasLocker: filtered.length > 0 };
    });
  };

  const togglePartialLocker = (level: number, col: number) => {
    setFormData(prev => {
      let current = [...prev.lockers];
      const exists = current.some(l => l.level === level && l.column === col);
      if (exists) {
        current = current.filter(l => !(l.level === level && l.column === col));
      } else {
        current.push({ level, column: col });
      }
      return { ...prev, lockers: current, hasLocker: current.length > 0 };
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutGrid className="w-8 h-8 text-indigo-600" />
            Manage Cabinets
          </h1>
          <p className="text-slate-500 mt-2">Add or update advanced storage cabinet structures.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 sticky top-6">
          <h2 className="text-xl font-semibold text-slate-800">
            {editingId ? 'Edit Cabinet' : 'Add New Cabinet'}
          </h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Cabinet Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Main Archival A1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Levels (Rows)</label>
              <input
                type="number"
                min="1"
                required
                value={formData.levels}
                onChange={e => setFormData({ ...formData, levels: parseInt(e.target.value) || 1 })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Default Columns per Level</label>
              <input
                type="number"
                min="1"
                required
                value={formData.columns}
                onChange={e => setFormData({ ...formData, columns: parseInt(e.target.value) || 1 })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Level Customization & Lockers</h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {Array.from({ length: formData.levels }, (_, i) => i + 1).map(level => {
                const isWhole = formData.lockers.some(l => l.level === level && l.column === null);
                const partialCols = formData.lockers.filter(l => l.level === level && l.column !== null).map(l => l.column as number);
                const isPartial = partialCols.length > 0;
                const currentMode = isWhole ? 'whole' : isPartial ? 'partial' : 'none';
                const colsForThisLevel = getColsForLevel(level);

                return (
                  <div key={level} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-700">Level {level}</h4>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500">Columns:</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.levelColumns[level] || ''}
                          onChange={e => updateLevelColumns(level, e.target.value)}
                          placeholder={formData.columns.toString()}
                          className="w-16 text-xs p-1 rounded border border-slate-300 outline-none"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <label className="text-xs flex items-center gap-1 cursor-pointer">
                        <input type="radio" checked={currentMode === 'none'} onChange={() => setLockerMode(level, 'none')} name={`locker-${level}`} /> Normal
                      </label>
                      <label className="text-xs flex items-center gap-1 cursor-pointer">
                        <input type="radio" checked={currentMode === 'whole'} onChange={() => setLockerMode(level, 'whole')} name={`locker-${level}`} /> Entire Level is Locker
                      </label>
                      <label className="text-xs flex items-center gap-1 cursor-pointer">
                        <input type="radio" checked={currentMode === 'partial'} onChange={() => setLockerMode(level, 'partial')} name={`locker-${level}`} /> Specific Columns
                      </label>
                    </div>

                    {currentMode === 'partial' && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                        {Array.from({ length: colsForThisLevel }, (_, i) => i + 1).map(col => (
                          <label key={col} className="text-xs flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-300 cursor-pointer hover:bg-slate-50">
                            <input 
                              type="checkbox" 
                              checked={partialCols.includes(col)}
                              onChange={() => togglePartialLocker(level, col)}
                              className="w-3 h-3 text-indigo-600 rounded"
                            />
                            Col {col}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex justify-center items-center font-semibold"
            >
              {editingId ? 'Update Cabinet' : <><Plus className="w-5 h-5 mr-1" /> Add Cabinet</>}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setFormData({ name: '', levels: 1, columns: 1, levelColumns: {}, hasLocker: false, lockers: [] }); }}
                className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300 transition font-semibold"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="space-y-4">
          {cabinets.map(cabinet => (
            <div key={cabinet.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-start hover:border-indigo-300 transition">
              <div className="w-full">
                <div className="flex justify-between w-full">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    {cabinet.name}
                    {cabinet.lockers && cabinet.lockers.length > 0 && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">Has Lockers</span>}
                  </h3>
                  <div className="flex gap-2">
                    <Link to={`/cabinet/${cabinet.id}`} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition flex items-center gap-1" title="Preview Drawing">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleEdit(cabinet)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cabinet.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-slate-500 mt-2 flex gap-4">
                  <span><strong>Levels:</strong> {cabinet.levels}</span>
                  <span><strong>Default Cols:</strong> {cabinet.columns}</span>
                </div>
                {cabinet.levelColumns && Object.keys(cabinet.levelColumns).length > 0 && (
                  <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 inline-block">
                    <strong>Custom Columns:</strong> {Object.entries(cabinet.levelColumns).map(([lvl, cols]) => `L${lvl}→${cols}c`).join(', ')}
                  </div>
                )}
                {cabinet.lockers && cabinet.lockers.length > 0 && (
                  <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100 inline-flex flex-wrap gap-2">
                    <strong>Lockers:</strong> 
                    {cabinet.lockers.map((l, i) => (
                      <span key={i} className="bg-amber-100 px-2 py-0.5 rounded-full font-semibold">
                        Level {l.level}{l.column ? ` (Col ${l.column})` : ' (Whole Level)'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {cabinets.length === 0 && (
            <div className="text-center py-12 text-slate-500 border border-dashed border-slate-300 rounded-2xl bg-slate-50">
              No cabinets added yet. Create one to start storing documents.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}