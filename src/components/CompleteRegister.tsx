import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
const API_BASE_URL = import.meta.env.VITE_LOGIN_API_BASE_URL;

const CompleteRegister = () => {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dni, setLastdni] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = location.state || {};

  useEffect(() => {
    if (!token) {
      setMessage('Token no válido.');
    }
  }, [token]);

  const handleCompleteRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!token) {
      setMessage('Token no válido.');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setMessage('La contraseña debe tener al menos 8 caracteres.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, name, lastName,dni, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Registro exitoso');
        navigate('/login');
      } else {
        setMessage(data.errors ? data.errors.map((err: { msg: string }) => err.msg).join(', ') : 'Error al completar el registro');
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
            Completar Registro
          </h2>
        </motion.div>

        <form onSubmit={handleCompleteRegister} className="space-y-6">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-gray-700 font-medium mb-2">Nombre</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 bg-white/50"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Tu nombre"
            />
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-gray-700 font-medium mb-2">Apellido</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 bg-white/50"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Tu apellido"
            />
          </motion.div>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-gray-700 font-medium mb-2">DNI</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 bg-white/50"
              value={dni}
              onChange={(e) => setLastdni(e.target.value)}
              required
              placeholder="tu dni"
            />
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-gray-700 font-medium mb-2">Contraseña</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 bg-white/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <label className="block text-gray-700 font-medium mb-2">Confirmar Contraseña</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 bg-white/50"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirma tu contraseña"
              autoComplete="new-password"
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
              'Completar Registro'
            )}
          </motion.button>
        </form>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <a
              href="/login"
              className="text-cyan-600 hover:text-cyan-700 font-medium hover:underline transition-colors"
            >
              Inicia sesión aquí
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CompleteRegister;