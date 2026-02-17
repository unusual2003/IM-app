
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [role, setRole] = useState<'admin' | 'vendedor' | 'gerente'>('vendedor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nombre,
              role
            }
          }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // We can't immediately login if email confirmation is enabled, but for now let's assume it's disabled or we just notify.
          // However, if we want to auto-login, we might need to handle the session.
          if (data.session) {
            // onLogin will be handled by the auth state listener in App or useAuth
          } else {
            setError('Registro exitoso. Por favor verifica tu email si es necesario.');
          }
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;
        if (data.user) {
          // onLogin handled by parent/hook
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background-dark p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-primary/20">
            <span className="material-icons text-3xl">tire_repair</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">IM App</h1>
          <p className="text-slate-500 mt-2">Sistema de Importación y Gestión</p>
        </div>

        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8">
          <h2 className="text-xl font-bold mb-6 text-slate-800 dark:text-white text-center">
            {isRegistering ? 'Crear cuenta' : 'Iniciar sesión'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Juan Perez"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Rol</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary transition-all"
                  >
                    <option value="admin">Administrador</option>
                    <option value="vendedor">Vendedor</option>
                    <option value="gerente">Gerente</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="usuario@imapp.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] mt-2 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : (isRegistering ? 'Registrarse' : 'Entrar')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500">
              {isRegistering ? '¿Ya tienes cuenta?' : "¿No tienes cuenta?"}
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="ml-2 text-primary font-bold hover:underline"
              >
                {isRegistering ? 'Inicia Sesión' : 'Regístrate'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
