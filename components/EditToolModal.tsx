import React, { useState } from 'react';
import { Tool, ItemType, ToolCondition } from '../types';

interface EditToolModalProps {
  tool: Tool;
  onConfirm: (updatedTool: Tool) => void;
  onDelete?: (toolId: string) => void;
  onCancel: () => void;
}

export const EditToolModal: React.FC<EditToolModalProps> = ({ 
  tool, 
  onConfirm, 
  onDelete, 
  onCancel 
}) => {
  const [name, setName] = useState(tool.name || '');
  const [category, setCategory] = useState(tool.category || 'Herramientas de Mano');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [stock, setStock] = useState(tool.stock ?? 0);
  const [minStock, setMinStock] = useState(tool.minStock ?? 3);
  const [location, setLocation] = useState(tool.location || 'Depósito Central');
  const [itemType, setItemType] = useState<ItemType>(tool.itemType || 'RETURNABLE');
  const [condition, setCondition] = useState<ToolCondition>(tool.condition || 'BUENO');
  const [description, setDescription] = useState(tool.description || '');

  const standardCategories = [
    "Herramientas de Mano",
    "Jardinería y Poda",
    "Maquinaria",
    "EPP / Seguridad",
    "Insumos / Limpieza",
    "Transporte"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Por favor ingrese el nombre del artículo.");
      return;
    }

    const finalCategory = isCustomCategory && customCategory.trim() 
      ? customCategory.trim() 
      : (category || "General");

    const updated: Tool = {
      ...tool,
      name: name.trim(),
      category: finalCategory,
      stock: Math.max(0, Number(stock) || 0),
      minStock: Math.max(0, Number(minStock) || 0),
      location: location.trim() || "Depósito Central",
      itemType,
      condition,
      description: description.trim(),
      lastUpdated: new Date().toISOString()
    };

    onConfirm(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-950 p-5 flex justify-between items-center text-white border-b border-violet-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/40 border border-violet-400/40 flex items-center justify-center text-violet-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black uppercase tracking-tight">Editar Artículo</h2>
                <span className="bg-violet-700/60 font-mono text-[10px] px-2 py-0.5 rounded text-violet-200 border border-violet-500/30">
                  {tool.id}
                </span>
              </div>
              <p className="text-xs text-violet-200">Modifica cualquier campo del inventario de forma inmediata</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onCancel} 
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          
          {/* Tipo de Ítem */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tipo de Recurso</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setItemType('RETURNABLE')}
                className={`p-3 rounded-xl border font-bold transition-all text-left flex flex-col gap-0.5 ${
                  itemType === 'RETURNABLE' 
                    ? 'bg-violet-50 border-violet-600 text-violet-950 shadow-sm ring-1 ring-violet-500/30' 
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-1.5 text-emerald-700 text-xs">🔄 Reutilizable (Devolución)</span>
                <span className="text-[10px] font-normal text-slate-500">Herramientas que se prestan y deben volver.</span>
              </button>

              <button
                type="button"
                onClick={() => setItemType('CONSUMABLE')}
                className={`p-3 rounded-xl border font-bold transition-all text-left flex flex-col gap-0.5 ${
                  itemType === 'CONSUMABLE' 
                    ? 'bg-amber-50 border-amber-500 text-amber-950 shadow-sm ring-1 ring-amber-500/30' 
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-1.5 text-amber-700 text-xs">📦 Insumo / Descartable</span>
                <span className="text-[10px] font-normal text-slate-500">Materiales gastables (bolsas, precintos, EPP).</span>
              </button>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Nombre del Artículo / Herramienta</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:bg-white text-xs font-semibold text-slate-800"
              placeholder="Ej. Pala Ancha de Chapa Reforzada"
            />
          </div>

          {/* Categoría & Ubicación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700 uppercase tracking-wider">Categoría</label>
                <button 
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-[10px] text-violet-600 hover:underline font-bold"
                >
                  {isCustomCategory ? 'Elegir de lista' : '+ Otra categoría'}
                </button>
              </div>
              {isCustomCategory ? (
                <input 
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Escribir categoría nueva..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:bg-white text-xs font-medium"
                />
              ) : (
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:bg-white text-xs font-medium"
                >
                  {standardCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  {!standardCategories.includes(tool.category) && tool.category && (
                    <option value={tool.category}>{tool.category}</option>
                  )}
                </select>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Ubicación Física</label>
              <input 
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej. Pañol Entrada / Depósito B"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:bg-white text-xs font-medium"
              />
            </div>
          </div>

          {/* Stock Actual y Stock Mínimo */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Stock Actual en Pañol
              </label>
              <input 
                type="number" 
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 text-sm font-extrabold text-slate-900"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Ajusta directamente la cantidad física.</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Stock Mínimo (Alerta)
              </label>
              <input 
                type="number" 
                min="0"
                required
                value={minStock}
                onChange={(e) => setMinStock(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 text-sm font-extrabold text-slate-900"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Avisa en rojo si baja de este número.</span>
            </div>
          </div>

          {/* Condición / Estado físico */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Estado / Condición Física</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCondition('BUENO')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  condition === 'BUENO'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-400'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>🟢</span>
                <span>Bueno / Óptimo</span>
              </button>

              <button
                type="button"
                onClick={() => setCondition('REGULAR')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  condition === 'REGULAR'
                    ? 'bg-amber-50 border-amber-500 text-amber-800 ring-1 ring-amber-400'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>🟡</span>
                <span>Regular / Usado</span>
              </button>

              <button
                type="button"
                onClick={() => setCondition('REPARACION')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  condition === 'REPARACION'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 ring-1 ring-rose-400'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>🔴</span>
                <span>Reparación</span>
              </button>
            </div>
          </div>

          {/* Observaciones / Descripción */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Descripción u Observaciones</label>
            <textarea 
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre modelo, marca, mantenimiento o accesorios incluidos..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:bg-white text-xs font-medium"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
            {onDelete ? (
              <button 
                type="button"
                onClick={() => {
                  if (confirm(`¿Eliminar definitivamente "${tool.name}"?`)) {
                    onDelete(tool.id);
                  }
                }}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                <span>Eliminar</span>
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="bg-violet-700 hover:bg-violet-600 text-white font-extrabold px-5 py-2 rounded-xl shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
