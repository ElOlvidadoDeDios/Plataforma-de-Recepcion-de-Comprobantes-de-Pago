import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const API_BASE_URL = import.meta.env.VITE_LOGIN_API_BASE_URL;

// 🔇 Request silencioso usando XMLHttpRequest para evitar logs automáticos
const silentRequest = (url: string, method: string, body: string): Promise<{ok: boolean, status: number, json: () => Promise<any>}> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onload = () => {
      const response = {
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        json: async () => {
          try {
            return JSON.parse(xhr.responseText);
          } catch {
            return {};
          }
        }
      };
      resolve(response);
    };
    
    xhr.onerror = () => {
      reject(new Error('Network error'));
    };
    
    xhr.send(body);
  });
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated, initializeUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Validación de campos vacíos
    if (!email || !password) {
      setMessage('Todos los campos son obligatorios');
      setIsLoading(false);
      return;
    }

    try {
      const response = await silentRequest(
        `${API_BASE_URL}/login`,
        'POST',
        JSON.stringify({ email, password })
      );

      // 🔇 Manejo silencioso de errores - no mostrar en consola
      if (!response.ok) {
        try {
          const errorData = await response.json();
          setMessage(errorData.message || 'Error al iniciar sesión');
        } catch {
          // Si no se puede parsear la respuesta, mostrar mensaje genérico
          setMessage('Error al iniciar sesión');
        }
        return;
      }

      const data = await response.json();
      
      // Limpiar cualquier estado anterior
      localStorage.clear();
      localStorage.debug = '*';
      
      // Guardar token
      localStorage.setItem('token', data.token);
      
      // Usar los datos del usuario que vienen en la respuesta
      const userData = data.user;

      // Inicializar usuario usando la función del contexto
      setIsAuthenticated(true);
      initializeUser(userData);
      
      toast.success('Inicio de sesión exitoso');
      navigate('/', { replace: true });
    } catch (error) {
      // 🔇 NO mostrar errores en consola para evitar exposición
      setMessage('Error de conexión. Verifique su conexión a internet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-400 via-sky-400 to-blue-500">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl w-[90%] max-w-md border border-white/20 mx-4"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
            Iniciar Sesión
          </h2>
        </motion.div>

        <form onSubmit={handleLogin} className="space-y-6">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-gray-700 font-medium mb-2">Correo Electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm rounded-lg border border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 bg-white/50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ejemplo@correo.com"
              autoComplete="email"
            />
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-gray-700 font-medium mb-2">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-sm rounded-lg border border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 bg-white/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </motion.div>

          {message && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 rounded-lg bg-red-100 text-red-600 text-center"
            >
              {message}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 sm:py-3 text-base sm:text-sm rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-70"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Procesando...</span>
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </motion.button>
        </form>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 sm:mt-6 text-center"
        >
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 text-amber-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm font-medium">Sistema Interno</span>
            </div>
            <p className="text-xs text-amber-600 mt-2 leading-relaxed">
              Acceso exclusivo para personal autorizado. Si olvidó su contraseña o necesita una cuenta,
              contacte al administrador del sistema.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
