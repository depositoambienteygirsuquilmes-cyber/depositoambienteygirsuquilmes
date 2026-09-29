import { Tool, Transaction, TransactionType } from "../types";

// ====================================================================================
// CONFIGURACIÓN DE ALMACENAMIENTO (CLOUDFLARE / LOCAL / SHEETS)
// ====================================================================================

export type StorageProvider = 'local' | 'cloudflare' | 'sheets';

export interface CloudflareConfig {
  enabled: boolean;
  endpointUrl: string; // e.g. /api/inventory o URL de Cloudflare Worker
  apiToken?: string;
}

export const getStorageProvider = (): StorageProvider => {
  const mode = localStorage.getItem('ecoparque_storage_provider');
  if (mode === 'cloudflare' || mode === 'sheets') return mode;
  return 'local'; // Predeterminado: rápido, autónomo, ideal para GitHub + Cloudflare Pages
};

export const setStorageProvider = (provider: StorageProvider): void => {
  localStorage.setItem('ecoparque_storage_provider', provider);
};

export const getCloudflareConfig = (): CloudflareConfig => {
  const stored = localStorage.getItem('ecoparque_cloudflare_config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return {
    enabled: false,
    endpointUrl: '/api/inventory',
    apiToken: ''
  };
};

export const setCloudflareConfig = (config: CloudflareConfig): void => {
  localStorage.setItem('ecoparque_cloudflare_config', JSON.stringify(config));
};

// Configuración opcional de Google Sheets (Legado)
const DEFAULT_GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbznzCKDNsYKRl-5J12x5Nr-Cv9UedjP-03fpg0cDRxA0Wto3N1ZGAL2AMAN84TS13Q/exec';

export const getGoogleScriptUrl = (): string => {
  const custom = localStorage.getItem('ecoparque_google_script_url');
  return custom && custom.trim() !== '' ? custom.trim() : DEFAULT_GOOGLE_SCRIPT_URL;
};

export const setGoogleScriptUrl = (url: string): void => {
  localStorage.setItem('ecoparque_google_script_url', url.trim());
};

// ====================================================================================
// COMUNICACIÓN CON LA NUBE (SOLO SI ESTÁ HABILITADO)
// ====================================================================================

const callCloudflare = async (payload: any, method: 'GET' | 'POST' = 'GET') => {
  const config = getCloudflareConfig();
  if (!config.endpointUrl) return null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (config.apiToken) {
    headers['Authorization'] = `Bearer ${config.apiToken}`;
  }

  let url = config.endpointUrl;
  const options: RequestInit = { method, headers };

  if (method === 'GET' && payload) {
    const qs = new URLSearchParams(payload).toString();
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
  } else if (method === 'POST') {
    options.body = JSON.stringify(payload);
  }

  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Cloudflare error HTTP ${res.status}`);
  return await res.json();
};

const callGoogleScript = async (params: any, method: 'GET' | 'POST' = 'GET') => {
  const currentUrl = getGoogleScriptUrl();
  if (!currentUrl || currentUrl.includes('PEGA_TU_URL')) {
    return null;
  }

  let url = currentUrl;
  const options: RequestInit = {
    method: method,
    headers: { "Content-Type": "text/plain;charset=utf-8" },
  };

  if (method === 'GET') {
    const queryString = new URLSearchParams(params).toString();
    url += `?${queryString}`;
  } else {
    options.body = JSON.stringify(params);
    options.redirect = "follow";
  }

  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const text = await response.text();
  return JSON.parse(text);
};

// ====================================================================================
// DATOS PREDETERMINADOS (CATÁLOGO INICIAL ECOPARQUE QUILMES)
// ====================================================================================

export const getDefaultInventory = (): Tool[] => [
  { id: "T1001", name: "Pala Ancha de Chapa", category: "Herramientas de Mano", stock: 15, location: "Depósito Central A", itemType: "RETURNABLE", condition: "BUENO", minStock: 4, lastUpdated: new Date().toISOString() },
  { id: "T1002", name: "Rastrillo Metálico de 14 Dientes", category: "Herramientas de Mano", stock: 12, location: "Depósito Central B", itemType: "RETURNABLE", condition: "BUENO", minStock: 3, lastUpdated: new Date().toISOString() },
  { id: "T1003", name: "Carretilla Reforzada 80L", category: "Transporte", stock: 8, location: "Sector Compostaje", itemType: "RETURNABLE", condition: "BUENO", minStock: 2, lastUpdated: new Date().toISOString() },
  { id: "T1004", name: "Tijera de Podar Grande", category: "Poda", stock: 6, location: "Depósito Central A", itemType: "RETURNABLE", condition: "BUENO", minStock: 2, lastUpdated: new Date().toISOString() },
  { id: "T1005", name: "Motosierra Stihl MS 250", category: "Mantenimiento", stock: 3, location: "Armario de Seguridad", itemType: "RETURNABLE", condition: "BUENO", minStock: 1, lastUpdated: new Date().toISOString() },
  { id: "T1006", name: "Guantes de Nitrilo Reutilizables", category: "EPP", stock: 120, location: "Pañol Entrada", itemType: "CONSUMABLE", minStock: 30, lastUpdated: new Date().toISOString() },
  { id: "T1007", name: "Horquilla para Compost", category: "Herramientas de Mano", stock: 10, location: "Sector Compostaje", itemType: "RETURNABLE", condition: "BUENO", minStock: 3, lastUpdated: new Date().toISOString() },
  { id: "T1008", name: "Sopladora de Hojas a Nafta", category: "Mantenimiento", stock: 4, location: "Armario de Seguridad", itemType: "RETURNABLE", condition: "BUENO", minStock: 1, lastUpdated: new Date().toISOString() },
  { id: "T1009", name: "Bolsas de Residuos Gruesas 80x110", category: "Insumos", stock: 250, location: "Pañol Entrada", itemType: "CONSUMABLE", minStock: 50, lastUpdated: new Date().toISOString() },
  { id: "T1010", name: "Barbijos / Mascarillas Descartables", category: "EPP", stock: 85, location: "Pañol Entrada", itemType: "CONSUMABLE", minStock: 20, lastUpdated: new Date().toISOString() }
];

export const getDefaultTransactions = (): Transaction[] => {
  const today = new Date();
  const d1 = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const d2 = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
  const d3 = new Date(today.getTime() - 6 * 60 * 60 * 1000).toISOString();

  return [
    { id: "tx_1", toolId: "T1001", toolName: "Pala Ancha de Chapa", quantity: 5, type: TransactionType.IN, date: d1, user: "admin", agentId: "1024" },
    { id: "tx_2", toolId: "T1003", toolName: "Carretilla Reforzada 80L", quantity: 2, type: TransactionType.OUT, date: d2, user: "operario", agentId: "1150" },
    { id: "tx_3", toolId: "T1006", toolName: "Guantes de Nitrilo Reutilizables", quantity: 12, type: TransactionType.OUT, date: d3, user: "operario", agentId: "2044" }
  ];
};

// ====================================================================================
// FETCH INVENTORY
// ====================================================================================

export const fetchInventory = async (): Promise<Tool[]> => {
  const provider = getStorageProvider();

  // Si está configurado Cloudflare
  if (provider === 'cloudflare') {
    try {
      const data = await callCloudflare({ action: 'getInventory' }, 'GET');
      if (data && data.inventory && Array.isArray(data.inventory)) {
        localStorage.setItem("ecoparque_inventory", JSON.stringify(data.inventory));
        return data.inventory;
      }
    } catch (err) {
      console.warn("Fallo sincronización con Cloudflare. Utilizando datos locales.");
    }
  }

  // Si está configurado Google Sheets (solo si el usuario lo seleccionó expresamente)
  if (provider === 'sheets') {
    try {
      const cloudData = await callGoogleScript({ action: 'getInventory' }, 'GET');
      if (cloudData && Array.isArray(cloudData)) {
        localStorage.setItem("ecoparque_inventory", JSON.stringify(cloudData));
        return cloudData;
      }
    } catch (err) {
      console.warn("Fallo conexión con Google Sheets. Utilizando datos locales.");
    }
  }

  // Fallback Local (rápido y garantizado)
  const stored = localStorage.getItem("ecoparque_inventory");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // JSON dañado
    }
  }

  const defaultInventory = getDefaultInventory();
  localStorage.setItem("ecoparque_inventory", JSON.stringify(defaultInventory));
  return defaultInventory;
};

// ====================================================================================
// FETCH TRANSACTIONS
// ====================================================================================

export const fetchTransactions = async (): Promise<Transaction[]> => {
  const provider = getStorageProvider();

  if (provider === 'cloudflare') {
    try {
      const data = await callCloudflare({ action: 'getTransactions' }, 'GET');
      if (data && data.transactions && Array.isArray(data.transactions)) {
        localStorage.setItem("ecoparque_transactions", JSON.stringify(data.transactions));
        return [...data.transactions].reverse();
      }
    } catch (err) {
      console.warn("Fallo al obtener transacciones de Cloudflare. Usando local.");
    }
  }

  if (provider === 'sheets') {
    try {
      const cloudData = await callGoogleScript({ action: 'getTransactions' }, 'GET');
      if (cloudData && Array.isArray(cloudData)) {
        localStorage.setItem("ecoparque_transactions", JSON.stringify(cloudData));
        return [...cloudData].reverse();
      }
    } catch (err) {
      console.warn("Fallo Google Sheets transacciones.");
    }
  }

  const stored = localStorage.getItem("ecoparque_transactions");
  if (stored) {
    try {
      const items = JSON.parse(stored);
      return [...items].reverse();
    } catch {
      // JSON dañado
    }
  }

  const defaultTransactions = getDefaultTransactions();
  localStorage.setItem("ecoparque_transactions", JSON.stringify(defaultTransactions));
  return [...defaultTransactions].reverse();
};

// ====================================================================================
// CREATE TOOL
// ====================================================================================

export const createTool = async (newToolData: Omit<Tool, 'id' | 'lastUpdated'>): Promise<Tool[]> => {
  const tempId = `T${Date.now().toString().slice(-4)}`; 
  const newTool: Tool = {
    ...newToolData,
    id: tempId,
    lastUpdated: new Date().toISOString()
  };

  const currentTools = await fetchInventory();
  currentTools.push(newTool);
  localStorage.setItem("ecoparque_inventory", JSON.stringify(currentTools));

  const provider = getStorageProvider();
  if (provider === 'cloudflare') {
    callCloudflare({ action: 'saveInventory', tools: currentTools }, 'POST').catch(() => {});
  } else if (provider === 'sheets') {
    callGoogleScript({ action: 'createTool', tool: newTool }, 'POST').catch(() => {});
  }

  return currentTools;
};

// ====================================================================================
// DELETE TOOL
// ====================================================================================

export const deleteTool = async (toolId: string): Promise<Tool[]> => {
  const currentTools = await fetchInventory();
  const updatedTools = currentTools.filter(t => t.id !== toolId);
  localStorage.setItem("ecoparque_inventory", JSON.stringify(updatedTools));

  const provider = getStorageProvider();
  if (provider === 'cloudflare') {
    callCloudflare({ action: 'saveInventory', tools: updatedTools }, 'POST').catch(() => {});
  } else if (provider === 'sheets') {
    callGoogleScript({ action: 'deleteTool', toolId }, 'POST').catch(() => {});
  }

  return updatedTools;
};

// ====================================================================================
// UPDATE TOOL (EDIT ALL FIELDS)
// ====================================================================================

export const updateTool = async (updatedToolData: Tool): Promise<Tool[]> => {
  const currentTools = await fetchInventory();
  const index = currentTools.findIndex(t => t.id === updatedToolData.id);
  
  const toolToSave: Tool = {
    ...updatedToolData,
    stock: Math.max(0, Number(updatedToolData.stock) || 0),
    minStock: Math.max(0, Number(updatedToolData.minStock) || 0),
    lastUpdated: new Date().toISOString()
  };

  if (index !== -1) {
    currentTools[index] = toolToSave;
  } else {
    currentTools.push(toolToSave);
  }

  localStorage.setItem("ecoparque_inventory", JSON.stringify(currentTools));

  const provider = getStorageProvider();
  if (provider === 'cloudflare') {
    callCloudflare({ action: 'saveInventory', tools: currentTools }, 'POST').catch(() => {});
  } else if (provider === 'sheets') {
    callGoogleScript({ action: 'createTool', tool: toolToSave }, 'POST').catch(() => {});
  }

  return currentTools;
};

// ====================================================================================
// CLEAR ALL INVENTORY (VACIAR LISTA COMPLETA)
// ====================================================================================

export const clearAllInventory = async (clearTransactions: boolean = false): Promise<{ tools: Tool[]; transactions?: Transaction[] }> => {
  const emptyTools: Tool[] = [];
  localStorage.setItem("ecoparque_inventory", JSON.stringify(emptyTools));

  let txs: Transaction[] | undefined = undefined;
  if (clearTransactions) {
    txs = [];
    localStorage.setItem("ecoparque_transactions", JSON.stringify([]));
  }

  const provider = getStorageProvider();
  if (provider === 'cloudflare') {
    callCloudflare({ action: 'saveInventory', tools: emptyTools }, 'POST').catch(() => {});
    if (clearTransactions) {
      callCloudflare({ action: 'saveTransactions', transactions: [] }, 'POST').catch(() => {});
    }
  }

  return { tools: emptyTools, transactions: txs };
};

// ====================================================================================
// UPDATE STOCK (TRANSACTION)
// ====================================================================================

export const updateStock = async (
  toolId: string, 
  quantity: number, 
  type: TransactionType, 
  agentId: string,
  systemUser: string
): Promise<Tool[]> => {
  
  const currentTools = await fetchInventory();
  const toolIdx = currentTools.findIndex(t => t.id === toolId);
  let toolName = 'Desconocido';
  
  if (toolIdx !== -1) {
    toolName = currentTools[toolIdx].name;
    const change = type === TransactionType.IN ? quantity : -quantity;
    currentTools[toolIdx].stock = Math.max(0, currentTools[toolIdx].stock + change);
    currentTools[toolIdx].lastUpdated = new Date().toISOString();
  }

  const newTransaction: Transaction = {
    id: Date.now().toString(),
    toolId,
    toolName,
    quantity,
    type,
    date: new Date().toISOString(),
    agentId,
    user: systemUser
  };

  localStorage.setItem("ecoparque_inventory", JSON.stringify(currentTools));

  const storedTxStr = localStorage.getItem("ecoparque_transactions");
  let storedTransactions: Transaction[] = [];
  if (storedTxStr) {
    try {
      storedTransactions = JSON.parse(storedTxStr);
    } catch {
      // Fallback
    }
  }
  storedTransactions.push(newTransaction);
  localStorage.setItem("ecoparque_transactions", JSON.stringify(storedTransactions));

  const provider = getStorageProvider();
  if (provider === 'cloudflare') {
    callCloudflare({
      action: 'saveInventory',
      tools: currentTools
    }, 'POST').catch(() => {});
    callCloudflare({
      action: 'saveTransactions',
      transactions: storedTransactions
    }, 'POST').catch(() => {});
  } else if (provider === 'sheets') {
    callGoogleScript({
      action: 'updateStock',
      toolId,
      quantity,
      type,
      tx: newTransaction
    }, 'POST').catch(() => {});
  }

  return currentTools;
};

// ====================================================================================
// IMPORT EXCEL / CSV
// ====================================================================================

export const saveImportedTools = async (
  importedTools: Omit<Tool, 'lastUpdated'>[],
  mode: 'append' | 'replace'
): Promise<Tool[]> => {
  let existingTools: Tool[] = [];
  if (mode === 'append') {
    existingTools = await fetchInventory();
  }

  const processedImported: Tool[] = importedTools.map((t, idx) => ({
    id: t.id && t.id.trim() ? t.id.trim() : `T${Date.now().toString().slice(-4)}${idx}`,
    name: t.name || 'Sin Nombre',
    category: t.category || 'General',
    stock: Number(t.stock) >= 0 ? Number(t.stock) : 0,
    location: t.location || 'Depósito Central',
    itemType: t.itemType || 'RETURNABLE',
    condition: t.condition || 'BUENO',
    minStock: Number(t.minStock) || 5,
    lastUpdated: new Date().toISOString()
  }));

  let finalTools: Tool[] = [];

  if (mode === 'replace') {
    finalTools = processedImported;
  } else {
    const toolMap = new Map<string, Tool>();
    existingTools.forEach(t => toolMap.set(t.id.toLowerCase(), t));

    processedImported.forEach(newTool => {
      const matchKey = newTool.id.toLowerCase();
      if (toolMap.has(matchKey)) {
        const existing = toolMap.get(matchKey)!;
        toolMap.set(matchKey, {
          ...existing,
          name: newTool.name || existing.name,
          category: newTool.category || existing.category,
          stock: newTool.stock,
          location: newTool.location || existing.location,
          itemType: newTool.itemType || existing.itemType,
          minStock: newTool.minStock ?? existing.minStock,
          lastUpdated: new Date().toISOString()
        });
      } else {
        toolMap.set(matchKey, newTool);
      }
    });

    finalTools = Array.from(toolMap.values());
  }

  localStorage.setItem("ecoparque_inventory", JSON.stringify(finalTools));

  const provider = getStorageProvider();
  if (provider === 'cloudflare') {
    callCloudflare({ action: 'saveInventory', tools: finalTools }, 'POST').catch(() => {});
  }

  return finalTools;
};

// ====================================================================================
// BACKUP & RESTAURACIÓN COMPLETA (JSON SNAPSHOT)
// ====================================================================================

export interface FullBackupData {
  appName: string;
  version: string;
  exportDate: string;
  toolsCount: number;
  transactionsCount: number;
  tools: Tool[];
  transactions: Transaction[];
}

export const exportDatabaseBackupJSON = async (): Promise<string> => {
  const tools = await fetchInventory();
  const txStored = localStorage.getItem("ecoparque_transactions");
  let transactions: Transaction[] = [];
  if (txStored) {
    try {
      transactions = JSON.parse(txStored);
    } catch {
      transactions = [];
    }
  }

  const backup: FullBackupData = {
    appName: "Ecoparque Quilmes - GIRSU Pañol",
    version: "2.0.0",
    exportDate: new Date().toISOString(),
    toolsCount: tools.length,
    transactionsCount: transactions.length,
    tools,
    transactions
  };

  return JSON.stringify(backup, null, 2);
};

export const importDatabaseBackupJSON = async (jsonString: string): Promise<{ success: boolean; message: string; tools: Tool[]; transactions: Transaction[] }> => {
  try {
    const data = JSON.parse(jsonString);
    if (!data || !Array.isArray(data.tools)) {
      return { success: false, message: "El archivo no contiene un formato de respaldo válido de Ecoparque.", tools: [], transactions: [] };
    }

    const importedTools: Tool[] = data.tools;
    const importedTransactions: Transaction[] = Array.isArray(data.transactions) ? data.transactions : [];

    localStorage.setItem("ecoparque_inventory", JSON.stringify(importedTools));
    localStorage.setItem("ecoparque_transactions", JSON.stringify(importedTransactions));

    const provider = getStorageProvider();
    if (provider === 'cloudflare') {
      callCloudflare({ action: 'saveInventory', tools: importedTools }, 'POST').catch(() => {});
      callCloudflare({ action: 'saveTransactions', transactions: importedTransactions }, 'POST').catch(() => {});
    }

    return {
      success: true,
      message: `Restauración exitosa: ${importedTools.length} artículos y ${importedTransactions.length} movimientos cargados.`,
      tools: importedTools,
      transactions: importedTransactions
    };
  } catch (err: any) {
    return { success: false, message: `Error al leer el archivo JSON: ${err?.message || 'formato inválido'}`, tools: [], transactions: [] };
  }
};

export const resetToDefaultData = async (): Promise<{ tools: Tool[]; transactions: Transaction[] }> => {
  const defaultTools = getDefaultInventory();
  const defaultTxs = getDefaultTransactions();
  localStorage.setItem("ecoparque_inventory", JSON.stringify(defaultTools));
  localStorage.setItem("ecoparque_transactions", JSON.stringify(defaultTxs));
  return { tools: defaultTools, transactions: defaultTxs };
};

// ====================================================================================
// TEST CONNECTION HELPERS
// ====================================================================================

export const testCloudflareConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const config = getCloudflareConfig();
    const res = await callCloudflare({ ping: true }, 'GET');
    if (res) {
      return { success: true, message: `Conexión con Cloudflare exitosa (${config.endpointUrl}).` };
    }
    return { success: false, message: 'La respuesta de Cloudflare fue vacía.' };
  } catch (err: any) {
    return { success: false, message: `No se pudo conectar con el endpoint de Cloudflare: ${err?.message || 'Error de red'}` };
  }
};

export const testGoogleSheetsConnection = async (): Promise<{ success: boolean; message: string; count?: number }> => {
  try {
    const data = await callGoogleScript({ action: 'getInventory' }, 'GET');
    if (data && Array.isArray(data)) {
      return { success: true, message: `Conexión exitosa. Se leyeron ${data.length} ítems desde Google Sheets.`, count: data.length };
    }
    return { success: false, message: 'La respuesta de Google Sheets no tiene el formato esperado.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'No se pudo establecer comunicación con Google Apps Script.' };
  }
};

export const getToolById = (id: string, tools: Tool[]): Tool | undefined => {
  return tools.find(t => t.id === id);
};
