import React, { useState } from 'react';
import { ref, push, set, remove } from 'firebase/database';
import { database } from '../firebase';
import { useAppContext } from '../AppContext';
import { Trash2, Edit2, Lock, Shield, Archive, Type } from 'lucide-react';

export default function AdminFiles() {
  const { files, cabinets, fileTypes } = useAppContext();
  const [activeTab, setActiveTab] = useState<'files' | 'types'>('files');
  
  // Financial Year Calculation (Starts April 1)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed (April is 3)
  const baseYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  const financialYears = Array.from({ length: 11 }, (_, i) => {
    const startYear = baseYear - 5 + i;
    return `${startYear}-${startYear + 1}`;
  });

  const defaultFY = `${baseYear}-${baseYear + 1}`;

  // File Form State
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [fileData, setFileData] = useState({
    bdCollection: 'I',
    fileNumber: '',
    financialYear: defaultFY,
    fileName: '',
    fileTypeId: '',
    cabinetId: '',
    level: 1,
    column: 1,
    isLocker: false,
    isConfidential: false,
    password: ''
  });

  // Type Form State
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [typeData, setTypeData] = useState({
    name: '',
    defaultCabinetId: '',
    defaultLevel: 1,
    defaultColumn: 1,
    defaultIsLocker: false
  });

  const handleFileTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTypeId = e.target.value;
    const typeInfo = fileTypes.find(t => t.id === selectedTypeId);
    
    setFileData(prev => ({ ...prev, fileTypeId: selectedTypeId }));

    if (typeInfo && typeInfo.defaultCabinetId) {
      if (confirm(`Use default location for this file type? Cabinet: ${cabinets.find(c => c.id === typeInfo.defaultCabinetId)?.name}`)) {
        setFileData(prev => ({
          ...prev,
          cabinetId: typeInfo.defaultCabinetId || '',
          level: typeInfo.defaultLevel || 1,
          column: typeInfo.defaultColumn || 1,
          isLocker: typeInfo.defaultIsLocker || false
        }));
      }
    }
  };

  const saveFile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dbRef = editingFileId ? ref(database, `files/${editingFileId}`) : ref(database, 'files');
      if (editingFileId) {
        await set(dbRef, fileData);
      } else {
        await push(dbRef, fileData);
      }
      setEditingFileId(null);
      setFileData({ 
        bdCollection: 'I', 
        fileNumber: '', 
        financialYear: defaultFY, 
        fileName: '', 
        fileTypeId: '', 
        cabinetId: '', 
        level: 1, 
        column: 1, 
        isLocker: false, 
        isConfidential: false, 
        password: '' 
      });
    } catch (err) {
      console.error(err);
      alert('Error saving file details. Check console.');
    }
  };

  const saveType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dbRef = editingTypeId ? ref(database, `fileTypes/${editingTypeId}`) : ref(database, 'fileTypes');
      if (editingTypeId) {
        await set(dbRef, typeData);
      } else {
        await push(dbRef, typeData);
      }
      setEditingTypeId(null);
      setTypeData({ name: '', defaultCabinetId: '', defaultLevel: 1, defaultColumn: 1, defaultIsLocker: false });
    } catch (err) {
      console.error(err);
      alert('Error saving type. Check console.');
    }
  };

  const deleteRecord = async (path: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      await remove(ref(database, path));
    }
  };

  const getCabinetDetails = (id: string) => cabinets.find(c => c.id === id);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold text-slate-900">Manage Documents</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('files')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${activeTab === 'files' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
          >
            <Archive className="w-4 h-4" /> Files
          </button>
          <button
            onClick={() => setActiveTab('types')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${activeTab === 'types' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
          >
            <Type className="w-4 h-4" /> File Types
          </button>
        </div>
      </div>

      {/* FILES TAB */}
      {activeTab === 'files' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          {/* File Form */}
          <div className="xl:col-span-1 sticky top-6">
            <form onSubmit={saveFile} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-xl font-semibold mb-4 text-slate-800">{editingFileId ? 'Edit File' : 'Add New File'}</h2>
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">BD Coll.</label>
                  <select
                    value={fileData.bdCollection}
                    onChange={e => setFileData({ ...fileData, bdCollection: e.target.value as 'I' | 'II' })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="I">I</option>
                    <option value="II">II</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">File No</label>
                  <input
                    type="text"
                    required
                    value={fileData.fileNumber}
                    onChange={e => setFileData({ ...fileData, fileNumber: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. 123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fin. Year</label>
                  <select
                    value={fileData.financialYear}
                    onChange={e => setFileData({ ...fileData, financialYear: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {financialYears.map(fy => (
                      <option key={fy} value={fy}>{fy}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">File Name</label>
                <input
                  type="text"
                  required
                  value={fileData.fileName}
                  onChange={e => setFileData({ ...fileData, fileName: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">File Type (Optional)</label>
                <select
                  value={fileData.fileTypeId}
                  onChange={handleFileTypeChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Type (Optional)...</option>
                  {fileTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-2">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Storage Location</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cabinet</label>
                    <select
                      required
                      value={fileData.cabinetId}
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
                        
                        setFileData({ 
                          ...fileData, 
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

                  {fileData.cabinetId && getCabinetDetails(fileData.cabinetId)?.hasLocker && (
                    <div className="flex items-center bg-amber-50 p-3 rounded-lg border border-amber-200 mb-4 mt-2">
                      <input
                        type="checkbox"
                        id="isLocker"
                        checked={fileData.isLocker}
                        onChange={e => {
                          const checked = e.target.checked;
                          const cab = getCabinetDetails(fileData.cabinetId);
                          let newLevel = fileData.level;
                          let newCol = fileData.column;
                          if (checked && cab?.lockers && cab.lockers.length > 0) {
                             newLevel = cab.lockers[0].level;
                             newCol = cab.lockers[0].column || 1;
                          }
                          setFileData({ ...fileData, isLocker: checked, level: newLevel, column: newCol });
                        }}
                        className="h-4 w-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                      />
                      <label htmlFor="isLocker" className="ml-2 block text-sm font-medium text-amber-900">Store in Locker</label>
                    </div>
                  )}
                  
                  {fileData.cabinetId && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {fileData.isLocker ? 'Locker Level (Auto)' : 'Level (Row)'}
                        </label>
                        <select
                          value={fileData.level}
                          onChange={e => setFileData({ ...fileData, level: parseInt(e.target.value) })}
                          disabled={fileData.isLocker}
                          className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 ${fileData.isLocker ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white border-slate-300'}`}
                        >
                          {Array.from({ length: fileData.isLocker ? Math.max(10, fileData.level) : (getCabinetDetails(fileData.cabinetId)?.levels || 1) }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>Level {i + 1} {!fileData.isLocker && i === 0 ? '(Bottom)' : ''}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {fileData.isLocker ? 'Locker Column (Auto)' : 'Column'}
                        </label>
                        <select
                          value={fileData.column}
                          onChange={e => setFileData({ ...fileData, column: parseInt(e.target.value) })}
                          disabled={fileData.isLocker}
                          className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 ${fileData.isLocker ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white border-slate-300'}`}
                        >
                          {Array.from({ length: fileData.isLocker ? Math.max(10, fileData.column) : (getCabinetDetails(fileData.cabinetId)?.levelColumns?.[fileData.level] || getCabinetDetails(fileData.cabinetId)?.columns || 1) }).map((_, i) => (
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
                    checked={fileData.isConfidential}
                    onChange={e => setFileData({ ...fileData, isConfidential: e.target.checked })}
                    className="h-4 w-4 text-red-600 rounded border-gray-300"
                  />
                  <label htmlFor="isConfidential" className="ml-2 flex items-center text-sm font-medium text-gray-900">
                    <Shield className="w-4 h-4 mr-1 text-red-500" />
                    Confidential (Password Protected)
                  </label>
                </div>
                {fileData.isConfidential && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Access Password</label>
                    <input
                      type="text"
                      required
                      value={fileData.password}
                      onChange={e => setFileData({ ...fileData, password: e.target.value })}
                      className="w-full rounded-lg border border-red-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Enter access password"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                  {editingFileId ? 'Update File' : 'Save File'}
                </button>
                {editingFileId && (
                  <button type="button" onClick={() => { 
                    setEditingFileId(null); 
                    setFileData({ 
                      bdCollection: 'I', 
                      fileNumber: '', 
                      financialYear: defaultFY, 
                      fileName: '', 
                      fileTypeId: '', 
                      cabinetId: '', 
                      level: 1, 
                      column: 1, 
                      isLocker: false, 
                      isConfidential: false, 
                      password: '' 
                    }); 
                  }} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300 transition">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* File List Grouped by Type */}
          <div className="xl:col-span-2 space-y-6">
            {fileTypes.map(type => {
              const filesOfType = files.filter(f => f.fileTypeId === type.id);
              if (filesOfType.length === 0) return null;
              return (
                <div key={type.id} className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-700 border-b border-slate-200 pb-2">{type.name}</h3>
                  {filesOfType.map(file => (
                    <div key={file.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center hover:border-indigo-300 transition group ml-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md">BD {file.bdCollection}</span>
                          <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">{file.fileNumber}/{file.financialYear}</span>
                          {file.isConfidential && <span className="text-xs flex items-center bg-red-100 text-red-800 px-2 py-1 rounded-md"><Lock className="w-3 h-3 mr-1" /> Confidential</span>}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{file.fileName}</h3>
                        <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 bg-slate-50 p-2 rounded-lg inline-flex border border-slate-100 mt-2">
                          <span className="font-semibold text-slate-700">Cabinet:</span> {getCabinetDetails(file.cabinetId)?.name || 'Unknown'}
                          <span className="text-slate-300">|</span>
                          <span className="font-semibold text-slate-700">Location:</span> {file.isLocker ? `Locker (Level ${file.level}, Col ${file.column})` : `Level ${file.level}, Column ${file.column}`}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => { 
                          setEditingFileId(file.id); 
                          setFileData({ 
                            bdCollection: file.bdCollection, 
                            fileNumber: file.fileNumber, 
                            financialYear: file.financialYear || defaultFY, 
                            fileName: file.fileName, 
                            fileTypeId: file.fileTypeId, 
                            cabinetId: file.cabinetId, 
                            level: file.level, 
                            column: file.column, 
                            isLocker: file.isLocker, 
                            isConfidential: file.isConfidential, 
                            password: file.password || '' 
                          }); 
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => deleteRecord(`files/${file.id}`)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
            
            {/* Uncategorized files */}
            {(() => {
              const uncategorized = files.filter(f => !f.fileTypeId || !fileTypes.some(t => t.id === f.fileTypeId));
              if (uncategorized.length === 0) return null;
              return (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-700 border-b border-slate-200 pb-2">Uncategorized</h3>
                  {uncategorized.map(file => (
                    <div key={file.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center hover:border-indigo-300 transition group ml-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md">BD {file.bdCollection}</span>
                          <span className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">{file.fileNumber}/{file.financialYear}</span>
                          {file.isConfidential && <span className="text-xs flex items-center bg-red-100 text-red-800 px-2 py-1 rounded-md"><Lock className="w-3 h-3 mr-1" /> Confidential</span>}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{file.fileName}</h3>
                        <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 bg-slate-50 p-2 rounded-lg inline-flex border border-slate-100 mt-2">
                          <span className="font-semibold text-slate-700">Cabinet:</span> {getCabinetDetails(file.cabinetId)?.name || 'Unknown'}
                          <span className="text-slate-300">|</span>
                          <span className="font-semibold text-slate-700">Location:</span> {file.isLocker ? `Locker (Level ${file.level}, Col ${file.column})` : `Level ${file.level}, Column ${file.column}`}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => { 
                          setEditingFileId(file.id); 
                          setFileData({ 
                            bdCollection: file.bdCollection, 
                            fileNumber: file.fileNumber, 
                            financialYear: file.financialYear || defaultFY, 
                            fileName: file.fileName, 
                            fileTypeId: file.fileTypeId, 
                            cabinetId: file.cabinetId, 
                            level: file.level, 
                            column: file.column, 
                            isLocker: file.isLocker, 
                            isConfidential: file.isConfidential, 
                            password: file.password || '' 
                          }); 
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => deleteRecord(`files/${file.id}`)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {files.length === 0 && <div className="text-center py-12 text-slate-500 border border-dashed border-slate-300 rounded-2xl">No files found.</div>}
          </div>
        </div>
      )}

      {/* TYPES TAB */}
      {activeTab === 'types' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="md:col-span-1 sticky top-6">
            <form onSubmit={saveType} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-xl font-semibold mb-4 text-slate-800">{editingTypeId ? 'Edit File Type' : 'Add File Type'}</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type Name</label>
                <input type="text" required value={typeData.name} onChange={e => setTypeData({ ...typeData, name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Leave and Personal File" />
              </div>
              
              <div className="border-t border-slate-100 pt-4 mt-2">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Default Storage (Optional)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Default Cabinet</label>
                    <select value={typeData.defaultCabinetId} onChange={e => setTypeData({ ...typeData, defaultCabinetId: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">None</option>
                      {cabinets.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  {typeData.defaultCabinetId && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
                        <input type="number" min="1" value={typeData.defaultLevel} onChange={e => setTypeData({ ...typeData, defaultLevel: parseInt(e.target.value) })} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Column</label>
                        <input type="number" min="1" value={typeData.defaultColumn} onChange={e => setTypeData({ ...typeData, defaultColumn: parseInt(e.target.value) })} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                  )}
                  {typeData.defaultCabinetId && getCabinetDetails(typeData.defaultCabinetId)?.hasLocker && (
                      <div className="flex items-center">
                        <input type="checkbox" id="typeIsLocker" checked={typeData.defaultIsLocker} onChange={e => setTypeData({ ...typeData, defaultIsLocker: e.target.checked })} className="h-4 w-4 text-indigo-600 rounded border-gray-300" />
                        <label htmlFor="typeIsLocker" className="ml-2 block text-sm text-gray-900">Default to Locker</label>
                      </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">Save Type</button>
                {editingTypeId && (
                  <button type="button" onClick={() => { setEditingTypeId(null); setTypeData({ name: '', defaultCabinetId: '', defaultLevel: 1, defaultColumn: 1, defaultIsLocker: false }); }} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300 transition">Cancel</button>
                )}
              </div>
            </form>
          </div>

          <div className="space-y-4">
            {fileTypes.map(type => (
              <div key={type.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center group">
                <div>
                  <h3 className="font-bold text-slate-900">{type.name}</h3>
                  {type.defaultCabinetId && (
                    <p className="text-xs text-slate-500 mt-1 flex flex-col">
                      <span>Default Cabinet: {getCabinetDetails(type.defaultCabinetId)?.name}</span>
                      <span>Level {type.defaultLevel}, Col {type.defaultColumn} {type.defaultIsLocker ? '(Locker)' : ''}</span>
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { 
                    setEditingTypeId(type.id); 
                    setTypeData({ name: type.name, defaultCabinetId: type.defaultCabinetId || '', defaultLevel: type.defaultLevel || 1, defaultColumn: type.defaultColumn || 1, defaultIsLocker: type.defaultIsLocker || false }); 
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit"><Edit2 className="w-5 h-5" /></button>
                  <button onClick={() => deleteRecord(`fileTypes/${type.id}`)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
