import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAppContext } from '../AppContext';
import { Printer, CheckSquare, Square, Shield } from 'lucide-react';

export default function AdminQRs() {
  const { files, documents, cabinets } = useAppContext();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [includeQR, setIncludeQR] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [confidentialQrOnly, setConfidentialQrOnly] = useState(true);

  // Combine files and documents
  const allItems = [
    ...files.map(f => ({ ...f, itemType: 'file' })),
    ...documents.map(d => ({
      ...d,
      itemType: 'document',
      fileNumber: d.documentNumber,
      fileName: d.documentType || 'Document',
      financialYear: ''
    }))
  ];

  const filteredFiles = allItems.filter(f => 
    (f.fileNumber && f.fileNumber.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (f.fileName && f.fileName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleSelection = (id: string) => {
    setSelectedFiles(prev => prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map(f => f.id));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getCabinetName = (id: string) => cabinets.find(c => c.id === id)?.name || 'Unknown Cabinet';

  return (
    <div className="space-y-6">
      <div className="print:hidden space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">QR Code Generator</h1>
            <p className="text-slate-500 mt-2">Select files to print their QR labels on an A4 sheet.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              disabled={selectedFiles.length === 0}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Printer className="w-5 h-5 mr-2" /> Print Selected ({selectedFiles.length})
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <input
              type="text"
              placeholder="Search by number or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-96 rounded-lg border border-slate-300 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={selectAll} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap">
              {selectedFiles.length === filteredFiles.length ? 'Deselect All' : 'Select All Filtered'}
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100 text-sm font-medium text-slate-700">
            <span className="text-slate-500 mr-2">Print Options:</span>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" checked={includeQR} onChange={e => setIncludeQR(e.target.checked)} className="mr-2 h-4 w-4 text-indigo-600 rounded" />
              Include QR Code
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" checked={includeDetails} onChange={e => setIncludeDetails(e.target.checked)} className="mr-2 h-4 w-4 text-indigo-600 rounded" />
              Include Text Details
            </label>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" checked={confidentialQrOnly} onChange={e => setConfidentialQrOnly(e.target.checked)} className="mr-2 h-4 w-4 text-red-600 rounded border-red-300" />
              QR Only for Confidential Files
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map(file => (
            <div
              key={file.id}
              onClick={() => toggleSelection(file.id)}
              className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${selectedFiles.includes(file.id) ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300'}`}
            >
              <div className="flex justify-between items-start mb-2">
                {selectedFiles.includes(file.id) ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-slate-400" />}
                {file.isConfidential && <Shield className="w-4 h-4 text-red-500" />}
              </div>
              <h3 className="font-bold text-slate-900 line-clamp-1">{file.fileName}</h3>
              <p className="text-xs text-slate-500 font-mono mt-1">{file.fileNumber}/{file.financialYear}</p>
            </div>
          ))}
          {filteredFiles.length === 0 && (
            <div className="col-span-full text-center py-8 text-slate-500 border border-dashed border-slate-300 rounded-xl">
              No files found.
            </div>
          )}
        </div>
      </div>

      {/* Print View - Only visible when printing */}
      <div className="hidden print:block">
        <div className="print-grid">
          {selectedFiles.map(fileId => {
            const file = allItems.find(f => f.id === fileId);
            if (!file) return null;
            
            // Using /file/:id for scanning (FileView handles both files and documents)
            const link = `${window.location.origin}/file/${file.id}`;

            const isConfidential = file.isConfidential === true || String(file.isConfidential) === 'true';
            
            let qrValue = link;
            if (!isConfidential) {
              const cabName = getCabinetName(file.cabinetId);
              const loc = file.isLocker ? `Locker (L${file.level} C${file.column})` : `L${file.level} C${file.column}`;
              const params = new URLSearchParams({
                name: file.fileName || 'Document',
                num: `${file.fileNumber}${file.financialYear ? '/' + file.financialYear : ''}`,
                cab: cabName,
                loc: loc,
                type: file.itemType || 'file'
              });
              qrValue = `${link}?${params.toString()}`;
            }

            const showQR = includeQR;
            const showDetails = isConfidential && confidentialQrOnly ? false : includeDetails;

            return (
              <div key={file.id} className="qr-container flex items-start border border-gray-300 p-2 break-inside-avoid w-fit">
                {/* Left side QR section */}
                {showQR && (
                  <div style={{ width: '2cm', height: '2cm' }} className="flex-shrink-0 flex flex-col justify-center items-center bg-white">
                    <QRCodeSVG value={qrValue} size={65} level="M" includeMargin={false} />
                  </div>
                )}
                
                {/* Right side info text next to QR */}
                {showDetails && (
                  <div className={`${showQR ? 'ml-2' : ''} flex flex-col justify-center text-[8px] leading-tight w-[3.5cm] h-[2cm] overflow-hidden relative`}>
                    <div className="absolute top-0 right-0 text-[5px] text-gray-500">{new Date().toLocaleDateString()}</div>
                    <div className="font-bold truncate pr-6">{file.fileNumber}{file.financialYear ? `/${file.financialYear}` : ''}</div>
                    <div className="truncate text-[7px]">Cab: {getCabinetName(file.cabinetId)}</div>
                    {file.isLocker ? (
                       <div className="truncate text-[7px]">Loc: Locker (L{file.level} C{file.column})</div>
                    ) : (
                       <div className="truncate text-[7px]">Loc: L{file.level} C{file.column}</div>
                    )}
                    {isConfidential && <div className="font-bold text-black mt-0.5">CONFIDENTIAL</div>}
                  </div>
                )}

                {/* Removable identification tab for confidential files when details are hidden */}
                {isConfidential && (
                  <div className="ml-4 pl-4 border-l-2 border-dashed border-gray-400 flex flex-col justify-center text-[9px] w-[5cm] h-[2cm] relative">
                    <div className="absolute top-0 right-0 text-[5px] text-gray-500">{new Date().toLocaleDateString()}</div>
                    <span className="font-bold mb-1 underline">TEAR-OFF IDENTIFICATION</span>
                    <span className="truncate pr-8">Name: {file.fileName}</span>
                    <span>No: {file.fileNumber}{file.financialYear ? `/${file.financialYear}` : ''}</span>
                    {confidentialQrOnly && <span className="text-[7px] mt-1 text-gray-500 italic">* Details hidden for security</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 1cm; }
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block { position: absolute; left: 0; top: 0; width: 100%; }
          .print-grid { display: flex; flex-wrap: wrap; gap: 0.5cm; }
        }
      `}</style>
    </div>
  );
}
