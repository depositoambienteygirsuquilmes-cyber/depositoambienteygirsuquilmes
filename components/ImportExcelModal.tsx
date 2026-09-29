import React, { useState } from 'react';
import Papa from 'papaparse';
import { Tool } from '../types';

interface ImportExcelModalProps {
  onConfirm: (importedTools: Omit<Tool, 'lastUpdated'>[], mode: 'append' | 'replace') => Promise<void>;
  onClose: () => void;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({ onConfirm, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Omit<Tool, 'lastUpdated'>[]>([]);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const processRows = (rows: any[]) => {
    if (!rows || rows.length === 0) {
      setError('El archivo está vacío o no tiene el formato adecuado.');
      return;
    }

    const cleanedTools: Omit<Tool, 'lastUpdated'>[] = [];

    rows.forEach((row, index) => {
      // Normalizar claves de columnas a minúsculas sin acentos ni espacios
      const normalizedRow: Record<string, any> = {};
      Object.keys(row).forEach(key => {
        const cleanKey = key
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();
        normalizedRow[cleanKey] = row[key];
      });

      // Mapeo inteligente de campos
      const name = normalizedRow['nombre'] || normalizedRow['herramienta'] || normalizedRow['item'] || normalizedRow['descripcion'] || normalizedRow['name'] || '';
      if (!name || String(name).trim() === '') return; // Omitir filas sin nombre

      const id = normalizedRow['id'] || normalizedRow['codigo'] || normalizedRow['id herramienta'] || `T${Date.now().toString().slice(-4)}${index}`;
      const category = normalizedRow['categoria'] || normalizedRow['rubro'] || normalizedRow['tipo'] || 'General';
      const location = normalizedRow['ubicacion'] || normalizedRow['deposito'] || normalizedRow['sector'] || 'Depósito Central';
      
      const rawStock = normalizedRow['stock'] || normalizedRow['cantidad'] || normalizedRow['stock actual'] || 0;
      const stock = parseInt(String(rawStock).replace(/[^0-9]/g, ''), 10) || 0;

      cleanedTools.push({
        id: String(id).trim(),
        name: String(name).trim(),
        category: String(category).trim(),
        stock,
        location: String(location).trim()
      });
    });

    if (cleanedTools.length === 0) {
      setError('No se pudieron extraer herramientas válidas del archivo. Asegúrese de incluir una columna "Nombre" o "Herramienta".');
    } else {
      setError('');
      setParsedData(cleanedTools);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      parseFile(selectedFile);
    }
  };

  const parseFile = (fileToParse: File) => {
    setFile(fileToParse);
    setError('');
    setParsedData([]);

    const fileName = fileToParse.name.toLowerCase();

    // Si es CSV / TXT usar PapaParse
    if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
      Papa.parse(fileToParse, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          if (results.meta.fields) {
            setRawHeaders(results.meta.fields);
          }
          processRows(results.data);
        },
        error: (err) => {
          setError(`Error al leer CSV: ${err.message}`);
        }
      });
    } else {
      // Para archivos XLSX / XLS / TSV intentamos lectura textual con delimitadores
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) return;

        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              if (results.meta.fields) {
                setRawHeaders(results.meta.fields);
              }
              processRows(results.data);
            } else {
              setError('No se pudo interpretar el archivo. Si es un .XLSX binario complejo, por favor guárdelo como CSV o Excel básico.');
            }
          }
        });
      };
      reader.readAsText(fileToParse);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseFile(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "\uFEFF" + 
      "ID Herramienta;Nombre;Categoria;Stock Actual;Ubicacion\n" +
      "T1010;Pala Corazón de Chapa;Herramientas de Mano;10;Depósito Central A\n" +
      "T1011;Guantes de Cuero Descarne;EPP;50;Pañol Entrada\n" +
      "T1012;Desmalezadora 52cc 2T;Mantenimiento;4;Armario de Seguridad\n" +
      "T1013;Carretilla Verde 90L;Transporte;6;Sector Compostaje\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Plantilla_Inventario_Ecoparque.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);
    try {
      await onConfirm(parsedData, importMode);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al importar los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-900 via-violet-800 to-indigo-900 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-violet-300 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-400/40 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-extrabold uppercase tracking-tight">Cargar Inventario desde Excel / CSV</h2>
              <p className="text-violet-200 text-xs font-medium">Importa listas masivas de herramientas para el Ecoparque GIRSU</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* File Upload Drop Zone */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer relative ${
              isDragging ? 'border-violet-600 bg-violet-50/50 scale-[0.99]' : 'border-slate-200 hover:border-violet-400 bg-slate-50/50'
            }`}
          >
            <input 
              type="file" 
              accept=".csv, .xlsx, .xls, .txt"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              
              {file ? (
                <div>
                  <p className="font-bold text-slate-800 text-sm">{file.name}</p>
                  <p className="text-xs text-emerald-600 font-bold mt-0.5">Archivo cargado correctamente</p>
                </div>
              ) : (
                <div>
                  <p className="font-bold text-slate-800 text-sm">Arrastra tu archivo Excel / CSV aquí o haz clic para buscar</p>
                  <p className="text-xs text-slate-400 mt-1">Soporta formatos .CSV, .XLSX, .XLS (Columnas: ID, Nombre, Categoría, Stock, Ubicación)</p>
                </div>
              )}
            </div>
          </div>

          {/* Plantilla de Ejemplo */}
          <div className="flex justify-between items-center bg-slate-100/70 p-3.5 rounded-xl border border-slate-200/80 text-xs">
            <span className="text-slate-600 font-medium">¿Necesitas un formato de referencia para armar tu Excel?</span>
            <button 
              type="button"
              onClick={handleDownloadTemplate}
              className="text-violet-700 hover:text-violet-900 font-bold flex items-center gap-1.5 underline decoration-violet-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Descargar Plantilla CSV
            </button>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}

          {/* Vista Previa de Datos Detectados */}
          {parsedData.length > 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h3 className="font-extrabold text-slate-800 text-base uppercase tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                  Vista Previa ({parsedData.length} Ítems detectados)
                </h3>
              </div>

              {/* Selector de Modo de Importación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${importMode === 'append' ? 'bg-violet-50 border-violet-500 text-violet-950 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <input 
                    type="radio" 
                    name="importMode" 
                    checked={importMode === 'append'} 
                    onChange={() => setImportMode('append')} 
                    className="mt-0.5 text-violet-600 focus:ring-violet-500"
                  />
                  <div>
                    <span className="block font-bold text-xs uppercase tracking-wide">Anexar / Actualizar</span>
                    <span className="text-[11px] text-slate-500">Mantiene el inventario actual y suma o actualiza las nuevas herramientas.</span>
                  </div>
                </label>

                <label className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${importMode === 'replace' ? 'bg-rose-50 border-rose-400 text-rose-950 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <input 
                    type="radio" 
                    name="importMode" 
                    checked={importMode === 'replace'} 
                    onChange={() => setImportMode('replace')} 
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="block font-bold text-xs uppercase tracking-wide">Reemplazar Todo</span>
                    <span className="text-[11px] text-slate-500">Borra todo el inventario anterior y deja únicamente este archivo.</span>
                  </div>
                </label>
              </div>

              {/* Tabla de Muestra (primeras 5 filas) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="p-2.5">ID</th>
                      <th className="p-2.5">Nombre</th>
                      <th className="p-2.5">Categoría</th>
                      <th className="p-2.5 text-center">Stock</th>
                      <th className="p-2.5">Ubicación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedData.slice(0, 8).map((tool, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono text-slate-500 font-bold">{tool.id}</td>
                        <td className="p-2.5 font-bold text-slate-800">{tool.name}</td>
                        <td className="p-2.5 text-slate-600">{tool.category}</td>
                        <td className="p-2.5 text-center font-bold text-violet-700">{tool.stock}</td>
                        <td className="p-2.5 text-slate-500">{tool.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 8 && (
                  <p className="text-center text-[10px] text-slate-400 py-1.5 bg-slate-50 font-medium border-t border-slate-100">
                    ... y {parsedData.length - 8} ítems más.
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 text-xs transition-colors"
          >
            Cancelar
          </button>
          
          <button 
            type="button"
            disabled={parsedData.length === 0 || loading}
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-800 disabled:opacity-50 font-bold text-white text-xs transition-all shadow-lg shadow-violet-700/20 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>Importando...</span>
              </>
            ) : (
              <span>Confirmar Carga de {parsedData.length} Ítems</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
