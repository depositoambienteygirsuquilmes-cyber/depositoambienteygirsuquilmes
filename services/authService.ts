
import { User } from '../types';

// Mock users database
const MOCK_USERS = [
  { username: 'admin', password: 'admin123', name: 'Administrador Pañol', role: 'ADMIN' },
  { username: 'operario', password: '', name: 'Operario Turno Mañana', role: 'OPERATOR' },
];

export const login = async (username: string, password: string): Promise<User | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Find user
  const user = MOCK_USERS.find(u => u.username === username);

  // Validate: 
  // 1. User must exist
  // 2. If user has a password in DB, input must match
  // 3. If user has NO password in DB (empty), allow access immediately
  if (user) {
    if (user.password === '' || user.password === password) {
        const userData: User = { username: user.username, name: user.name, role: user.role as any };
        localStorage.setItem('ecoparque_user', JSON.stringify(userData));
        return userData;
    }
  }
  return null;
};

export const logout = () => {
  localStorage.removeItem('ecoparque_user');
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem('ecoparque_user');
  if (stored) return JSON.parse(stored);
  return null;
};
