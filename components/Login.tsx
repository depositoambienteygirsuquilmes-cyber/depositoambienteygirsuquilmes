
import React, { useState } from 'react';
import { login } from '../services/authService';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lógica para login de admin (con contraseña)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const user = await login(username, password);
    if (user) {
      onLogin(user);
    } else {
      setError('Credenciales de administrador incorrectas');
      setLoading(false);
    }
  };

  // Lógica para login rápido de operario (sin contraseña)
  const handleOperatorQuickLogin = async () => {
      setLoading(true);
      // El servicio de auth ya sabe que 'operario' no requiere contraseña
      const user = await login('operario', '');
      if(user) {
          onLogin(user);
      } else {
          setError('Error al ingresar como operario');
          setLoading(false);
      }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header Logo */}
        <div className="text-center mb-8 animate-fade-in-up">
            <div className="w-20 h-20 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center shadow-xl mx-auto mb-4 transform rotate-3 hover:rotate-6 transition-transform">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">ECOPARQUE QUILMES</h1>
            <p className="text-slate-500 font-medium">Sistema de Gestión de Pañol GIRSU</p>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            
            {/* SECCIÓN OPERARIO - ACCESO RÁPIDO */}
            <div className="p-6 pb-8 border-b border-slate-100 bg-gradient-to-b from-white to-slate-50">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center mb-4">Acceso Operativo</h2>
                <button 
                    onClick={handleOperatorQuickLogin}
                    disabled={loading}
                    className="group w-full relative overflow-hidden bg-emerald-500 hover:bg-emerald-400 text-white p-6 rounded-2xl shadow-lg shadow-emerald-200 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4"
                >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <div className="bg-white/20 p-3 rounded-full">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div className="text-left">
                        <span className="block text-xl font-bold leading-none">Ingreso Rápido</span>
                        <span className="text-emerald-100 text-sm font-medium">Perfil Operario</span>
                    </div>
                    <svg className="w-6 h-6 ml-auto opacity-70 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>

            {/* SECCIÓN ADMIN - LOGIN FORMAL */}
            <div className="p-8 bg-white">
                 <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center mb-6">Acceso Administrativo</h2>
                 
                 <form onSubmit={handleAdminLogin} className="space-y-4">
                    {error && <div className="p-3 bg-rose-50 text-rose-600 text-sm font-bold rounded-xl text-center border border-rose-100 animate-fade-in">{error}</div>}
                    
                    <div className="space-y-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Usuario (admin)"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                            />
                        </div>
                        
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <input 
                                type="password" 
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl shadow-lg shadow-slate-200 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 mt-2"
                    >
                        {loading ? 'Validando...' : 'Ingresar como Admin'}
                    </button>
                </form>

                {/* Ayuda de credenciales */}
                <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 bg-slate-50 p-3.5 rounded-xl">
                  <p className="font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Credenciales del Sistema:
                  </p>
                  <ul className="list-disc pl-4 space-y-1.5 text-slate-500 leading-relaxed">
                    <li><strong>Operario:</strong> Haz clic en el botón verde de <strong>"Ingreso Rápido"</strong> (arriba), sin contraseña.</li>
                    <li><strong>Administrador:</strong> Usuario <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-700">admin</code> y Contraseña <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-700">admin123</code></li>
                  </ul>
                </div>
            </div>
        </div>
        
        <p className="text-center text-xs text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} Ecoparque Quilmes • GIRSU
        </p>

      </div>
    </div>
  );
};

export default Login;
