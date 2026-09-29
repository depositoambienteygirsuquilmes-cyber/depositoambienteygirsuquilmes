import React, { useState } from 'react';

interface ClearInventoryModalProps {
  currentCount: number;
  onConfirmClear: (clearTransactions: boolean) => Promise<void>;
  onResetDefaults: () => Promise<void>;
  onClose: () => void;
}

export const ClearInventoryModal: React.FC<ClearInventoryModalProps> = ({
  currentCount,
  onConfirmClear,
  onResetDefaults,
  onClose
}) => {
  const [clearHistory, setClearHistory] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClear = async () => {
    setLoading(true);
    try {
      await onConfirmClear(clearHistory);
      onClose();
    } catch (e: any) {
      alert("Error al vaciar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await onResetDefaults();
      onClose();
    } catch (e: any) {
      alert("Error al restablecer: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-rose-100 flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-900 to-red-950 p-5 flex justify-between items-center text-white border-b border-rose-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">Vaciar / Reiniciar Lista</h2>
              <p className="text-xs text-rose-200">Gestión de catálogo del Pañol Ecoparque</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="font-bold text-rose-950 uppercase text-xs">Acción de Vaciar Inventario</h4>
              <p className="text-rose-800 text-xs mt-0.5 leading-relaxed">
                Actualmente tienes <strong>{currentCount} artículos</strong> en el sistema. Esta acción eliminará los ítems para que puedas empezar con la lista completamente limpia o cargar un nuevo Excel.
              </p>
            </div>
          </div>

          {/* Opciones */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
              <input 
                type="checkbox" 
                checked={clearHistory} 
                onChange={(e) => setClearHistory(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 border-slate-300"
              />
              <span className="font-bold text-slate-800">
                También borrar el historial de movimientos y préstamos
              </span>
            </label>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            {/* Botón 1: Vaciar Todo a 0 */}
            <button
              onClick={handleClear}
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              <span>{loading ? 'Vaciando...' : 'Vaciar Todo (Dejar lista vacía en 0)'}</span>
            </button>

            {/* Botón 2: Restablecer Valores de Fábrica */}
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl border border-slate-300 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-violet-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              <span>Cargar Catálogo Modelo del Ecoparque (Ejemplos)</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
};
