
export type UserRole = 'ADMIN' | 'OPERATOR';

export interface User {
  username: string;
  name: string;
  role: UserRole;
}

export type ItemType = 'RETURNABLE' | 'CONSUMABLE';
export type ToolCondition = 'BUENO' | 'REGULAR' | 'REPARACION';

export interface Tool {
  id: string;
  name: string;
  category: string;
  stock: number;
  location: string;
  description?: string;
  itemType?: ItemType; // RETURNABLE (Herramienta/Devolución) vs CONSUMABLE (Insumo/Descartable)
  condition?: ToolCondition;
  minStock?: number;
  lastUpdated: string;
}

export enum TransactionType {
  IN = 'INGRESO',
  OUT = 'EGRESO'
}

export interface Transaction {
  id: string;
  toolId: string;
  toolName: string;
  quantity: number;
  type: TransactionType;
  date: string;
  user?: string;     // Usuario del sistema que hizo la accion
  agentId?: string;  // Legajo del empleado que retira/devuelve
}

export type InventoryContext = {
  tools: Tool[];
  transactions: Transaction[];
};
