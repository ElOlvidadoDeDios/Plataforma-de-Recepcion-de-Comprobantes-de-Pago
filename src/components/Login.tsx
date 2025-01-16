import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
const API_BASE_URL = import.meta.env.VITE_LOGIN_API_BASE_URL;
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 404) {
        setMessage('Usuario no encontrado');
      } else if (response.status === 401) {
        setMessage('Credenciales incorrectas');
      } else if (response.ok) {
        const data = await response.json();
        // Limpiar cualquier estado anterior
        localStorage.clear();
        localStorage.debug = '*';
        // Establecer nuevos valores
        localStorage.setItem('token', data.token);
        localStorage.setItem('email', email);
        localStorage.setItem('dniFilter', '');
        // Al iniciar sesión correctamente
        localStorage.setItem('selectedStatus', 'pendiente');
        localStorage.setItem('user', JSON.stringify({ email }));
        setIsAuthenticated(true);
        setUser({ email });
        toast.success('Inicio de sesión exitoso');
        navigate('/', { replace: true });
      } else {
        setMessage('Datos incorrectos');
      }
    } catch (error) {
      setMessage('Error de conexión');
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
        className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-96 border border-white/20"
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
              type="email"
              className="w-full px-4 py-3 rounded-lg border border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 bg-white/50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ejemplo@correo.com"
            />
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-gray-700 font-medium mb-2">Contraseña</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 bg-white/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="password"
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
            className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-70"
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
          className="mt-6 text-center space-y-2"
        >
          <p className="text-gray-600">
            ¿No tienes una cuenta?{' '}
            <a
              href="/register"
              className="text-cyan-600 hover:text-cyan-700 font-medium hover:underline transition-colors"
            >
              Regístrate aquí
            </a>
          </p>
          <p className="text-gray-600">
            ¿Olvidaste tu contraseña?{' '}
            <a
              href="/forgot-password"
              className="text-cyan-600 hover:text-cyan-700 font-medium hover:underline transition-colors"
            >
              Recuperar contraseña
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
