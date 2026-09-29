
import React, { useEffect, useState, useCallback } from 'react';
import { Tool, Transaction, TransactionType, User } from './types';
import { 
  fetchInventory, 
  updateStock, 
  fetchTransactions, 
  createTool, 
  deleteTool, 
  saveImportedTools, 
  updateTool, 
  clearAllInventory, 
  resetToDefaultData 
} from './services/inventoryService';
import { getCurrentUser, logout } from './services/authService';
import Scanner from './components/Scanner';
import TransactionModal from './components/TransactionModal';
import AddToolModal from './components/AddToolModal';
import ShowQRModal from './components/ShowQRModal';
import DashboardCharts from './components/DashboardCharts';
import Login from './components/Login';
import { ImportExcelModal } from './components/ImportExcelModal';
import { CloudflareSyncModal } from './components/CloudflareSyncModal';
import { PrintReportModal } from './components/PrintReportModal';
import { EditToolModal } from './components/EditToolModal';
import { ClearInventoryModal } from './components/ClearInventoryModal';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [filterMode, setFilterMode] = useState<'all' | 'low' | 'returnable' | 'consumable' | 'loans'>('all'); 
  const [searchQuery, setSearchQuery] = useState('');
  
  const [tools, setTools] = useState<Tool[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<TransactionType | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [qrTool, setQrTool] = useState<Tool | null>(null);

  useEffect(() => {
    // Check for session
    const currentUser = getCurrentUser();
    if (currentUser) {
        setUser(currentUser);
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [invData, txData] = await Promise.all([fetchInventory(), fetchTransactions()]);
      setTools(invData);
      setTransactions(txData);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleLogout = () => {
      logout();
      setUser(null);
  };

  const startScanning = (mode: TransactionType) => {
    setScanMode(mode);
    setIsScanning(true);
  };

  const handleScanSuccess = (decodedText: string) => {
    setIsScanning(false);
    const tool = tools.find(t => t.id === decodedText || t.name.toLowerCase() === decodedText.toLowerCase());
    
    if (tool) {
      setSelectedTool(tool);
    } else {
      if(user?.role === 'ADMIN' && confirm(`Herramienta no encontrada (${decodedText}). ¿Desea registrarla?`)) {
        setShowAddModal(true);
      } else if (user?.role !== 'ADMIN') {
        alert("Herramienta no encontrada. Contacte al administrador.");
      }
    }
  };

  const handleTransaction = async (id: string, quantity: number, type: TransactionType, agentId: string) => {
    setLoading(true);
    try {
      const updatedTools = await updateStock(id, quantity, type, agentId, user?.username || 'unknown');
      setTools(updatedTools);
      const updatedTxs = await fetchTransactions();
      setTransactions(updatedTxs);
      setSelectedTool(null);
      setScanMode(null);
    } catch (e) {
      alert("Error al actualizar inventario");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTool = async (data: { name: string; category: string; stock: number; location: string }) => {
    setLoading(true);
    setShowAddModal(false);
    try {
      const updatedTools = await createTool(data);
      setTools(updatedTools);
      const newTool = updatedTools[updatedTools.length - 1];
      if (newTool) {
        setQrTool(newTool);
      }
    } catch (e) {
      alert("Error al crear herramienta");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTool = async (id: string) => {
      if (confirm("¿Está seguro de que desea ELIMINAR esta herramienta del sistema? Esta acción no se puede deshacer.")) {
        setLoading(true);
        try {
            const updatedTools = await deleteTool(id);
            setTools(updatedTools);
        } catch(e) {
            alert("Error al eliminar");
        } finally {
            setLoading(false);
        }
      }
  };

  const handleUpdateTool = async (updated: Tool) => {
    setLoading(true);
    setEditingTool(null);
    try {
      const updatedTools = await updateTool(updated);
      setTools(updatedTools);
    } catch (e) {
      alert("Error al actualizar herramienta");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmClear = async (clearTransactions: boolean) => {
    setLoading(true);
    try {
      const res = await clearAllInventory(clearTransactions);
      setTools(res.tools);
      if (clearTransactions && res.transactions) {
        setTransactions(res.transactions);
      }
    } catch (e) {
      alert("Error al vaciar la lista");
    } finally {
      setLoading(false);
    }
  };

  const handleResetDefaults = async () => {
    setLoading(true);
    try {
      const res = await resetToDefaultData();
      setTools(res.tools);
      setTransactions(res.transactions);
    } catch (e) {
      alert("Error al restablecer catálogo de prueba");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async (importedTools: Omit<Tool, 'lastUpdated'>[], mode: 'append' | 'replace') => {
    setLoading(true);
    setShowImportModal(false);
    try {
      const updatedTools = await saveImportedTools(importedTools, mode);
      setTools(updatedTools);
    } catch (e) {
      alert("Error al importar el archivo Excel");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportTransactions = () => {
    const headers = ["ID Transaccion", "Fecha", "Hora", "Herramienta", "Tipo Movimiento", "Cantidad", "Legajo Agente", "Usuario Sistema", "ID Herramienta"];
    const rows = transactions.map(tx => {
      try {
        const dateObj = new Date(tx.date);
        const date = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString('es-AR');
        const time = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleTimeString('es-AR');
        const nameClean = tx.toolName || "Desconocido";
        const safeName = `"${nameClean.replace(/"/g, '""')}"`; 
        return [tx.id, date, time, safeName, tx.type, tx.quantity, tx.agentId || '-', tx.user || '-', tx.toolId].join(";");
      } catch (err) {
        return "";
      }
    }).filter(r => r);
    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
    const today = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `Reporte_Movimientos_${today}.csv`);
  };

  const handleExportInventory = () => {
    const headers = ["ID Herramienta", "Nombre", "Categoria", "Stock Actual", "Ubicacion", "Ultima Actualizacion"];
    const rows = tools.map(tool => {
      const safeName = `"${tool.name.replace(/"/g, '""')}"`;
      const safeCat = `"${tool.category.replace(/"/g, '""')}"`;
      const safeLoc = `"${tool.location.replace(/"/g, '""')}"`;
      const date = tool.lastUpdated ? new Date(tool.lastUpdated).toLocaleDateString('es-AR') : '';
      return [tool.id, safeName, safeCat, tool.stock, safeLoc, date].join(";");
    });
    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
    const today = new Date().toISOString().split('T')[0];
    downloadCSV(csvContent, `Inventario_Stock_${today}.csv`);
  };

  if (!user) {
      return <Login onLogin={setUser} />;
  }

  const totalStock = tools.reduce((acc, t) => acc + t.stock, 0);
  const lowStockCount = tools.filter(t => t.stock < (t.minStock || 5)).length;
  const totalCategories = new Set(tools.map(t => t.category)).size;

  // Compute active loans (Préstamos pendientes) by Agent Legajo
  const activeLoansMap = new Map<string, { agentId: string; toolId: string; toolName: string; quantity: number; lastDate: string }>();
  transactions.forEach(tx => {
    if (tx.agentId && tx.agentId.trim() !== '') {
      const key = `${tx.agentId.trim().toUpperCase()}_${tx.toolId}`;
      const existing = activeLoansMap.get(key) || {
        agentId: tx.agentId.trim().toUpperCase(),
        toolId: tx.toolId,
        toolName: tx.toolName,
        quantity: 0,
        lastDate: tx.date
      };
      if (tx.type === TransactionType.OUT) {
        existing.quantity += tx.quantity;
      } else if (tx.type === TransactionType.IN) {
        existing.quantity = Math.max(0, existing.quantity - tx.quantity);
      }
      existing.lastDate = tx.date;
      if (existing.quantity > 0) {
        activeLoansMap.set(key, existing);
      } else {
        activeLoansMap.delete(key);
      }
    }
  });
  const activeLoans = Array.from(activeLoansMap.values());

  const filteredTools = tools
    .filter(tool => {
      if (filterMode === 'low') return tool.stock < (tool.minStock || 5);
      if (filterMode === 'returnable') return tool.itemType !== 'CONSUMABLE';
      if (filterMode === 'consumable') return tool.itemType === 'CONSUMABLE';
      return true;
    })
    .filter(tool => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return tool.name.toLowerCase().includes(q) ||
             tool.id.toLowerCase().includes(q) ||
             tool.category.toLowerCase().includes(q) ||
             tool.location.toLowerCase().includes(q);
    });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-24 md:pb-0">
      
      {/* Navbar */}
      <header className="bg-violet-900/95 backdrop-blur-md text-white sticky top-0 z-30 border-b border-violet-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-950/20">
               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight leading-none uppercase font-sans">ECOPARQUE QUILMES</h1>
              <p className="text-violet-300 text-[10px] tracking-widest font-bold uppercase mt-0.5">
                  GIRSU • {user.role === 'ADMIN' ? 'Administrador' : 'Operario'}: {user.name}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2.5 items-center">
            {/* Admin Header Actions */}
            {user.role === 'ADMIN' && (
                <div className="hidden md:flex gap-2">
                    <button 
                      onClick={() => setShowPrintModal(true)}
                      className="bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-1.5 rounded-full font-bold text-xs shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-1.5 border border-amber-400/30"
                      title="Generar Planilla Oficial para Impresión / PDF"
                    >
                      <svg className="w-4 h-4 text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      <span>Imprimir Planilla</span>
                    </button>

                    <button 
                      onClick={() => setShowCloudModal(true)}
                      className="bg-sky-700 hover:bg-sky-600 text-white px-3.5 py-1.5 rounded-full font-bold text-xs shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-1.5 border border-sky-400/30"
                      title="Despliegue Cloudflare, GitHub y Copias de Seguridad"
                    >
                      <svg className="w-4 h-4 text-sky-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                      <span>Nube & GitHub</span>
                    </button>

                    <button 
                      onClick={() => setShowImportModal(true)}
                      className="bg-violet-700 hover:bg-violet-600 text-white px-3.5 py-1.5 rounded-full font-bold text-xs shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-1.5 border border-violet-500/30"
                      title="Cargar archivo Excel o CSV"
                    >
                      <svg className="w-4 h-4 text-violet-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      <span>Cargar Excel</span>
                    </button>

                    <button 
                      onClick={() => startScanning(TransactionType.OUT)}
                      className="bg-amber-500 hover:bg-amber-400 text-white px-4 py-1.5 rounded-full font-bold text-xs shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-1.5"
                    >
                      <span>Retirar</span>
                    </button>

                    <button 
                      onClick={() => startScanning(TransactionType.IN)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-1.5 rounded-full font-bold text-xs shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-1.5"
                    >
                      <span>Devolver</span>
                    </button>
                    
                    <button 
                      onClick={() => setShowAddModal(true)}
                      className="bg-white text-violet-800 hover:bg-violet-50 px-4 py-1.5 rounded-full font-bold text-xs shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-1"
                    >
                      <span>+ Nueva</span>
                    </button>

                    <button 
                      onClick={() => setShowClearModal(true)}
                      className="bg-rose-800/80 hover:bg-rose-700 text-rose-100 hover:text-white px-3.5 py-1.5 rounded-full font-bold text-xs shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-1 border border-rose-500/40"
                      title="Vaciar inventario completo o reiniciar desde cero"
                    >
                      <svg className="w-3.5 h-3.5 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      <span>Vaciar</span>
                    </button>
                </div>
            )}
            
            <button 
                onClick={refreshData}
                className="p-2 text-violet-300 hover:text-white transition-colors"
                title="Actualizar Datos"
            >
                <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>

            <button 
                onClick={handleLogout}
                className="p-2 text-violet-300 hover:text-white transition-colors"
                title="Cerrar Sesión"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* VISTA OPERARIO: SOLO BOTONES */}
        {user.role === 'OPERATOR' && (
             <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Panel de Operaciones</h2>
                    <p className="text-slate-500">Seleccione una acción para comenzar</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
                    <button 
                        onClick={() => startScanning(TransactionType.OUT)}
                        className="group bg-white p-8 rounded-3xl shadow-xl shadow-amber-100 border-2 border-transparent hover:border-amber-500 transition-all duration-300 hover:-translate-y-2 flex flex-col items-center justify-center gap-4"
                    >
                        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                            <svg className="w-10 h-10 text-amber-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </div>
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-slate-800 group-hover:text-amber-600">Retirar</span>
                            <span className="text-sm text-slate-400">Escanear para salida</span>
                        </div>
                    </button>

                    <button 
                        onClick={() => startScanning(TransactionType.IN)}
                        className="group bg-white p-8 rounded-3xl shadow-xl shadow-emerald-100 border-2 border-transparent hover:border-emerald-500 transition-all duration-300 hover:-translate-y-2 flex flex-col items-center justify-center gap-4"
                    >
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                            <svg className="w-10 h-10 text-emerald-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                        </div>
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-slate-800 group-hover:text-emerald-600">Devolver</span>
                            <span className="text-sm text-slate-400">Escanear para ingreso</span>
                        </div>
                    </button>
                </div>
             </div>
        )}

        {/* VISTA ADMIN: DASHBOARD COMPLETO */}
        {user.role === 'ADMIN' && (
           <div className="space-y-8 animate-fade-in-up">
             
             {/* Mobile Actions for Admin */}
             <div className="grid grid-cols-3 gap-3 md:hidden">
                <button onClick={() => startScanning(TransactionType.OUT)} className="bg-amber-500 text-white p-4 rounded-2xl shadow-lg shadow-amber-500/20 flex flex-col items-center active:scale-95 transition-all">
                   <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   <span className="text-xs font-bold">Retirar</span>
                </button>
                <button onClick={() => startScanning(TransactionType.IN)} className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg shadow-emerald-500/20 flex flex-col items-center active:scale-95 transition-all">
                   <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   <span className="text-xs font-bold">Devolver</span>
                </button>
                <button onClick={() => setShowAddModal(true)} className="bg-violet-600 text-white p-4 rounded-2xl shadow-lg shadow-violet-600/20 flex flex-col items-center active:scale-95 transition-all">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                <span className="text-xs font-bold">Crear</span>
                </button>
             </div>

             {/* Mobile Secondary Actions */}
             <div className="flex gap-2 md:hidden overflow-x-auto pb-1">
                <button 
                  onClick={() => setShowPrintModal(true)}
                  className="bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap active:scale-95"
                >
                  <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  <span>Imprimir Planilla</span>
                </button>
                <button 
                  onClick={() => setShowCloudModal(true)}
                  className="bg-sky-50 text-sky-800 border border-sky-300 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap active:scale-95"
                >
                  <svg className="w-3.5 h-3.5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                  <span>Nube &amp; GitHub</span>
                </button>
                <button 
                  onClick={() => setShowImportModal(true)}
                  className="bg-violet-50 text-violet-800 border border-violet-300 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap active:scale-95"
                >
                  <svg className="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  <span>Cargar Excel</span>
                </button>
                <button 
                  onClick={() => setShowClearModal(true)}
                  className="bg-rose-50 text-rose-800 border border-rose-300 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap active:scale-95"
                >
                  <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  <span>Vaciar</span>
                </button>
             </div>

             {loading && tools.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20">
                 <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
                 <p className="mt-4 text-violet-600 font-medium">Cargando inventario...</p>
               </div>
             ) : (
               <>
                 {/* KPI Cards & Chart */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Stock Total */}
                        <div 
                          onClick={() => setFilterMode('all')}
                          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 cursor-pointer group hover:shadow-lg hover:border-violet-200 transition-all relative overflow-hidden"
                        >
                            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <svg className="w-24 h-24 text-violet-600 transform rotate-12" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" /></svg>
                            </div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Unidades</p>
                            <div className="flex items-baseline gap-2 mt-2">
                              <p className="text-4xl font-extrabold text-slate-800">{totalStock}</p>
                            </div>
                            <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-lg">
                               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                               Inventario Activo
                            </div>
                        </div>

                        {/* Stock Crítico */}
                        <div 
                          onClick={() => setFilterMode(lowStockCount > 0 ? 'low' : 'all')}
                          className={`p-6 rounded-2xl shadow-sm border cursor-pointer group hover:shadow-lg transition-all relative overflow-hidden ${lowStockCount > 0 ? 'bg-white border-rose-100' : 'bg-white border-slate-100'}`}
                        >
                             <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <svg className={`w-24 h-24 transform rotate-12 ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            </div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Alertas Stock</p>
                            <div className="flex items-baseline gap-2 mt-2">
                              <p className={`text-4xl font-extrabold ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{lowStockCount}</p>
                            </div>
                            <div className={`mt-4 flex items-center text-xs font-medium w-fit px-2 py-1 rounded-lg ${lowStockCount > 0 ? 'text-rose-600 bg-rose-50' : 'text-slate-400 bg-slate-50'}`}>
                               <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${lowStockCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`}></span>
                               {lowStockCount > 0 ? 'Requiere Reposición' : 'Niveles Óptimos'}
                            </div>
                        </div>

                        {/* Categorías */}
                        <div 
                           onClick={() => setFilterMode('all')}
                           className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 cursor-pointer group hover:shadow-lg hover:border-violet-200 transition-all"
                        >
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Categorías</p>
                            <div className="flex items-baseline gap-2 mt-2">
                              <p className="text-4xl font-extrabold text-slate-800">{totalCategories}</p>
                            </div>
                            <div className="mt-4 flex items-center text-xs font-medium text-violet-600 bg-violet-50 w-fit px-2 py-1 rounded-lg">
                               <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mr-1.5"></span>
                               Variedad
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-[250px]">
                        <DashboardCharts tools={tools} />
                    </div>
                 </div>

                 {/* Filter Tabs Bar */}
                 <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 pt-2">
                    <button
                      onClick={() => setFilterMode('all')}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                        filterMode === 'all'
                          ? 'bg-violet-900 text-white shadow-md'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>📦 Todos ({tools.length})</span>
                    </button>

                    <button
                      onClick={() => setFilterMode('returnable')}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                        filterMode === 'returnable'
                          ? 'bg-violet-900 text-white shadow-md'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>🔄 Reutilizables</span>
                    </button>

                    <button
                      onClick={() => setFilterMode('consumable')}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                        filterMode === 'consumable'
                          ? 'bg-violet-900 text-white shadow-md'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>📊 Insumos Consumibles</span>
                    </button>

                    <button
                      onClick={() => setFilterMode('low')}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                        filterMode === 'low'
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      <span>⚠️ Stock Crítico ({lowStockCount})</span>
                    </button>

                    <button
                      onClick={() => setFilterMode('loans')}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                        filterMode === 'loans'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <span>📋 Préstamos Activos en Campo ({activeLoans.length})</span>
                    </button>
                 </div>

                 {/* Filters & Actions Bar */}
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-2 gap-4">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight uppercase">
                            {filterMode === 'low' && 'Stock Crítico'}
                            {filterMode === 'returnable' && 'Herramientas Reutilizables (Devolución Obligatoria)'}
                            {filterMode === 'consumable' && 'Insumos y Consumibles (Baja Directa)'}
                            {filterMode === 'loans' && 'Préstamos Activos por Legajo Operario'}
                            {filterMode === 'all' && 'Inventario General'}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                            {filterMode === 'loans' 
                                ? `Mostrando ${activeLoans.length} préstamos vigentes con legajo registrado.` 
                                : `Gestión de ${filteredTools.length} de ${tools.length} referencias en total.`}
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                        {/* Search Input Bar */}
                        <div className="relative flex-1 md:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <input 
                                type="text"
                                placeholder="Buscar herramienta, ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-violet-600 shadow-sm font-medium"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            )}
                        </div>

                        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
                        <button
                            onClick={handleExportTransactions}
                            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <span>CSV Movs</span>
                        </button>
                        <div className="w-px bg-slate-200 my-1 mx-1"></div>
                        <button
                            onClick={handleExportInventory}
                            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            <span>CSV Stock</span>
                        </button>
                        <div className="w-px bg-slate-200 my-1 mx-1"></div>
                        <button
                            onClick={() => setShowPrintModal(true)}
                            className="px-3 py-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1.5"
                            title="Generar Planilla Oficial para Impresión / PDF"
                        >
                            <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            <span>Planilla PDF</span>
                        </button>
                        <div className="w-px bg-slate-200 my-1 mx-1"></div>
                        <button
                            onClick={() => setShowClearModal(true)}
                            className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                            title="Vaciar lista de inventario / reiniciar"
                        >
                            <svg className="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            <span>Vaciar</span>
                        </button>
                        </div>

                        {filterMode !== 'all' && (
                            <button onClick={() => setFilterMode('all')} className="text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-xl hover:bg-violet-100 transition-colors">
                              Ver Todo
                            </button>
                        )}
                        
                        {filterMode !== 'loans' && (
                          <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
                              <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-violet-100 text-violet-700' : 'text-slate-400 hover:text-slate-600'}`}>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                              </button>
                              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-violet-100 text-violet-700' : 'text-slate-400 hover:text-slate-600'}`}>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                              </button>
                          </div>
                        )}
                    </div>
                 </div>

                 {/* Views */}
                 <div className="mt-4">
                 {filterMode === 'loans' ? (
                   <div>
                     {activeLoans.length === 0 ? (
                       <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
                         <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                         </div>
                         <h3 className="text-lg font-bold text-slate-800">No hay préstamos activos pendientes</h3>
                         <p className="text-slate-500 text-xs mt-1">Todas las herramientas prestadas han sido devueltas al Pañol.</p>
                       </div>
                     ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {activeLoans.map((loan, idx) => {
                           const toolObj = tools.find(t => t.id === loan.toolId);
                           return (
                             <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 hover:shadow-md transition-all">
                               <div className="flex justify-between items-start mb-3">
                                 <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                                   Legajo: {loan.agentId}
                                 </span>
                                 <span className="text-xs text-slate-400 font-mono">{loan.lastDate.split('T')[0]}</span>
                               </div>
                               <h3 className="font-extrabold text-slate-900 text-base mb-1">{loan.toolName}</h3>
                               <p className="text-xs text-slate-500 mb-4 font-medium">Cantidad prestada: <strong className="text-emerald-700 text-sm">{loan.quantity} u.</strong></p>
                               <button
                                 onClick={() => {
                                   if (toolObj) {
                                     setSelectedTool(toolObj);
                                     setScanMode(TransactionType.IN);
                                   }
                                 }}
                                 className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-sm flex items-center justify-center gap-1.5"
                               >
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" /></svg>
                                 Registrar Devolución
                               </button>
                             </div>
                           );
                         })}
                       </div>
                     )}
                   </div>
                 ) : tools.length === 0 ? (
                   <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 p-8 animate-fade-in">
                     <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                       <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                     </div>
                     <h3 className="text-xl font-black text-slate-800 uppercase">La lista está completamente vacía</h3>
                     <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
                       Has vaciado el inventario o aún no has cargado herramientas. Puedes comenzar agregando un artículo, importar tu Excel, o restaurar los datos modelo del Ecoparque.
                     </p>
                     <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                       <button 
                         onClick={() => setShowAddModal(true)}
                         className="bg-violet-700 hover:bg-violet-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                       >
                         <span>+ Crear Primer Artículo</span>
                       </button>
                       <button 
                         onClick={() => setShowImportModal(true)}
                         className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                       >
                         <span>Importar Excel / CSV</span>
                       </button>
                       <button 
                         onClick={handleResetDefaults}
                         className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-300 transition-all"
                       >
                         <span>Cargar Ejemplos Ecoparque</span>
                       </button>
                     </div>
                   </div>
                 ) : filteredTools.length === 0 ? (
                   <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
                     <p className="text-slate-400 font-medium">No se encontraron resultados.</p>
                     <button onClick={() => setFilterMode('all')} className="mt-2 text-violet-600 font-bold text-sm hover:underline">Limpiar filtros</button>
                   </div>
                 ) : viewMode === 'grid' ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                     {filteredTools.map((tool) => (
                       <div 
                         key={tool.id} 
                         onClick={() => setSelectedTool(tool)}
                         className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                       >
                         <div className={`absolute top-0 right-0 w-20 h-20 transform translate-x-10 -translate-y-10 rotate-45 ${tool.stock < (tool.minStock || 5) ? 'bg-rose-500' : 'bg-emerald-500'} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                         
                         <div className="flex justify-between items-start mb-4 relative z-10">
                           <div className="flex flex-wrap gap-1">
                             <span className="px-2.5 py-0.5 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider border border-slate-100">{tool.category}</span>
                             {tool.itemType === 'CONSUMABLE' ? (
                               <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-amber-200">📦 Consumible</span>
                             ) : (
                               <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider border border-emerald-200">🔄 Reutilizable</span>
                             )}
                           </div>
                           
                           <div className="flex gap-1.5">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setEditingTool(tool); }}
                                    className="text-slate-300 hover:text-amber-500 transition-colors p-1"
                                    title="Editar herramienta"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setQrTool(tool); }}
                                    className="text-slate-300 hover:text-violet-600 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zM6 6h2v2H6V6zm0 12h2v2H6v-2zm12-8h2v2h-2V6zM6 12h2v2H6v-2zm6-6h2v2h-2V6z" /></svg>
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTool(tool.id); }}
                                    className="text-slate-300 hover:text-rose-600 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                           </div>
                         </div>
                         
                         <h3 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-violet-700 transition-colors">{tool.name}</h3>
                         <p className="text-xs text-slate-400 font-mono mb-4">{tool.id}</p>
                         
                         <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                            <p className="text-slate-500 text-xs flex items-center gap-1.5 font-medium">
                                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                {tool.location}
                            </p>
                            <div className="text-right">
                                <span className={`block text-2xl font-extrabold leading-none ${tool.stock < (tool.minStock || 5) ? 'text-rose-600' : 'text-slate-800'}`}>
                                    {tool.stock}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Stock</span>
                            </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 w-4"></th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Herramienta</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación</th>
                                        <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                                        <th className="p-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredTools.map((tool) => (
                                        <tr key={tool.id} className="hover:bg-violet-50/30 transition-colors group">
                                            <td className="p-4">
                                                <div className={`w-2 h-2 rounded-full ${tool.stock < (tool.minStock || 5) ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}`}></div>
                                            </td>
                                            <td className="p-4">
                                                <div 
                                                  onClick={() => setEditingTool(tool)}
                                                  className="flex flex-col cursor-pointer group/name"
                                                  title="Clic para editar artículo"
                                                >
                                                   <span className="font-bold text-slate-800 group-hover/name:text-violet-700 transition-colors flex items-center gap-1.5">
                                                     {tool.name}
                                                     <svg className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover/name:opacity-100 transition-opacity text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                   </span>
                                                   <span className="text-[10px] text-slate-400 font-mono">{tool.id}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {tool.itemType === 'CONSUMABLE' ? (
                                                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">📦 Consumible</span>
                                                ) : (
                                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">🔄 Reutilizable</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2.5 py-0.5 bg-slate-100 rounded-full text-xs font-bold text-slate-600 border border-slate-200">{tool.category}</span>
                                            </td>
                                            <td className="p-4 text-slate-500 font-medium">{tool.location}</td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                  <span className={`font-bold text-base ${tool.stock < (tool.minStock || 5) ? 'text-rose-600' : 'text-slate-700'}`}>{tool.stock}</span>
                                                  <button 
                                                    onClick={() => setEditingTool(tool)} 
                                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-600 p-0.5 rounded transition-all"
                                                    title="Modificar stock directamente"
                                                  >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                  </button>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button 
                                                        onClick={() => setEditingTool(tool)}
                                                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        title="Editar datos del artículo"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>

                                                    <button 
                                                        onClick={() => setQrTool(tool)}
                                                        className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                                        title="Ver QR"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h2v-4zM6 6h2v2H6V6zm0 12h2v2H6v-2zm12-8h2v2h-2V6zM6 12h2v2H6v-2zm6-6h2v2h-2V6z" /></svg>
                                                    </button>
                                                    
                                                    <button 
                                                        onClick={() => handleDeleteTool(tool.id)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>

                                                    <button 
                                                        onClick={() => setSelectedTool(tool)}
                                                        className="text-violet-600 hover:text-violet-800 font-bold text-xs bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        Gestionar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                 )}
                 </div>
               </>
             )}
           </div>
        )}

      </main>

      {/* Modals */}
      {isScanning && (
        <Scanner onScanSuccess={handleScanSuccess} onClose={() => setIsScanning(false)} />
      )}

      {selectedTool && (
        <TransactionModal 
          tool={selectedTool} 
          initialType={scanMode || undefined}
          onConfirm={handleTransaction} 
          onCancel={() => { setSelectedTool(null); setScanMode(null); }} 
        />
      )}

      {showAddModal && (
        <AddToolModal 
          onConfirm={handleAddTool} 
          onCancel={() => setShowAddModal(false)} 
        />
      )}

      {showImportModal && (
        <ImportExcelModal 
          onConfirm={handleConfirmImport}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {showCloudModal && (
        <CloudflareSyncModal 
          onClose={() => setShowCloudModal(false)}
          onRefreshData={refreshData}
          onExportInventory={handleExportInventory}
          onExportTransactions={handleExportTransactions}
        />
      )}

      {showPrintModal && (
        <PrintReportModal 
          tools={tools}
          transactions={transactions}
          onClose={() => setShowPrintModal(false)}
          userName={user?.name || 'Operador Pañol'}
        />
      )}

      {editingTool && (
        <EditToolModal 
          tool={editingTool}
          onConfirm={handleUpdateTool}
          onDelete={handleDeleteTool}
          onCancel={() => setEditingTool(null)}
        />
      )}

      {showClearModal && (
        <ClearInventoryModal 
          currentCount={tools.length}
          onConfirmClear={handleConfirmClear}
          onResetDefaults={handleResetDefaults}
          onClose={() => setShowClearModal(false)}
        />
      )}

      {qrTool && (
        <ShowQRModal 
          tool={qrTool} 
          onClose={() => setQrTool(null)} 
        />
      )}

    </div>
  );
};

export default App;
