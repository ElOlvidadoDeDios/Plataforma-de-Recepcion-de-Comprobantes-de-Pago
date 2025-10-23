// src/UserInfo.tsx
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const UserInfo = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const email = user?.email || '';

  // Función para navegar al perfil
  const handleProfileClick = () => {
    navigate('/perfil-usuario');
  };

  // Animación 3D (opcional, mantenida pero simplificada)
  const flipAnimation = {
    rotateY: [0, 360],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
      repeatDelay: 5,
    },
  };

  return (
    <div className="flex items-center space-x-2">
      <motion.button
        onClick={handleProfileClick}
        className="flex items-center bg-white/10 hover:bg-white/20 rounded-full py-1 px-2 transition-all duration-200 cursor-pointer group"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{ perspective: 1000 }}
        title="Ver perfil de usuario"
      >
        <motion.div
          className="w-7 h-7 bg-white rounded-full flex items-center justify-center group-hover:bg-blue-50 transition-colors"
          animate={flipAnimation}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <span className="text-blue-500 font-semibold group-hover:text-blue-600 transition-colors">
            {email[0]?.toUpperCase()}
          </span>
        </motion.div>
        {/* Correo visible en todas las pantallas */}
        <span className="text-white text-xs sm:text-sm ml-2 truncate max-w-[100px] sm:max-w-[150px] group-hover:text-blue-100 transition-colors">
          {email}
        </span>
      </motion.button>
    </div>
  );
};

export default UserInfo;
