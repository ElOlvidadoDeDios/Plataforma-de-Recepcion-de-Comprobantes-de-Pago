import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEmail } from './EmailContext'; // Importa el contexto
const API_BASE_URL = import.meta.env.VITE_LOGIN_API_BASE_URL;

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { setEmail: setGlobalEmail } = useEmail(); // Usa el contexto

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Validación de campos vacíos
    if (!email) {
      setMessage('El campo de correo electrónico es obligatorio');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Código de recuperación enviado al correo.');
        setGlobalEmail(email); // Guarda el email en el contexto
        setTimeout(() => {
          navigate('/reset-password');
        }, 2000);
      } else {
        setMessage(data.message || 'Error al enviar el código de recuperación');
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
            Recuperar Contraseña
          </h2>
        </motion.div>

        <form onSubmit={handleForgotPassword} className="space-y-6">
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

          {message && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-3 rounded-lg ${
                message.includes('enviado') ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              } text-center`}
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
              'Enviar Código'
            )}
          </motion.button>
        </form>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
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

export default ForgotPassword;
