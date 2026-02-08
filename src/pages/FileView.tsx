import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAppContext } from '../AppContext';
import { FileText, Archive, MapPin, Shield, Lock, Unlock } from 'lucide-react';
import { getFileUrl } from '../utils/urls';

export default function FileView() {
  const { id } = useParams<{ id: string }>();
  const { files, documents, cabinets, fileTypes, loading } = useAppContext();
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');

  if (loading) return <div className="text-center p-8 text-slate-500">Loading Document...</div>;

  // Try to find in files first, then documents
  let file: any = files.find(f => f.id === id);
  let itemType = 'file';

  if (!file) {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      file = {
        ...doc,
        type: 'document',
        fileNumber: doc.documentNumber,
        fileName: doc.documentType || 'Document',
        financialYear: ''
      };
      itemType = 'document';
    }
  }

  // Fallback: parse info from URL search params (for users without DB access)
  const hashSearch = window.location.hash.split('?')[1] || '';
  const urlParams = new URLSearchParams(hashSearch);
  const fallbackName = urlParams.get('name');
  const fallbackNum = urlParams.get('num');
  const fallbackCab = urlParams.get('cab');
  const fallbackLoc = urlParams.get('loc');

  if (!file && !fallbackName) {
    return (
      <div className="text-center p-12">
        <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">Document Not Found</h2>
        <p className="text-slate-500 mb-4">This document may have been removed or the link is incorrect.</p>
        <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
          &larr; Go to Dashboard
        </Link>
      </div>
    );
  }

  // Build display object from DB data or URL fallback
  const displayFile = file || {
    isConfidential: false,
    fileName: fallbackName,
    fileNumber: fallbackNum ? fallbackNum.split('/')[0] : '',
    financialYear: fallbackNum && fallbackNum.includes('/') ? fallbackNum.split('/')[1] : '',
    synthetic: true,
    syntheticCab: fallbackCab,
    syntheticLoc: fallbackLoc
  };

  const cabinet = file ? cabinets.find(c => c.id === file.cabinetId) : null;
  const fileType = file && itemType !== 'document' ? fileTypes.find(t => t.id === file.fileTypeId) : null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === displayFile.password) {
      setUnlocked(true);
      setError('');
    } else {
      setError('Incorrect password.');
    }
  };

  const isSecured = displayFile.isConfidential && !unlocked;

  // Generate QR value
  const fileUrl = getFileUrl(id || '');
  let qrValue = fileUrl;
  if (!displayFile.isConfidential && !displayFile.synthetic) {
    const cabName = cabinet?.name || 'Unknown Cabinet';
    const loc = displayFile.isLocker ? `Locker (L${displayFile.level} C${displayFile.column})` : `L${displayFile.level} C${displayFile.column}`;
    qrValue = `Name: ${displayFile.fileName || 'Document'}\nNo: ${displayFile.fileNumber}${displayFile.financialYear ? '/' + displayFile.financialYear : ''}\nCabinet: ${cabName}\nLocation: ${loc}\n\n${fileUrl}`;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/" className="text-indigo-600 hover:text-indigo-800 text-sm mb-4 inline-block">&larr; Back to Dashboard</Link>

      {isSecured ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-200 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Confidential Document</h1>
          <p className="text-slate-500 max-w-sm mx-auto">This document is password protected. Enter the access code to view details.</p>

          <form onSubmit={handleUnlock} className="max-w-sm mx-auto space-y-4">
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 text-center text-lg tracking-widest"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
            >
              <Unlock className="w-4 h-4 mr-2" /> Unlock Document
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className={`p-6 border-b flex items-start justify-between ${displayFile.isConfidential ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-indigo-100'}`}>
            <div className="flex items-start gap-4">
              <div className={`p-4 rounded-xl ${displayFile.isConfidential ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {displayFile.bdCollection && (
                    <span className="text-xs font-bold uppercase tracking-wider bg-white px-2 py-1 rounded-md shadow-sm">BD {displayFile.bdCollection}</span>
                  )}
                  {displayFile.isConfidential && (
                    <span className="text-xs font-bold uppercase flex items-center bg-red-100 text-red-800 px-2 py-1 rounded-md shadow-sm">
                      <Shield className="w-3 h-3 mr-1" /> Confidential
                    </span>
                  )}
                  {itemType === 'document' && (
                    <span className="text-xs font-bold uppercase bg-purple-100 text-purple-800 px-2 py-1 rounded-md shadow-sm">
                      Document
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-slate-900">{displayFile.fileName || 'Unknown File'}</h1>
                <p className="text-slate-600 font-mono mt-1">{displayFile.fileNumber}{displayFile.financialYear ? `/${displayFile.financialYear}` : ''}</p>
              </div>
            </div>
            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
              <QRCodeSVG value={qrValue} size={80} level="M" />
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Document Details</h3>
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {fileType && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">File Type</span>
                      <span className="font-medium text-slate-900">{fileType.name}</span>
                    </div>
                  )}
                  {displayFile.bdCollection && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Collection</span>
                      <span className="font-medium text-slate-900">BD {displayFile.bdCollection}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Number / FY</span>
                    <span className="font-medium text-slate-900 font-mono">{displayFile.fileNumber}{displayFile.financialYear ? `/${displayFile.financialYear}` : ''}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Storage Location</h3>
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <div className="flex items-start gap-3">
                    <Archive className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <div>
                      {displayFile.synthetic ? (
                        <>
                          <p className="font-bold text-indigo-900">{displayFile.syntheticCab || 'Unknown Cabinet'}</p>
                          <p className="text-indigo-700 mt-1 flex items-center"><MapPin className="w-4 h-4 mr-1" /> {displayFile.syntheticLoc || 'Unknown Location'}</p>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-indigo-900">{cabinet?.name || 'Unknown Cabinet'}</p>
                          {displayFile.isLocker ? (
                            <p className="text-indigo-700 mt-1 flex items-center"><Lock className="w-4 h-4 mr-1" /> Stored in Locker (Level {displayFile.level}, Col {displayFile.column})</p>
                          ) : (
                            <p className="text-indigo-700 mt-1 flex items-center"><MapPin className="w-4 h-4 mr-1" /> Level {displayFile.level}, Column {displayFile.column}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {cabinet && (
                    <div className="mt-4 pt-4 border-t border-indigo-200">
                      <Link to={`/cabinet/${cabinet.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
                        View Cabinet Structure &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
