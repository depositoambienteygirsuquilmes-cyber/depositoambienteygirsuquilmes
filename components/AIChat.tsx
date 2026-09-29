import React, { useState } from 'react';
import { getInventoryAnalysis } from '../services/geminiService';
import { Tool, Transaction } from '../types';

interface AIChatProps {
  tools: Tool[];
  transactions: Transaction[];
}

const AIChat: React.FC<AIChatProps> = ({ tools, transactions }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse(null);
    const result = await getInventoryAnalysis(tools, transactions, query);
    setResponse(result);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-violet-600 to-violet-800 p-6 text-white">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Asistente Inteligente Pañol
        </h2>
        <p className="text-violet-200 text-sm mt-1">Consulta sobre stock, ubicaciones o resúmenes.</p>
      </div>
      
      <div className="p-6">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all"
            placeholder="Ej: ¿Qué herramientas tienen stock bajo?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-2 p-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            )}
          </button>
        </form>

        {response && (
          <div className="mt-6 p-4 bg-violet-50 rounded-xl border border-violet-100 text-gray-800 animate-fade-in leading-relaxed">
            <h3 className="text-violet-800 font-bold mb-2 text-sm uppercase tracking-wide">Respuesta de Gemini</h3>
            <p className="whitespace-pre-wrap">{response}</p>
          </div>
        )}

        {!response && !loading && (
           <div className="mt-6">
             <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Sugerencias</h4>
             <div className="flex flex-wrap gap-2">
               {["Stock de palas", "Herramientas en Estantería A1", "¿Qué necesito reponer?", "Resumen de movimientos hoy"].map(suggestion => (
                 <button 
                   key={suggestion}
                   onClick={() => setQuery(suggestion)}
                   className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-gray-200 transition-colors"
                 >
                   {suggestion}
                 </button>
               ))}
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default AIChat;