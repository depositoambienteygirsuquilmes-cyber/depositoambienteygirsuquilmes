
import React, { useState } from 'react';
import { Tool, TransactionType } from '../types';

interface TransactionModalProps {
  tool: Tool;
  initialType?: TransactionType;
  onConfirm: (id: string, quantity: number, type: TransactionType, agentId: string) => void;
  onCancel: () => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ tool, initialType, onConfirm, onCancel }) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [type, setType] = useState<TransactionType>(initialType || TransactionType.OUT);
  const [agentId, setAgentId] = useState('');

  const isConsumable = tool.itemType === 'CONSUMABLE';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(tool.id, quantity, type, agentId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up transform transition-all border border-slate-100">
        
        {/* Header */}
        <div className={`p-6 ${type === TransactionType.IN ? 'bg-emerald-50' : 'bg-amber-50'} transition-colors duration-300`}>
          <div className="flex justify-between items-start">
             <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md inline-block ${type === TransactionType.IN ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {type === TransactionType.IN ? 'Devolución' : 'Egreso'}
                  </span>
                  
                  {isConsumable ? (
                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md bg-slate-200 text-slate-700">
                      📦 Insumo Consumible
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md bg-violet-100 text-violet-800">
                      🔄 Herramienta Reutilizable
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{tool.name}</h2>
                <p className="text-slate-500 text-xs mt-1 flex items-center gap-1 font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Ubicación: {tool.location}
                </p>
             </div>
             <button onClick={onCancel} className="bg-white rounded-full p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shadow-sm">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>
          
          <div className="mt-4 flex items-center justify-between bg-white/80 p-3 rounded-2xl border border-slate-200/60">
              <span className="text-slate-600 text-xs font-bold uppercase tracking-wide">Stock Disponible</span>
              <span className="text-2xl font-extrabold text-violet-950">{tool.stock} u.</span>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Notice for Consumables */}
          {isConsumable && type === TransactionType.OUT && (
            <div className="bg-slate-100 border border-slate-200 p-3 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
              <span className="text-amber-500 font-bold text-base">ℹ️</span>
              <div>
                <p className="font-bold text-slate-800">Consumo Final (No requiere devolución)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Este ítem es un insumo o descartable. Al egresar, se dará de baja definitivamente del stock.</p>
              </div>
            </div>
          )}

          {/* Action Type Toggle */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl">
            <button
              type="button"
              onClick={() => setType(TransactionType.OUT)}
              className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${
                type === TransactionType.OUT 
                  ? 'bg-white text-amber-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Egreso / Retiro
            </button>
            <button
              type="button"
              onClick={() => setType(TransactionType.IN)}
              className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${
                type === TransactionType.IN 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Ingreso / Devolución
            </button>
          </div>

          {/* Legajo Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {type === TransactionType.OUT && !isConsumable ? 'Agente / Legajo (Requerido para Préstamo)' : 'Agente / Legajo Operario (Opcional)'}
            </label>
            <input 
                type="text" 
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="Ej. A-1045 (Apellido o Legajo del Agente)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Cantidad a Registrar</label>
            <div className="flex items-center justify-center gap-4">
              <button 
                type="button"
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center text-lg font-bold transition-all active:scale-95"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </button>
              <div className="w-20 text-center">
                 <input 
                    type="number" 
                    min="1" 
                    max={type === TransactionType.OUT ? tool.stock : 999}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full text-center text-3xl font-extrabold text-slate-900 outline-none bg-transparent"
                  />
              </div>
              <button 
                type="button"
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center text-lg font-bold transition-all active:scale-95"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
            {type === TransactionType.OUT && quantity > tool.stock && (
               <p className="text-rose-600 text-xs font-bold text-center mt-2.5 bg-rose-50 py-1 rounded-lg border border-rose-200">Excede el stock disponible</p>
            )}
          </div>

          <button
            type="submit"
            disabled={(type === TransactionType.OUT && quantity > tool.stock)}
            className={`w-full py-3.5 rounded-xl font-extrabold text-white text-sm uppercase tracking-wide shadow-xl transition-all hover:-translate-y-0.5 active:scale-95 ${
              type === TransactionType.IN 
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' 
                : 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
          >
            Confirmar {type === TransactionType.IN ? 'Devolución / Ingreso' : 'Egreso'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
