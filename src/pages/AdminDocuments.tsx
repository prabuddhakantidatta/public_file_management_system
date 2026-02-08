import { useState } from 'react';
import { ref, push, set, remove } from 'firebase/database';
import { database } from '../firebase';
import { useAppContext } from '../AppContext';
import { Trash2, Edit2, Lock, Shield, FileText } from 'lucide-react';

export default function AdminDocuments() {
  const { documents, cabinets } = useAppContext();
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  
  const [docData, setDocData] = useState({
    bdCollection: '' as 'I' | 'II' | '',
    documentNumber: '',
    documentType: '',
    cabinetId: '',
    level: 1,
    column: 1,
    isLocker: false,
    isConfidential: false,
    password: ''
  });

  const saveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dbRef = editingDocId ? ref(database, `documents/${editingDocId}`) : ref(database, 'documents');
      if (editingDocId) {
        await set(dbRef, docData);
      } else {
        await push(dbRef, docData);
      }
      setEditingDocId(null);
      setDocData({ bdCollection: '', documentNumber: '', documentType: '', cabinetId: '', level: 1, column: 1, isLocker: false, isConfidential: false, password: '' });
    } catch (err) {
      console.error(err);
      alert('Error saving document details.');
    }
  };

  const deleteRecord = async (path: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      await remove(ref(database, path));
    }
  };

  const getCabinetDetails = (id: string) => cabinets.find(c => c.id === id);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-8 h-8 text-indigo-600" />
          Manage Documents
        </h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <div className="xl:col-span-1 sticky top-6">
          <form onSubmit={saveDoc} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-slate-800">{editingDocId ? 'Edit Document' : 'Add New Document'}</h2>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">BD Coll. (Optional)</label>
                <select
                  value={docData.bdCollection}
                  onChange={e => setDocData({ ...docData, bdCollection: e.target.value as 'I' | 'II' | '' })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select (Blank)</option>
                  <option value="I">I</option>
                  <option value="II">II</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Doc Type (Optional)</label>
                <input
                  type="text"
                  value={docData.documentType}
                  onChange={e => setDocData({ ...docData, documentType: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Legal, HR..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Document Name / Number</label>
              <input
                type="text"
                required
                value={docData.documentNumber}
                onChange={e => setDocData({ ...docData, documentNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter Document Name or Number"
              />
            </div>

            <div className="border-t border-slate-100 pt-4 mt-2">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Storage Location (Optional)</h3>
              <div className="space-y-4">
                                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cabinet</label>
                    <select
                      value={docData.cabinetId}
                      onChange={e => {
                        const newCabId = e.target.value;
                        const cab = getCabinetDetails(newCabId);
                        let isLocker = false;
                        let level = 1;
                        let column = 1;
                        
                        if (cab && cab.hasLocker && cab.lockers && cab.lockers.length > 0) {
                          isLocker = true;
                          level = cab.lockers[0].level;
                          column = cab.lockers[0].column || 1;
                        }
                        
                        setDocData({ 
                          ...docData, 
                          cabinetId: newCabId, 
                          level, 
                          column, 
                          isLocker 
                        });
                      }}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Cabinet...</option>
                      {cabinets.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {docData.cabinetId && getCabinetDetails(docData.cabinetId)?.hasLocker && (
                    <div className="flex items-center bg-amber-50 p-3 rounded-lg border border-amber-200 mb-4 mt-2">
                      <input
                        type="checkbox"
                        id="isLocker"
                        checked={docData.isLocker}
                        onChange={e => {
                          const checked = e.target.checked;
                          const cab = getCabinetDetails(docData.cabinetId);
                          let newLevel = docData.level;
                          let newCol = docData.column;
                          if (checked && cab?.lockers && cab.lockers.length > 0) {
                             newLevel = cab.lockers[0].level;
                             newCol = cab.lockers[0].column || 1;
                          }
                          setDocData({ ...docData, isLocker: checked, level: newLevel, column: newCol });
                        }}
                        className="h-4 w-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                      />
                      <label htmlFor="isLocker" className="ml-2 block text-sm font-medium text-amber-900">Store in Locker</label>
                    </div>
                  )}
                  
                  {docData.cabinetId && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {docData.isLocker ? 'Locker Level (Auto)' : 'Level (Row)'}
                        </label>
                        <select
                          value={docData.level}
                          onChange={e => setDocData({ ...docData, level: parseInt(e.target.value) })}
                          disabled={docData.isLocker}
                          className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 ${docData.isLocker ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white border-slate-300'}`}
                        >
                          {Array.from({ length: docData.isLocker ? Math.max(10, docData.level) : (getCabinetDetails(docData.cabinetId)?.levels || 1) }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>Level {i + 1} {!docData.isLocker && i === 0 ? '(Bottom)' : ''}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {docData.isLocker ? 'Locker Column (Auto)' : 'Column'}
                        </label>
                        <select
                          value={docData.column}
                          onChange={e => setDocData({ ...docData, column: parseInt(e.target.value) })}
                          disabled={docData.isLocker}
                          className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 ${docData.isLocker ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white border-slate-300'}`}
                        >
                          {Array.from({ length: docData.isLocker ? Math.max(10, docData.column) : (getCabinetDetails(docData.cabinetId)?.levelColumns?.[docData.level] || getCabinetDetails(docData.cabinetId)?.columns || 1) }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>Column {i + 1}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-2">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="isConfidential"
                  checked={docData.isConfidential}
                  onChange={e => setDocData({ ...docData, isConfidential: e.target.checked })}
                  className="h-4 w-4 text-red-600 rounded border-gray-300"
                />
                <label htmlFor="isConfidential" className="ml-2 flex items-center text-sm font-medium text-gray-900">
                  <Shield className="w-4 h-4 mr-1 text-red-500" />
                  Confidential
                </label>
              </div>
              {docData.isConfidential && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input
                    type="text"
                    required
                    value={docData.password}
                    onChange={e => setDocData({ ...docData, password: e.target.value })}
                    className="w-full rounded-lg border border-red-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                {editingDocId ? 'Update' : 'Save'}
              </button>
              {editingDocId && (
                <button type="button" onClick={() => { 
                  setEditingDocId(null); 
                  setDocData({ bdCollection: '', documentNumber: '', documentType: '', cabinetId: '', level: 1, column: 1, isLocker: false, isConfidential: false, password: '' }); 
                }} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300 transition">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="xl:col-span-2 space-y-4">
          {documents.map(doc => (
            <div key={doc.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center hover:border-indigo-300 transition group ml-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {doc.bdCollection && (
                    <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md">BD {doc.bdCollection}</span>
                  )}
                  <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">{doc.documentType}</span>
                  {doc.isConfidential && <span className="text-xs flex items-center bg-red-100 text-red-800 px-2 py-1 rounded-md"><Lock className="w-3 h-3 mr-1" /> Confidential</span>}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{doc.documentNumber}</h3>
                <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 bg-slate-50 p-2 rounded-lg inline-flex border border-slate-100 mt-2">
                  <span className="font-semibold text-slate-700">Cabinet:</span> {getCabinetDetails(doc.cabinetId)?.name || 'Unknown'}
                  <span className="text-slate-300">|</span>
                  <span className="font-semibold text-slate-700">Location:</span> {doc.isLocker ? `Locker (Level ${doc.level}, Col ${doc.column})` : `Level ${doc.level}, Column ${doc.column}`}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => { 
                  setEditingDocId(doc.id); 
                  setDocData({ 
                    bdCollection: doc.bdCollection, 
                    documentNumber: doc.documentNumber, 
                    documentType: doc.documentType, 
                    cabinetId: doc.cabinetId, 
                    level: doc.level, 
                    column: doc.column, 
                    isLocker: doc.isLocker, 
                    isConfidential: doc.isConfidential, 
                    password: doc.password || '' 
                  }); 
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                  <Edit2 className="w-5 h-5" />
                </button>
                <button onClick={() => deleteRecord(`documents/${doc.id}`)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          {documents.length === 0 && <div className="text-center py-12 text-slate-500 border border-dashed border-slate-300 rounded-2xl">No documents found.</div>}
        </div>
      </div>
    </div>
  );
}
