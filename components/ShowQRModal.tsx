import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Tool } from '../types';

interface ShowQRModalProps {
  tool: Tool;
  onClose: () => void;
}

const ShowQRModal: React.FC<ShowQRModalProps> = ({ tool, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      // Generate QR Code with the Tool ID
      QRCode.toCanvas(canvasRef.current, tool.id, { 
        width: 200,
        margin: 2,
        color: {
          dark: '#4c1d95', // Violet-900
          light: '#ffffff'
        }
      }, (error) => {
        if (error) console.error(error);
      });
    }
  }, [tool.id]);

  const downloadQR = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = `QR_${tool.name}_${tool.id}.png`;
      link.href = url;
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-80 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-gray-100 p-4 flex justify-between items-center border-b border-gray-200">
          <h3 className="font-bold text-gray-700">Código QR de Herramienta</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 font-bold text-xl">×</button>
        </div>

        {/* QR Display Area - Designed like a sticker */}
        <div className="p-8 flex flex-col items-center justify-center bg-white" id="qr-sticker">
          <div className="border-4 border-violet-900 rounded-lg p-4 bg-white shadow-lg text-center w-full">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ecoparque Quilmes</p>
            
            <div className="flex justify-center mb-2">
               <canvas ref={canvasRef} className="rounded-md"></canvas>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 leading-tight">{tool.name}</h2>
            <p className="text-violet-700 font-mono font-bold mt-1 text-lg">{tool.id}</p>
            <p className="text-xs text-gray-500 mt-2">{tool.category} • {tool.location}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3">
          <button
            onClick={downloadQR}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Descargar
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShowQRModal;