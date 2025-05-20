import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/roles';

const API_BASE_URL = import.meta.env.VITE_LOGIN_API_BASE_URL;

const CompleteRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { initializeUser } = useAuth();
  
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = location.state?.token;
    const email = location.state?.email;
    
    if (!token || !email) {
      toast.error('Información de registro incompleta. Por favor, inicia el proceso nuevamente.');
      navigate('/register', { replace: true });
    }
  }, [location.state, navigate]);

  const handleCompleteRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const token = location.state?.token;
      const email = location.state?.email;

      if (!token || !email) {
        toast.error('Información de registro incompleta. Por favor, inicia el proceso nuevamente.');
        navigate('/register', { replace: true });
        return;
      }

      if (!name || !lastName || !dni || !password || !confirmPassword) {
        setMessage('Todos los campos son obligatorios');
        return;
      }

      if (dni.length !== 8) {
        setMessage('El DNI debe tener 8 dígitos');
        return;
      }

      if (password.length < 8) {
        setMessage('La contraseña debe tener al menos 8 caracteres');
        return;
      }

      if (password !== confirmPassword) {
        setMessage('Las contraseñas no coinciden');
        return;
      }

      console.log('Iniciando registro con los datos:', {
        token: token.substring(0, 20) + '...',
        email,
        name,
        lastName,
        dni,
        passwordLength: password.length
      });

      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          name: name.trim(),
          lastName: lastName.trim(),
          dni: dni.trim(),
          password
        })
      });

      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (response.ok) {
        initializeUser({
          id: data.id || '',
          email: email,
          name: `${name} ${lastName}`,
          dni: dni,
          role: UserRole.BASIC_USER,
          status: 0, // CREATED - Usuario nuevo sin permisos hasta que un admin lo active
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        toast.success('Registro completado con éxito');
        navigate('/login', { replace: true });
      } else {
        if (data.message === 'El usuario ya está verificado.') {
          toast.error('Este usuario ya completó su registro. Por favor, inicia sesión.');
          navigate('/login', { replace: true });
          return;
        }

        const errorMessage = data.errors 
          ? data.errors.map((err: { msg: string }) => err.msg).join(', ')
          : data.message || 'Error al completar el registro';
        setMessage(errorMessage);
        console.error('Error en el registro:', data);
      }
    } catch (error) {
      console.error('Error en el registro:', error);
      setMessage('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!location.state?.token || !location.state?.email) {
    return null;
  }

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
          <p className="text-center text-gray-600 mb-6">
            {location.state?.email}
          </p>
        </motion.div>

        <form onSubmit={handleCompleteRegister} className="space-y-6">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-gray-700 font-medium mb-2">Nombre</label>
            <input
              id="register-name"
              name="name"
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 bg-white/50"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Tu nombre"
              autoComplete="given-name"
            />
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-gray-700 font-medium mb-2">Apellido</label>
            <input
              id="register-lastname"
              name="lastname"
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 bg-white/50"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Tu apellido"
              autoComplete="family-name"
            />
          </motion.div>
          
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-gray-700 font-medium mb-2">DNI</label>
            <input
              id="register-dni"
              name="dni"
              type="text"
              className="w-full px-4 py-3 rounded-lg border border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 bg-white/50"
              value={dni}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value.length <= 8) setDni(value);
              }}
              required
              placeholder="Tu DNI (8 dígitos)"
              maxLength={8}
              pattern="\d{8}"
            />
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-gray-700 font-medium mb-2">Contraseña</label>
            <input
              id="register-password"
              name="password"
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 bg-white/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              minLength={8}
            />
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <label className="block text-gray-700 font-medium mb-2">Confirmar Contraseña</label>
            <input
              id="register-confirm-password"
              name="confirm-password"
              type="password"
              className="w-full px-4 py-3 rounded-lg border border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all duration-200 bg-white/50"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirma tu contraseña"
              autoComplete="new-password"
              minLength={8}
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
