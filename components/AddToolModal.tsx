import React, { useState } from 'react';
import { ItemType } from '../types';

interface AddToolModalProps {
  onConfirm: (data: { name: string; category: string; stock: number; location: string; itemType?: ItemType; minStock?: number }) => void;
  onCancel: () => void;
}

const AddToolModal: React.FC<AddToolModalProps> = ({ onConfirm, onCancel }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState(1);
  const [location, setLocation] = useState('');
  const [itemType, setItemType] = useState<ItemType>('RETURNABLE');
  const [minStock, setMinStock] = useState(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && category && location) {
      onConfirm({ name, category, stock, location, itemType, minStock });
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900 bg-opacity-70 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up border border-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-900 to-indigo-900 p-6 flex justify-between items-center text-white">
          <div>
            <h2 className="text-xl font-extrabold uppercase tracking-tight">Alta de Herramienta / Insumo</h2>
            <p className="text-xs text-violet-200">Ingreso de nuevos bienes al Pañol Ecoparque</p>
          </div>
          <button onClick={onCancel} className="text-violet-200 hover:text-white font-bold text-xl">×</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Tipo de Elemento */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Tipo de Recurso</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setItemType('RETURNABLE')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-1 ${
                  itemType === 'RETURNABLE' 
                    ? 'bg-violet-50 border-violet-600 text-violet-950 shadow-sm' 
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span className="flex items-center gap-1.5 text-emerald-700">🔄 Reutilizable</span>
                <span className="text-[10px] font-normal text-slate-500">Herramientas que se prestan y devuelven.</span>
              </button>

              <button
                type="button"
                onClick={() => setItemType('CONSUMABLE')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-1 ${
                  itemType === 'CONSUMABLE' 
                    ? 'bg-amber-50 border-amber-500 text-amber-950 shadow-sm' 
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span className="flex items-center gap-1.5 text-amber-700">📦 Consumible</span>
                <span className="text-[10px] font-normal text-slate-500">Insumos descartables de consumo final.</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nombre del Ítem</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none text-xs font-medium"
              placeholder="Ej. Pala Corazón de Chapa / Guantes Nitrilo"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Categoría</label>
              <select 
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none text-xs font-medium"
              >
                <option value="">Seleccionar...</option>
                <option value="Herramientas de Mano">Herramientas de Mano</option>
                <option value="Jardinería y Poda">Jardinería y Poda</option>
                <option value="Maquinaria">Maquinaria</option>
                <option value="EPP / Seguridad">EPP / Seguridad</option>
                <option value="Insumos / Limpieza">Insumos / Limpieza</option>
                <option value="Transporte">Transporte</option>
              </select>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Stock Inicial</label>
               <input 
                type="number" 
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none text-xs font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Ubicación Pañol</label>
              <input 
                type="text" 
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none text-xs font-medium"
                placeholder="Ej. Estantería B4"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Stock Mínimo</label>
              <input 
                type="number" 
                min="1"
                value={minStock}
                onChange={(e) => setMinStock(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none text-xs font-medium"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-white bg-violet-700 hover:bg-violet-800 shadow-lg shadow-violet-700/20 text-xs transition-all"
            >
              Confirmar Alta en Sistema
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddToolModal;