import React, { useState } from 'react';
import { Tool, Transaction } from '../types';

interface PrintReportModalProps {
  tools: Tool[];
  transactions: Transaction[];
  onClose: () => void;
  userName: string;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({ tools, transactions, onClose, userName }) => {
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'available'>('all');

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Clasificación de ítems
  const criticalTools = tools.filter(t => t.stock < (t.minStock || 5));
  const availableTools = tools.filter(t => t.stock >= (t.minStock || 5));
  
  const totalItemsCount = tools.length;
  const totalUnitsCount = tools.reduce((acc, t) => acc + t.stock, 0);
  const totalCriticalCount = criticalTools.length;
  const totalAvailableCount = availableTools.length;

  const displayTools = filterType === 'critical' 
    ? criticalTools 
    : filterType === 'available' 
      ? availableTools 
      : tools;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      
      {/* Estilos CSS específicos para Impresión (Imprimir solo el contenido del informe) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Controls (No se imprimen) */}
        <div className="bg-slate-900 p-4 text-white flex justify-between items-center no-print">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center font-bold">
              🖨️
            </div>
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-tight">Planilla Oficial para Impresión / PDF</h2>
              <p className="text-[11px] text-slate-400">Generador de Informes de Existencias y Reposición GIRSU</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              <span>Imprimir / Descargar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Filter Toolbar (No se imprime) */}
        <div className="bg-slate-100 p-3 border-b border-slate-200 flex flex-wrap gap-2 items-center justify-between text-xs no-print">
          <div className="flex gap-2">
            <span className="font-bold text-slate-700 self-center mr-1">Filtrar para la planilla:</span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${filterType === 'all' ? 'bg-violet-800 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              Todos ({totalItemsCount})
            </button>
            <button
              onClick={() => setFilterType('critical')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${filterType === 'critical' ? 'bg-rose-600 text-white shadow-sm' : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'}`}
            >
              Faltantes / Críticos ({totalCriticalCount})
            </button>
            <button
              onClick={() => setFilterType('available')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${filterType === 'available' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'}`}
            >
              Stock Ok ({totalAvailableCount})
            </button>
          </div>
          <span className="text-[11px] text-slate-500 italic">Sugerencia: Haz clic en "Imprimir" y elige "Guardar como PDF".</span>
        </div>

        {/* PRINTABLE AREA */}
        <div id="printable-report" className="p-8 space-y-6 overflow-y-auto flex-1 bg-white text-slate-900 font-sans">
          
          {/* Header Membrete Oficial */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-violet-900 text-white rounded font-bold flex items-center justify-center text-xs">
                  EQ
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight uppercase leading-none">ECOPARQUE QUILMES - GIRSU</h1>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-0.5">Dirección General de Pañol e Inventario</p>
                </div>
              </div>
            </div>
            
            <div className="text-right text-xs">
              <p className="font-extrabold uppercase text-slate-800">REPORTE OFICIAL DE STOCK</p>
              <p className="text-slate-500 font-medium mt-0.5">Fecha de Emisión: <strong>{dateFormatted}</strong></p>
              <p className="text-slate-500 font-medium">Emisor: <strong>{userName}</strong></p>
            </div>
          </div>

          {/* Cards de Resumen Estadístico */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-slate-50 border border-slate-300 p-3 rounded-xl">
              <span className="block text-[10px] font-bold uppercase text-slate-500">Ítems Registrados</span>
              <span className="text-xl font-extrabold text-slate-900">{totalItemsCount}</span>
            </div>
            <div className="bg-slate-50 border border-slate-300 p-3 rounded-xl">
              <span className="block text-[10px] font-bold uppercase text-slate-500">Unidades Totales</span>
              <span className="text-xl font-extrabold text-violet-900">{totalUnitsCount}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl">
              <span className="block text-[10px] font-bold uppercase text-emerald-800">Con Stock Disponible</span>
              <span className="text-xl font-extrabold text-emerald-950">{totalAvailableCount}</span>
            </div>
            <div className="bg-rose-50 border border-rose-300 p-3 rounded-xl">
              <span className="block text-[10px] font-bold uppercase text-rose-800">Faltantes / Stock Crítico</span>
              <span className="text-xl font-extrabold text-rose-950">{totalCriticalCount}</span>
            </div>
          </div>

          {/* Tabla de Artículos Faltantes o Críticos */}
          {criticalTools.length > 0 && filterType !== 'available' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-rose-200 pb-1">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-rose-600 rounded-full"></span>
                  Artículos Faltantes / Requieren Reposición ({criticalTools.length})
                </h3>
              </div>

              <table className="w-full text-left text-xs border border-rose-200 rounded-lg overflow-hidden">
                <thead className="bg-rose-100 text-rose-900 font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-2 border-b border-rose-200">ID</th>
                    <th className="p-2 border-b border-rose-200">Herramienta / Insumo</th>
                    <th className="p-2 border-b border-rose-200">Categoría</th>
                    <th className="p-2 border-b border-rose-200">Ubicación</th>
                    <th className="p-2 text-center border-b border-rose-200">Stock Actual</th>
                    <th className="p-2 text-center border-b border-rose-200">Stock Mín.</th>
                    <th className="p-2 text-center border-b border-rose-200">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100 bg-white">
                  {criticalTools.map((t) => (
                    <tr key={t.id} className="hover:bg-rose-50/50">
                      <td className="p-2 font-mono font-bold text-slate-600">{t.id}</td>
                      <td className="p-2 font-bold text-slate-900">
                        {t.name}
                        {t.itemType === 'CONSUMABLE' && <span className="ml-1 text-[9px] text-amber-700 font-semibold">(Consumible)</span>}
                      </td>
                      <td className="p-2 text-slate-600">{t.category}</td>
                      <td className="p-2 text-slate-600">{t.location}</td>
                      <td className="p-2 text-center font-extrabold text-rose-700 bg-rose-50">{t.stock} u.</td>
                      <td className="p-2 text-center font-bold text-slate-500">{t.minStock || 5} u.</td>
                      <td className="p-2 text-center font-extrabold text-rose-900">
                        -{Math.max(1, (t.minStock || 5) - t.stock)} u.
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tabla de Artículos Generales / En Stock */}
          {filterType !== 'critical' && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></span>
                  {filterType === 'available' ? 'Artículos con Stock Disponible' : 'Listado Completo de Existencias'} ({displayTools.length})
                </h3>
              </div>

              <table className="w-full text-left text-xs border border-slate-300 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-800 font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-2 border-b border-slate-300">ID</th>
                    <th className="p-2 border-b border-slate-300">Artículo / Herramienta</th>
                    <th className="p-2 border-b border-slate-300">Tipo</th>
                    <th className="p-2 border-b border-slate-300">Categoría</th>
                    <th className="p-2 border-b border-slate-300">Ubicación</th>
                    <th className="p-2 text-center border-b border-slate-300">Stock Actual</th>
                    <th className="p-2 text-center border-b border-slate-300">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {displayTools.map((t) => {
                    const isLow = t.stock < (t.minStock || 5);
                    return (
                      <tr key={t.id} className={isLow ? 'bg-rose-50/30' : ''}>
                        <td className="p-2 font-mono font-bold text-slate-500">{t.id}</td>
                        <td className="p-2 font-bold text-slate-900">{t.name}</td>
                        <td className="p-2 text-slate-600">
                          {t.itemType === 'CONSUMABLE' ? 'Insumo' : 'Herramienta'}
                        </td>
                        <td className="p-2 text-slate-600">{t.category}</td>
                        <td className="p-2 text-slate-600">{t.location}</td>
                        <td className={`p-2 text-center font-extrabold ${isLow ? 'text-rose-700' : 'text-slate-900'}`}>
                          {t.stock} u.
                        </td>
                        <td className="p-2 text-center font-bold">
                          {isLow ? (
                            <span className="text-[10px] text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">FALTANTE</span>
                          ) : (
                            <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">DISPONIBLE</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pie de Planilla y Firmas */}
          <div className="pt-10 border-t border-slate-300 grid grid-cols-2 gap-12 text-center text-xs text-slate-600">
            <div>
              <div className="border-b border-slate-400 w-3/4 mx-auto mb-1"></div>
              <p className="font-bold text-slate-800">Firma Pañolero / Encargado</p>
              <p className="text-[10px] text-slate-400">Ecoparque Quilmes - GIRSU</p>
            </div>
            <div>
              <div className="border-b border-slate-400 w-3/4 mx-auto mb-1"></div>
              <p className="font-bold text-slate-800">Supervisión / Dirección</p>
              <p className="text-[10px] text-slate-400">Control de Gestión e Inventario</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
