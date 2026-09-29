import React, { useState, useEffect, useRef } from 'react';
import { 
  getStorageProvider, 
  setStorageProvider, 
  getCloudflareConfig, 
  setCloudflareConfig, 
  testCloudflareConnection,
  getGoogleScriptUrl, 
  setGoogleScriptUrl, 
  testGoogleSheetsConnection,
  exportDatabaseBackupJSON,
  importDatabaseBackupJSON,
  resetToDefaultData,
  StorageProvider
} from '../services/inventoryService';

interface CloudflareSyncModalProps {
  onClose: () => void;
  onRefreshData: () => Promise<void>;
  onExportInventory: () => void;
  onExportTransactions: () => void;
}

export const CloudflareSyncModal: React.FC<CloudflareSyncModalProps> = ({ 
  onClose, 
  onRefreshData,
  onExportInventory,
  onExportTransactions 
}) => {
  const [activeTab, setActiveTab] = useState<'deploy' | 'backup' | 'storage'>('deploy');
  
  // Storage mode
  const [provider, setProvider] = useState<StorageProvider>('local');
  
  // Cloudflare configuration
  const [cfEndpoint, setCfEndpoint] = useState('/api/inventory');
  const [cfToken, setCfToken] = useState('');
  const [testingCf, setTestingCf] = useState(false);
  const [cfTestResult, setCfTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Sheets configuration (legacy)
  const [scriptUrl, setScriptUrlInput] = useState('');
  const [testingSheets, setTestingSheets] = useState(false);
  const [sheetsTestResult, setSheetsTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Backup & Restore
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [copiedGit, setCopiedGit] = useState(false);

  useEffect(() => {
    setProvider(getStorageProvider());
    const cfConfig = getCloudflareConfig();
    setCfEndpoint(cfConfig.endpointUrl || '/api/inventory');
    setCfToken(cfConfig.apiToken || '');
    setScriptUrlInput(getGoogleScriptUrl());
  }, []);

  const handleSaveStorageMode = (newMode: StorageProvider) => {
    setProvider(newMode);
    setStorageProvider(newMode);
    if (newMode === 'cloudflare') {
      setCloudflareConfig({
        enabled: true,
        endpointUrl: cfEndpoint,
        apiToken: cfToken
      });
    }
    setBackupStatus(`Modo cambiado a: ${newMode === 'local' ? 'Local Autónomo (Recomendado para Cloudflare)' : newMode.toUpperCase()}`);
    setTimeout(() => setBackupStatus(null), 3500);
  };

  const handleTestCloudflare = async () => {
    setTestingCf(true);
    setCfTestResult(null);
    setCloudflareConfig({
      enabled: true,
      endpointUrl: cfEndpoint,
      apiToken: cfToken
    });
    const res = await testCloudflareConnection();
    setTestingCf(false);
    setCfTestResult(res);
  };

  const handleTestSheets = async () => {
    setTestingSheets(true);
    setSheetsTestResult(null);
    setGoogleScriptUrl(scriptUrl);
    const res = await testGoogleSheetsConnection();
    setTestingSheets(false);
    setSheetsTestResult(res);
  };

  const handleDownloadFullBackup = async () => {
    try {
      const jsonStr = await exportDatabaseBackupJSON();
      const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `Ecoparque_Quilmes_Backup_Completo_${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setBackupStatus("Copia de seguridad JSON descargada con éxito.");
      setTimeout(() => setBackupStatus(null), 3000);
    } catch (e: any) {
      alert("Error al exportar respaldo: " + e.message);
    }
  };

  const handleRestoreBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("¿Desea restaurar esta copia de seguridad? Se actualizará el inventario y movimientos actuales.")) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const res = await importDatabaseBackupJSON(text);
        if (res.success) {
          alert(res.message);
          await onRefreshData();
          onClose();
        } else {
          alert(res.message);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      alert("Error al leer el archivo: " + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleResetDefaults = async () => {
    if (confirm("⚠️ ¿Está seguro de restablecer el pañol al catálogo inicial de prueba del Ecoparque Quilmes?")) {
      await resetToDefaultData();
      await onRefreshData();
      alert("Inventario restablecido a valores iniciales de Ecoparque GIRSU.");
      onClose();
    }
  };

  const gitSnippet = `# 1. Inicializar y agregar archivos
git init
git add .
git commit -m "Ecoparque Quilmes - GIRSU Pañol"

# 2. Conectar a tu repo de GitHub
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ecoparque-quilmes.git
git push -u origin main`;

  const copyGitCommands = () => {
    navigator.clipboard.writeText(gitSnippet);
    setCopiedGit(true);
    setTimeout(() => setCopiedGit(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-violet-950 to-indigo-900 text-white p-6 flex justify-between items-center border-b border-violet-800/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black uppercase tracking-tight">Cloudflare & GitHub • Centro de Despliegue</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  Sin Google Sheets
                </span>
              </div>
              <p className="text-violet-200 text-xs mt-0.5">
                Arquitectura autónoma, 0 latencia, copias de seguridad JSON y sincronización para el Ecoparque
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1.5 border-b border-slate-200 gap-1">
          <button 
            onClick={() => setActiveTab('deploy')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'deploy' 
                ? 'bg-white text-violet-900 shadow-sm border border-slate-200/80' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            1. Despliegue Cloudflare & GitHub
          </button>

          <button 
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'backup' 
                ? 'bg-white text-violet-900 shadow-sm border border-slate-200/80' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            2. Copias de Seguridad & Restaurar
          </button>

          <button 
            onClick={() => setActiveTab('storage')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'storage' 
                ? 'bg-white text-violet-900 shadow-sm border border-slate-200/80' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
            3. Configuración de Base de Datos
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {backupStatus && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-2xl flex items-center gap-2 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {backupStatus}
            </div>
          )}

          {/* TAB 1: DESPLIEGUE GITHUB & CLOUDFLARE */}
          {activeTab === 'deploy' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Highlight Banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-violet-500/10 border border-amber-300/60 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <h4 className="font-black text-slate-900 text-base uppercase">¿Por qué Google Sheets quedaba "al pepe"?</h4>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                      Google Sheets obliga a usar <strong>Google Apps Script</strong>, que tiene demoras de hasta 4 segundos por petición ("cold starts"), requiere autorizar cuentas de Google a cada operario y tiene límites de cuota diarios. 
                      Con <strong>GitHub + Cloudflare Pages</strong>, la aplicación carga en milisegundos, funciona <strong>100% offline</strong> en el pañol y puedes sincronizarla cuando quieras.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step by step */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Paso 1: GitHub */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">1</span>
                        <h5 className="font-bold text-slate-900 uppercase text-sm">Subir el proyecto a GitHub</h5>
                      </div>
                      <button 
                        onClick={copyGitCommands}
                        className="text-xs font-bold text-violet-700 bg-violet-100 hover:bg-violet-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                      >
                        {copiedGit ? '✓ Copiado' : 'Copiar comandos'}
                      </button>
                    </div>
                    <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl text-xs font-mono overflow-x-auto">
                      {gitSnippet}
                    </pre>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3">
                    Crea un repositorio vacío en tu GitHub y corre estos comandos en la terminal de la carpeta.
                  </p>
                </div>

                {/* Paso 2: Cloudflare Pages */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-7 h-7 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center">2</span>
                      <h5 className="font-bold text-slate-900 uppercase text-sm">Conectar con Cloudflare Pages</h5>
                    </div>
                    <div className="space-y-2 text-xs text-slate-700">
                      <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="font-bold text-amber-600">A</span>
                        <span>Entra en <strong>dash.cloudflare.com</strong> &gt; <strong>Workers &amp; Pages</strong> &gt; <strong>Create application</strong> &gt; pestaña <strong>Pages</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="font-bold text-amber-600">B</span>
                        <span>Selecciona <strong>Connect to Git</strong> y elige el repositorio de GitHub de Ecoparque.</span>
                      </div>
                      <div className="flex items-start gap-2 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                        <span className="font-bold text-amber-700">C</span>
                        <div>
                          <span>Ajustes de Compilación:</span>
                          <ul className="list-disc list-inside mt-1 text-[11px] text-amber-900 font-mono">
                            <li>Framework preset: <strong>Vite</strong></li>
                            <li>Build command: <strong>npm run build</strong></li>
                            <li>Build output directory: <strong>dist</strong></li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3">
                    Cloudflare compilará y te dará una URL segura gratuita como <code>ecoparque-quilmes.pages.dev</code>.
                  </p>
                </div>

              </div>

              {/* Ready to go banner */}
              <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-violet-950 text-sm">¿Quieres guardar la guía completa en tu equipo?</h5>
                  <p className="text-violet-700 text-xs mt-0.5">El archivo <code>CLOUDFLARE_GITHUB_DEPLOY.md</code> ya fue generado en la raíz de este proyecto.</p>
                </div>
                <button 
                  onClick={() => alert("El archivo 'CLOUDFLARE_GITHUB_DEPLOY.md' está en el proyecto y listo para consultar en tu repositorio de GitHub.")}
                  className="bg-violet-700 hover:bg-violet-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  Ver en Repositorio
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: BACKUPS & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="font-black text-slate-900 uppercase text-sm mb-1">Copias de Seguridad Autónomas (Sin Nube Externa)</h4>
                <p className="text-slate-600 text-xs">
                  Puedes respaldar todas las herramientas, stocks, insumos retornables/descartables y el historial completo de movimientos en un archivo descargable.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Exportar JSON */}
                <div className="bg-white border-2 border-emerald-100 hover:border-emerald-300 transition-all p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-3">
                      JSON
                    </div>
                    <h5 className="font-bold text-slate-900 text-base">Descargar Backup Completo (JSON)</h5>
                    <p className="text-slate-500 text-xs mt-1">
                      Copia íntegra de la base de datos local para archivar o mover a otra computadora o celular.
                    </p>
                  </div>
                  <button 
                    onClick={handleDownloadFullBackup}
                    className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>Descargar Archivo .JSON</span>
                  </button>
                </div>

                {/* Restaurar JSON */}
                <div className="bg-white border-2 border-indigo-100 hover:border-indigo-300 transition-all p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-3">
                      📥
                    </div>
                    <h5 className="font-bold text-slate-900 text-base">Restaurar Copia de Seguridad (JSON)</h5>
                    <p className="text-slate-500 text-xs mt-1">
                      Carga un archivo de respaldo previo para restablecer herramientas y movimientos al instante.
                    </p>
                  </div>
                  <div>
                    <input 
                      type="file" 
                      accept=".json" 
                      ref={fileInputRef} 
                      onChange={handleRestoreBackupFile} 
                      className="hidden" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      <span>Seleccionar Archivo de Respaldo</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Exportar Excel / CSV */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                <h5 className="font-bold text-slate-900 uppercase text-xs mb-3 text-slate-600">Planillas de Cálculo para la Municipalidad (Excel / CSV)</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={() => { onExportInventory(); setBackupStatus("Planilla de inventario descargada."); }}
                    className="bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-slate-800 font-bold text-xs p-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span>Descargar Inventario (Excel / CSV)</span>
                  </button>

                  <button 
                    onClick={() => { onExportTransactions(); setBackupStatus("Planilla de movimientos descargada."); }}
                    className="bg-white border border-slate-300 hover:border-violet-500 hover:bg-violet-50 text-slate-800 font-bold text-xs p-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span>Descargar Historial de Movimientos</span>
                  </button>
                </div>
              </div>

              {/* Danger Zone: Reset to Defaults */}
              <div className="border border-rose-200 bg-rose-50/50 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h6 className="font-bold text-rose-900 text-xs">Restablecer datos de muestra</h6>
                  <p className="text-[11px] text-rose-700">Regresa el catálogo al listado modelo de Ecoparque Quilmes GIRSU.</p>
                </div>
                <button 
                  onClick={handleResetDefaults}
                  className="bg-white border border-rose-300 hover:bg-rose-100 text-rose-700 font-bold text-xs px-3.5 py-1.5 rounded-xl transition-colors"
                >
                  Restablecer
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: ALMACENAMIENTO & NUBE (CLOUDFLARE / LOCAL / SHEETS) */}
          {activeTab === 'storage' && (
            <div className="space-y-6 animate-fade-in">
              
              <div>
                <h4 className="font-black text-slate-900 uppercase text-sm mb-1">Selecciona el Modo de Almacenamiento</h4>
                <p className="text-slate-600 text-xs">
                  Configura cómo y dónde se guardan los datos del pañol.
                </p>
              </div>

              {/* Selector de modo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                
                {/* Opción 1: Local Autónomo */}
                <div 
                  onClick={() => handleSaveStorageMode('local')}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                    provider === 'local' 
                      ? 'border-emerald-500 bg-emerald-50/40 shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Recomendado
                      </span>
                      {provider === 'local' && <span className="text-emerald-600 font-black">✓ Activo</span>}
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-sm">Modo Local Autónomo</h5>
                    <p className="text-slate-500 text-xs mt-1">
                      Guarda todo en el dispositivo. 0 latencia, ultra rápido, ideal para Cloudflare Pages y PWA.
                    </p>
                  </div>
                </div>

                {/* Opción 2: Cloudflare Functions / Worker API */}
                <div 
                  onClick={() => handleSaveStorageMode('cloudflare')}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                    provider === 'cloudflare' 
                      ? 'border-amber-500 bg-amber-50/40 shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Cloudflare API
                      </span>
                      {provider === 'cloudflare' && <span className="text-amber-600 font-black">✓ Activo</span>}
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-sm">Cloudflare Functions / Worker</h5>
                    <p className="text-slate-500 text-xs mt-1">
                      Sincroniza múltiples dispositivos usando la API de Cloudflare Pages o Cloudflare D1/KV.
                    </p>
                  </div>
                </div>

                {/* Opción 3: Google Sheets (Legado) */}
                <div 
                  onClick={() => handleSaveStorageMode('sheets')}
                  className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                    provider === 'sheets' 
                      ? 'border-violet-500 bg-violet-50/40 shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300 bg-white opacity-80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Legado
                      </span>
                      {provider === 'sheets' && <span className="text-violet-600 font-black">✓ Activo</span>}
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-sm">Google Sheets (Opcional)</h5>
                    <p className="text-slate-500 text-xs mt-1">
                      Conexión externa con Google Apps Script. No requerida para Cloudflare.
                    </p>
                  </div>
                </div>

              </div>

              {/* Si está en Cloudflare API */}
              {provider === 'cloudflare' && (
                <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-2xl space-y-4 animate-fade-in">
                  <h5 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Configuración de Cloudflare Pages API / Worker
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ruta o URL del Endpoint</label>
                      <input 
                        type="text" 
                        value={cfEndpoint} 
                        onChange={(e) => setCfEndpoint(e.target.value)}
                        placeholder="/api/inventory"
                        className="w-full text-xs font-mono p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Por defecto usa <code>/api/inventory</code> provisto en <code>/functions/api/inventory.ts</code> de Cloudflare Pages.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Token de Seguridad (Opcional)</label>
                      <input 
                        type="password" 
                        value={cfToken} 
                        onChange={(e) => setCfToken(e.target.value)}
                        placeholder="Bearer Token..."
                        className="w-full text-xs font-mono p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleTestCloudflare}
                      disabled={testingCf}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
                    >
                      {testingCf ? 'Probando...' : 'Probar Conexión Cloudflare'}
                    </button>
                  </div>
                  {cfTestResult && (
                    <div className={`text-xs p-3 rounded-xl border ${cfTestResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                      {cfTestResult.message}
                    </div>
                  )}
                </div>
              )}

              {/* Si está en Google Sheets */}
              {provider === 'sheets' && (
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 animate-fade-in">
                  <h5 className="font-bold text-slate-900 text-sm">Configuración de Google Apps Script URL</h5>
                  <div>
                    <input 
                      type="text" 
                      value={scriptUrl} 
                      onChange={(e) => setScriptUrlInput(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full text-xs font-mono p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleTestSheets}
                      disabled={testingSheets}
                      className="bg-violet-700 hover:bg-violet-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
                    >
                      {testingSheets ? 'Probando...' : 'Probar Google Sheets'}
                    </button>
                  </div>
                  {sheetsTestResult && (
                    <div className={`text-xs p-3 rounded-xl border ${sheetsTestResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                      {sheetsTestResult.message}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex justify-between items-center">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Modo activo: <strong className="text-slate-800 uppercase">{provider === 'local' ? 'Local Autónomo (Cloudflare Ready)' : provider}</strong></span>
          </div>
          <button 
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
          >
            Listo / Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
