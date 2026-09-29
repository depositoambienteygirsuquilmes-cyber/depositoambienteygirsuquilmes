import React, { useState, useEffect } from 'react';
import { getGoogleScriptUrl, setGoogleScriptUrl, testGoogleSheetsConnection } from '../services/inventoryService';

interface GoogleSheetsModalProps {
  onClose: () => void;
  onRefreshData: () => Promise<void>;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({ onClose, onRefreshData }) => {
  const [scriptUrl, setScriptUrlInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'code' | 'guide'>('config');

  useEffect(() => {
    setScriptUrlInput(getGoogleScriptUrl());
  }, []);

  const handleSaveUrl = () => {
    setGoogleScriptUrl(scriptUrl);
    setTestResult({ success: true, message: 'URL guardada exitosamente en este dispositivo.' });
  };

  const handleTestConnection = async () => {
    setGoogleScriptUrl(scriptUrl);
    setTesting(true);
    setTestResult(null);
    const res = await testGoogleSheetsConnection();
    setTesting(false);
    setTestResult(res);
  };

  const appsScriptCode = `// ====================================================================
// CÓDIGO DE GOOGLE APPS SCRIPT PARA EL ECOPARQUE QUILMES (GIRSU)
// Pegar este código en: Extensiones > Apps Script de tu Google Sheet
// ====================================================================

function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'getInventory') {
    var sheet = getOrCreateSheet(ss, "Inventario", ["ID", "Nombre", "Categoria", "Stock", "Ubicacion", "UltimaActualizacion"]);
    var data = sheet.getDataRange().getValues();
    var result = [];
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        result.push({
          id: String(data[i][0]),
          name: String(data[i][1]),
          category: String(data[i][2]),
          stock: Number(data[i][3]) || 0,
          location: String(data[i][4]),
          lastUpdated: data[i][5] ? String(data[i][5]) : new Date().toISOString()
        });
      }
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getTransactions') {
    var sheet = getOrCreateSheet(ss, "Movimientos", ["ID", "ID_Herramienta", "Herramienta", "Cantidad", "Tipo", "Fecha", "LegajoAgente", "UsuarioSistema"]);
    var data = sheet.getDataRange().getValues();
    var result = [];
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        result.push({
          id: String(data[i][0]),
          toolId: String(data[i][1]),
          toolName: String(data[i][2]),
          quantity: Number(data[i][3]) || 0,
          type: String(data[i][4]),
          date: String(data[i][5]),
          agentId: String(data[i][6]),
          user: String(data[i][7])
        });
      }
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: "OK", app: "Ecoparque GIRSU" })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var payload = JSON.parse(e.postData.contents);
  var action = payload.action;

  if (action === 'createTool') {
    var sheet = getOrCreateSheet(ss, "Inventario", ["ID", "Nombre", "Categoria", "Stock", "Ubicacion", "UltimaActualizacion"]);
    var tool = payload.tool;
    sheet.appendRow([tool.id, tool.name, tool.category, tool.stock, tool.location, tool.lastUpdated || new Date().toISOString()]);
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'deleteTool') {
    var sheet = getOrCreateSheet(ss, "Inventario", ["ID", "Nombre", "Categoria", "Stock", "Ubicacion", "UltimaActualizacion"]);
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(payload.toolId)) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'updateStock') {
    var sheetInv = getOrCreateSheet(ss, "Inventario", ["ID", "Nombre", "Categoria", "Stock", "Ubicacion", "UltimaActualizacion"]);
    var data = sheetInv.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(payload.toolId)) {
        var currentStock = Number(data[i][3]) || 0;
        var change = payload.type === 'IN' ? Number(payload.quantity) : -Number(payload.quantity);
        var newStock = Math.max(0, currentStock + change);
        sheetInv.getRange(i + 1, 4).setValue(newStock);
        sheetInv.getRange(i + 1, 6).setValue(new Date().toISOString());
        break;
      }
    }

    var sheetTx = getOrCreateSheet(ss, "Movimientos", ["ID", "ID_Herramienta", "Herramienta", "Cantidad", "Tipo", "Fecha", "LegajoAgente", "UsuarioSistema"]);
    var tx = payload.tx;
    sheetTx.appendRow([tx.id, tx.toolId, tx.toolName, tx.quantity, tx.type, tx.date, tx.agentId || '', tx.user || '']);

    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ error: "Accion no invalida" })).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#ede9fe");
    }
  }
  return sheet;
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-emerald-300 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-400/40 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-extrabold uppercase tracking-tight">Google Sheets como Cerebro Nube</h2>
              <p className="text-emerald-200 text-xs font-medium">Conecta tu hoja de cálculo oficial de Google Drive en tiempo real</p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex gap-2 mt-6 border-b border-emerald-800/80">
            <button 
              onClick={() => setActiveTab('config')}
              className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'config' ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-emerald-100/60 hover:text-white'}`}
            >
              Configuración & Estado
            </button>
            <button 
              onClick={() => setActiveTab('guide')}
              className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'guide' ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-emerald-100/60 hover:text-white'}`}
            >
              Paso a Paso
            </button>
            <button 
              onClick={() => setActiveTab('code')}
              className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'code' ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-emerald-100/60 hover:text-white'}`}
            >
              Código Apps Script
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800">

          {/* TAB 1: CONFIGURACIÓN */}
          {activeTab === 'config' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  URL del Web App de Google Apps Script
                </label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    value={scriptUrl}
                    onChange={(e) => setScriptUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 font-mono"
                  />
                  <button 
                    onClick={handleSaveUrl}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                  >
                    Guardar
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Esta es la dirección pública generada al implementar tu Google Sheet como Web App.
                </p>
              </div>

              {/* Botones de Prueba y Sincronización */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl flex flex-wrap gap-3 items-center justify-between">
                <div>
                  <span className="block font-bold text-emerald-950 text-xs uppercase tracking-wide">Comprobar Estado de Conexión</span>
                  <span className="text-[11px] text-emerald-800">Verifica si la app puede leer/escribir en tu Google Sheet ahora mismo.</span>
                </div>
                <button 
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
                >
                  {testing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <span>Probando...</span>
                    </>
                  ) : (
                    <span>Probar Conexión Nube</span>
                  )}
                </button>
              </div>

              {/* Resultado de prueba */}
              {testResult && (
                <div className={`p-4 rounded-xl border text-xs font-semibold flex items-start gap-3 ${
                  testResult.success ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}>
                  <div className={`w-3 h-3 rounded-full mt-0.5 ${testResult.success ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  <div className="flex-1">
                    <p className="font-bold">{testResult.success ? 'Conexión Exitosa' : 'Atención'}</p>
                    <p className="mt-0.5">{testResult.message}</p>
                  </div>
                </div>
              )}

              {/* Botón de recarga general */}
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs text-slate-500">¿Hiciste cambios directos en el Excel de Google Drive?</span>
                <button 
                  onClick={async () => {
                    await onRefreshData();
                    setTestResult({ success: true, message: 'Inventario refrescado desde Google Sheets correctamente.' });
                  }}
                  className="bg-violet-50 hover:bg-violet-100 text-violet-800 font-bold text-xs px-4 py-2 rounded-xl transition-colors"
                >
                  Forzar Sincronización
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GUÍA PASO A PASO */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs animate-fade-in">
              <p className="font-bold text-slate-700 text-sm">Cómo conectar tu propio Google Sheet en 5 sencillos pasos:</p>

              <div className="space-y-3">
                <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <div>
                    <p className="font-bold text-slate-800">Crea o abre una Hoja de Cálculo en Google Drive</p>
                    <p className="text-slate-500 mt-0.5">Abre <a href="https://sheets.google.com" target="_blank" rel="noreferrer" className="text-emerald-600 underline font-semibold">sheets.google.com</a> con la cuenta del Ecoparque.</p>
                  </div>
                </div>

                <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <div>
                    <p className="font-bold text-slate-800">Abre Apps Script</p>
                    <p className="text-slate-500 mt-0.5">En el menú superior haz clic en <strong>Extensiones &gt; Apps Script</strong>.</p>
                  </div>
                </div>

                <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <div>
                    <p className="font-bold text-slate-800">Pega el código fuente</p>
                    <p className="text-slate-500 mt-0.5">Borra cualquier texto existente en <code className="bg-slate-200 px-1 py-0.5 rounded">Code.gs</code>, ve a la pestaña <strong>"Código Apps Script"</strong> en esta ventana, copia el código y pégalo allí.</p>
                  </div>
                </div>

                <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">4</span>
                  <div>
                    <p className="font-bold text-slate-800">Implementar como Aplicación Web</p>
                    <p className="text-slate-500 mt-0.5">Haz clic arriba a la derecha en <strong>Implementar &gt; Nueva implementación</strong>. Selecciona tipo <strong>"Aplicación web"</strong>, pon en <em>"Quién tiene acceso"</em> = <strong>Cualquier persona (Anyone)</strong> y haz clic en Implementar.</p>
                  </div>
                </div>

                <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">5</span>
                  <div>
                    <p className="font-bold text-slate-800">Pega la URL de la Web App</p>
                    <p className="text-slate-500 mt-0.5">Copia la URL que termina en <code className="bg-slate-200 px-1 py-0.5 rounded">/exec</code> y pégala en la pestaña <strong>Configuración</strong> de este panel.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CÓDIGO APPS SCRIPT */}
          {activeTab === 'code' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Código Google Apps Script (Code.gs)</span>
                <button 
                  onClick={handleCopyCode}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {copiedCode ? (
                    <>
                      <svg className="w-4 h-4 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      <span>Copiar Código</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-72 leading-relaxed border border-slate-800">
                <pre>{appsScriptCode}</pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 font-bold text-white text-xs transition-colors shadow-sm"
          >
            Listo / Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
