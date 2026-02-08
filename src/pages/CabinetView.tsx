import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAppContext } from '../AppContext';
import { Archive, Layers, Printer, Lock, MapPin, X, Edit } from 'lucide-react';
import { ref, update } from 'firebase/database';
import { database } from '../firebase';
import { getCabinetUrl, getFileUrl } from '../utils/urls';

export default function CabinetView() {
  const { id } = useParams<{ id: string }>();
  const { cabinets, files, documents, loading, user } = useAppContext();
  const [printMode, setPrintMode] = useState(false);

  // File Location Modal State
  const [fileToMove, setFileToMove] = useState<any>(null);
  const [newLoc, setNewLoc] = useState({
    cabinetId: '',
    level: 1,
    column: 1,
    isLocker: false,
    type: 'file'
  });

  // Print options
  const [includeQR, setIncludeQR] = useState(true);
  const [printLarge, setPrintLarge] = useState(false);
  const [printQROnly, setPrintQROnly] = useState(false);
  const [printColumnsSeparately, setPrintColumnsSeparately] = useState(false);
  const [includeColumnQR, setIncludeColumnQR] = useState(false);

  if (loading) return <div className="text-center p-8 text-slate-500">Loading Cabinet...</div>;

  const cabinet = cabinets.find(c => c.id === id);
  if (!cabinet) return <div className="text-center p-8 text-slate-500">Cabinet not found.</div>;

  // Combine both Files and Documents for the mapping engine
  const combinedItems = [
    ...files.map(f => ({
      ...f,
      type: 'file' as const,
      level: Number(f.level) || 1,
      column: Number(f.column) || 1,
      isLocker: f.isLocker === true || String(f.isLocker) === 'true',
      isConfidential: f.isConfidential === true || String(f.isConfidential) === 'true'
    })),
    ...documents.map(d => ({
      ...d,
      type: 'document' as const,
      level: Number(d.level) || 1,
      column: Number(d.column) || 1,
      isLocker: d.isLocker === true || String(d.isLocker) === 'true',
      fileNumber: d.documentNumber || 'Unnamed Document',
      fileName: d.documentType ? `Type: ${d.documentType}` : 'Document',
      financialYear: '',
      isConfidential: d.isConfidential === true || String(d.isConfidential) === 'true'
    }))
  ];

  const cabinetFiles = combinedItems.filter(item => item.cabinetId === id);

  // Level 1 is bottom, render top to bottom
  const rows = Array.from({ length: cabinet.levels }, (_, i) => cabinet.levels - i);

  // Generate hash-based URL for QR codes
  const cabinetQRUrl = getCabinetUrl(id || '');

  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 100);
  };

  const handleMoveClick = (e: React.MouseEvent, file: any) => {
    e.preventDefault();
    e.stopPropagation();
    setFileToMove(file);
    setNewLoc({
      cabinetId: file.cabinetId,
      level: file.level || 1,
      column: file.column || 1,
      isLocker: file.isLocker || false,
      type: file.type || 'file'
    });
  };

  const saveNewLocation = async () => {
    if (!fileToMove) return;
    try {
      const endpoint = newLoc.type === 'document' ? 'documents' : 'files';
      await update(ref(database, `${endpoint}/${fileToMove.id}`), {
        cabinetId: newLoc.cabinetId,
        level: newLoc.level,
        column: newLoc.column,
        isLocker: newLoc.isLocker
      });
      setFileToMove(null);
    } catch (err) {
      console.error('Error updating file location:', err);
      alert('Failed to update file location.');
    }
  };

  const targetCabinetConfig = cabinets.find(c => c.id === newLoc.cabinetId) || cabinet;

  // Helper: check if a level is a whole-level locker
  const isWholeLevelLocker = (level: number) => {
    if (!cabinet.lockers || !Array.isArray(cabinet.lockers)) return false;
    return cabinet.lockers.some(l => Number(l.level) === level && (l.column === null || l.column === undefined));
  };

  // Helper: get specific locker columns for a level
  const getSpecificLockerCols = (level: number) => {
    if (!cabinet.lockers || !Array.isArray(cabinet.lockers)) return [];
    return cabinet.lockers
      .filter(l => Number(l.level) === level && l.column !== null && l.column !== undefined)
      .map(l => Number(l.column));
  };

  // Helper: get column count for a level
  const getColsForLevel = (level: number) => {
    return cabinet.levelColumns?.[level] || cabinet.columns;
  };

  // Helper: get files for a specific cell
  const getFilesInCell = (level: number, column?: number) => {
    if (column === undefined) {
      return cabinetFiles.filter(f => Number(f.level) === level);
    }
    return cabinetFiles.filter(f => Number(f.level) === level && Number(f.column) === column);
  };

  // Render a single file card
  const renderFileCard = (file: any, isLockerCell: boolean) => {
    const fileUrl = getFileUrl(file.id);
    return (
      <Link
        key={file.id}
        to={`/file/${file.id}`}
        className={`bg-white p-2.5 rounded-lg shadow-sm border flex flex-col gap-1 no-print-link relative overflow-hidden group ${isLockerCell ? 'border-amber-200 hover:border-amber-400' : 'border-slate-200 hover:border-indigo-400'}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1 items-start">
            {file.bdCollection ? (
              <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${isLockerCell ? 'text-amber-900 bg-amber-50 border-amber-200' : 'text-slate-600 bg-slate-100 border-slate-200'}`}>
                BD: {file.bdCollection}
              </span>
            ) : null}
            <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded border ${isLockerCell ? 'text-amber-800 bg-amber-100 border-amber-200' : 'text-indigo-700 bg-indigo-50 border-indigo-100'}`}>
              {file.fileNumber}{file.financialYear ? `/${file.financialYear}` : ''}
            </span>
          </div>
          {file.isConfidential && <Lock className="w-3 h-3 text-red-500 shrink-0 ml-1" />}
        </div>
        <div className="flex flex-col mt-1">
          <span className="text-sm text-slate-800 line-clamp-2 leading-tight">
            {file.fileName}
          </span>
          {file.isConfidential && (
            <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded w-fit shadow-sm">
              <Lock className="w-3 h-3" /> Confidential
            </span>
          )}
          {file.type === 'document' && (
            <span className="mt-1 inline-flex items-center text-[10px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded w-fit">
              Document
            </span>
          )}
        </div>
        {user && (
          <button
            onClick={(e) => handleMoveClick(e, file)}
            className={`no-print mt-1 text-xs font-semibold flex items-center p-1 rounded transition w-fit ${isLockerCell ? 'text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100' : 'text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100'}`}
          >
            <MapPin className="w-3 h-3 mr-1" /> Move
          </button>
        )}
        {/* Tiny QR on each file card for print */}
        <div className="hidden print:block mt-1">
          <QRCodeSVG value={file.isConfidential ? fileUrl : `Name: ${file.fileName}\nNo: ${file.fileNumber}${file.financialYear ? '/' + file.financialYear : ''}\nCabinet: ${cabinet.name}\nLoc: ${file.isLocker ? `Locker L${file.level} C${file.column}` : `L${file.level} C${file.column}`}\n\n${fileUrl}`} size={28} level="L" />
        </div>
      </Link>
    );
  };

  return (
    <div className={`space-y-6 ${printMode ? 'print-mode' : ''}`}>
      {/* Header & Print Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-4 no-print">
        <div>
          <Link to="/" className="text-indigo-600 hover:text-indigo-800 text-sm mb-2 inline-block">&larr; Back to Dashboard</Link>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Archive className="w-8 h-8 text-indigo-600" /> {cabinet.name}
          </h1>
          <p className="text-slate-500 mt-1">
            {cabinet.levels} Levels &times; {cabinet.columns} Columns {cabinet.hasLocker ? '| Includes Locker' : ''}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 w-full sm:w-auto">
          <div className="flex flex-wrap items-center justify-end gap-4 text-sm font-medium text-slate-700">
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" checked={includeQR} onChange={e => setIncludeQR(e.target.checked)} className="mr-2 h-4 w-4 text-indigo-600 rounded" />
              Include Layout QR
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" checked={printLarge} onChange={e => setPrintLarge(e.target.checked)} className="mr-2 h-4 w-4 text-indigo-600 rounded" />
              Print Large Format
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" checked={printQROnly} onChange={e => setPrintQROnly(e.target.checked)} className="mr-2 h-4 w-4 text-indigo-600 rounded" />
              Print QR (Large) Only
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" checked={printColumnsSeparately} onChange={e => setPrintColumnsSeparately(e.target.checked)} className="mr-2 h-4 w-4 text-indigo-600 rounded" />
              Print Column List
            </label>
            {printColumnsSeparately && (
              <label className="flex items-center cursor-pointer text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                <input type="checkbox" checked={includeColumnQR} onChange={e => setIncludeColumnQR(e.target.checked)} className="mr-2 h-4 w-4 text-indigo-600 rounded" />
                Include Column QRs
              </label>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto mt-2">
            {user && (
              <Link to="/admin/cabinets" className="flex items-center px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm justify-center flex-1 sm:flex-none">
                <Edit className="w-4 h-4 mr-2" /> Edit Layout
              </Link>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm flex-1 sm:flex-none justify-center"
            >
              <Printer className="w-5 h-5 mr-2" /> Print Map
            </button>
          </div>
        </div>
      </div>

      {/* Print-Only: QR Header Block */}
      {(includeQR || printQROnly) && (
        <div className={`print-only hidden relative ${printQROnly ? 'flex-col items-center justify-center h-screen' : 'mb-8 pb-4 border-b border-gray-300'}`}>
          <div className="absolute top-0 right-0 text-sm text-gray-500 font-medium">{new Date().toLocaleDateString()}</div>
          <div className={`flex ${printQROnly ? 'flex-col text-center' : 'items-center justify-between'} w-full`}>
            <div className={printQROnly ? 'mb-8' : ''}>
              <h1 className={`${printQROnly ? 'text-5xl' : 'text-3xl'} font-bold text-black mb-4`}>Cabinet: {cabinet.name}</h1>
              {!printQROnly && (
                <p className="text-md text-gray-700 max-w-lg">
                  This document contains the physical layout mapping for files stored in this cabinet.
                  Scan the QR code to access the digital version.
                </p>
              )}
            </div>
            <div className={`flex flex-col items-center border-4 border-black p-4 rounded-xl bg-gray-50 ${printQROnly ? 'mt-8' : ''}`}>
              <QRCodeSVG value={cabinetQRUrl} size={printQROnly ? 400 : (printLarge ? 200 : 120)} level="M" />
              <span className={`${printQROnly ? 'text-xl' : 'text-xs'} font-bold mt-4 uppercase tracking-widest`}>Scan to View Cabinet Info</span>
            </div>
          </div>
        </div>
      )}

      {/* Print-Only: Separate Column Details */}
      {printColumnsSeparately && (
        <div className="hidden print:block w-full">
          {rows.map(row => {
            const wholeLevelLocker = isWholeLevelLocker(row);
            const customColCount = getColsForLevel(row);
            const specificLockerColsList = getSpecificLockerCols(row);
            const hasSpecificLockers = specificLockerColsList.length > 0;
            const allCols = Array.from({ length: customColCount }, (_, i) => i + 1);
            const columnsToRender = hasSpecificLockers ? specificLockerColsList.sort((a, b) => a - b) : allCols;

            if (wholeLevelLocker) {
              const filesInCell = getFilesInCell(row);
              return (
                <div key={`print-row-${row}`} className="mb-8 p-6 border-2 border-black rounded-xl page-break-inside-avoid relative">
                  <div className="absolute top-4 right-4 text-sm text-gray-500">{new Date().toLocaleDateString()}</div>
                  <h2 className="text-2xl font-bold mb-2">Cabinet: {cabinet.name}</h2>
                  <h3 className="text-xl text-gray-700 mb-4 flex items-center"><Lock className="w-5 h-5 mr-2" /> LOCKER STORAGE (LEVEL {row})</h3>
                  <div className="flex gap-6">
                    {includeColumnQR && (
                      <div className="border p-2 self-start flex-shrink-0">
                        <QRCodeSVG value={cabinetQRUrl} size={100} level="M" />
                      </div>
                    )}
                    <div className="flex-1 space-y-3">
                      {filesInCell.length === 0 ? <p className="italic text-gray-500">Empty Locker Level</p> :
                        filesInCell.map(f => (
                          <div key={f.id} className="border-b border-gray-200 pb-2 flex justify-between">
                            <div>
                              <span className="font-bold">{f.fileNumber}{f.financialYear ? `/${f.financialYear}` : ''}</span>
                              <span className="ml-4">{f.fileName}</span>
                              {f.bdCollection ? <span className="ml-4 text-sm text-gray-500">BD: {f.bdCollection}</span> : null}
                              {f.type === 'document' && <span className="ml-2 text-sm text-purple-600">[Doc]</span>}
                            </div>
                            {f.isConfidential && <span className="text-red-600 font-bold uppercase text-sm"><Lock className="w-3 h-3 inline mr-1" /> Confidential</span>}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              );
            }

            return columnsToRender.map(col => {
              const isColLocker = specificLockerColsList.includes(col);
              const filesInCell = getFilesInCell(row, col);

              return (
                <div key={`print-row-${row}-col-${col}`} className="mb-8 p-6 border-2 border-black rounded-xl page-break-inside-avoid relative">
                  <div className="absolute top-4 right-4 text-sm text-gray-500">{new Date().toLocaleDateString()}</div>
                  <h2 className="text-2xl font-bold mb-2">Cabinet: {cabinet.name}</h2>
                  <h3 className="text-xl text-gray-700 mb-4">Location: Level {row} - Column {col} {isColLocker ? '(Locker)' : ''}</h3>
                  <div className="flex gap-6">
                    {includeColumnQR && (
                      <div className="border p-2 self-start flex-shrink-0 bg-white">
                        <QRCodeSVG value={cabinetQRUrl} size={100} level="M" />
                      </div>
                    )}
                    <div className="flex-1 space-y-3">
                      {filesInCell.length === 0 ? <p className="italic text-gray-500">Empty {isColLocker ? 'Locker' : 'Column'}</p> :
                        filesInCell.map(f => (
                          <div key={f.id} className="border-b border-gray-200 pb-2 flex justify-between">
                            <div>
                              <span className="font-bold">{f.fileNumber}{f.financialYear ? `/${f.financialYear}` : ''}</span>
                              <span className="ml-4">{f.fileName}</span>
                              {f.bdCollection ? <span className="ml-4 text-sm text-gray-500">BD: {f.bdCollection}</span> : null}
                              {f.type === 'document' && <span className="ml-2 text-sm text-purple-600">[Doc]</span>}
                            </div>
                            {f.isConfidential && <span className="text-red-600 font-bold uppercase text-sm"><Lock className="w-3 h-3 inline mr-1" /> Confidential</span>}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              );
            });
          })}
        </div>
      )}

      {/* Main Cabinet Drawing */}
      <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto print-container ${printQROnly || printColumnsSeparately ? 'no-print' : ''}`}>
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2 no-print">
          <Layers className="w-5 h-5" /> Cabinet Structure Mapping
        </h2>

        <div className="inline-block min-w-full">
          <div className="flex flex-col gap-4">
            {rows.map(row => {
              const wholeLevelLocker = isWholeLevelLocker(row);
              const customColCount = getColsForLevel(row);
              const specificLockerColsList = getSpecificLockerCols(row);
              const hasSpecificLockers = specificLockerColsList.length > 0;
              const allCols = Array.from({ length: customColCount }, (_, i) => i + 1);

              // If specific locker columns exist, only render those for this level
              const columnsToRender = hasSpecificLockers ? specificLockerColsList.sort((a, b) => a - b) : allCols;

              return (
                <div key={`row-${row}`} className="flex gap-4">
                  {/* Level Label */}
                  <div className={`w-20 flex flex-col justify-center items-center rounded-lg border font-bold shadow-inner ${wholeLevelLocker ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                    <span className="text-xs uppercase tracking-widest">{wholeLevelLocker ? 'Locker' : 'Level'}</span>
                    <span className="text-2xl">{row}</span>
                  </div>

                  <div className="flex gap-4 flex-1">
                    {wholeLevelLocker ? (
                      /* Whole Level Locker */
                      <div className="flex-1 min-w-[220px] border-2 border-amber-300 rounded-xl bg-amber-50/50 p-4 flex flex-col gap-3 transition relative shadow-sm">
                        <div className="text-xs font-bold text-amber-700 uppercase tracking-wide flex justify-between items-center mb-1">
                          <span className="bg-amber-200 px-3 py-1.5 rounded-lg text-amber-900 flex items-center gap-2">
                            <Lock className="w-4 h-4" /> LOCKER STORAGE (LEVEL {row})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 flex-1">
                          {getFilesInCell(row).length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-amber-600/50 text-sm italic border border-dashed border-amber-200 rounded-lg py-8 w-full">
                              Empty Locker Level
                            </div>
                          ) : (
                            getFilesInCell(row).map(file => renderFileCard(file, true))
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Normal columns or specific locker columns */
                      columnsToRender.map(col => {
                        const isColLocker = hasSpecificLockers || (cabinet.lockers && cabinet.lockers.some(l => Number(l.level) === row && Number(l.column) === col));
                        const filesInCell = getFilesInCell(row, col);

                        return (
                          <div key={`col-${col}`} className={`flex-1 min-w-[220px] border-2 rounded-xl p-3 flex flex-col gap-2 transition relative ${isColLocker ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300'}`}>
                            <div className={`text-xs font-bold uppercase tracking-wide flex justify-between items-center mb-1 ${isColLocker ? 'text-amber-700' : 'text-slate-500'}`}>
                              <span className={`px-2 py-1 rounded flex items-center gap-1 ${isColLocker ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'}`}>
                                {isColLocker && <Lock className="w-3 h-3" />} Col {col} {isColLocker && '(Locker)'}
                              </span>
                            </div>

                            <div className="flex flex-col gap-2 mt-1 flex-1">
                              {filesInCell.length === 0 ? (
                                <div className={`flex-1 flex items-center justify-center text-sm italic border border-dashed rounded-lg py-4 ${isColLocker ? 'text-amber-600/50 border-amber-200' : 'text-slate-400 border-slate-300'}`}>
                                  Empty {isColLocker ? 'Locker' : 'Column'}
                                </div>
                              ) : (
                                filesInCell.map(file => renderFileCard(file, !!isColLocker))
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Move Location Modal (Admin Only) */}
      {user && fileToMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                Change File Location
              </h3>
              <button onClick={() => setFileToMove(null)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-indigo-50 text-indigo-800 p-3 rounded-lg text-sm mb-2 border border-indigo-100">
                <span className="font-bold">Moving:</span> {fileToMove.fileName || `No. ${fileToMove.fileNumber}`}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cabinet</label>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newLoc.cabinetId}
                  onChange={(e) => setNewLoc({ ...newLoc, cabinetId: e.target.value, level: 1, column: 1, isLocker: false })}
                >
                  {cabinets.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {targetCabinetConfig && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {newLoc.isLocker ? 'Locker Level' : 'Level (Row)'}
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newLoc.level}
                      onChange={(e) => setNewLoc({ ...newLoc, level: parseInt(e.target.value) })}
                    >
                      {Array.from({ length: targetCabinetConfig.levels || 1 }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>Level {i + 1}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {newLoc.isLocker ? 'Locker Column' : 'Column'}
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newLoc.column}
                      onChange={(e) => setNewLoc({ ...newLoc, column: parseInt(e.target.value) })}
                    >
                      {Array.from({ length: targetCabinetConfig.levelColumns?.[newLoc.level] || targetCabinetConfig.columns || 1 }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>Column {i + 1}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {targetCabinetConfig?.hasLocker && (
                <div className="flex items-center mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <input
                    type="checkbox"
                    id="modalLocker"
                    checked={newLoc.isLocker}
                    onChange={(e) => setNewLoc({ ...newLoc, isLocker: e.target.checked })}
                    className="h-4 w-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                  />
                  <label htmlFor="modalLocker" className="ml-2 block text-sm font-medium text-amber-900">
                    Store in Locker
                  </label>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setFileToMove(null)}
                className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveNewLocation}
                className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Save Location
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page { size: ${printLarge ? 'A3' : 'A4'} portrait; margin: 10mm; }
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: visible !important; zoom: ${printLarge ? '1.25' : '1'}; }
          .no-print { display: none !important; }
          nav { display: none !important; }
          header { display: none !important; }
          .print-only { display: flex !important; }
          .print-mode .print-container { box-shadow: none !important; border: none !important; padding: 0 !important; overflow: visible !important; }
          .print-mode .overflow-x-auto { overflow: visible !important; }
          .print-mode .min-w-full { min-width: auto !important; width: 100% !important; }
          .no-print-link { pointer-events: none; }
          .flex.gap-4 { page-break-inside: avoid; break-inside: avoid; }
          .page-break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
