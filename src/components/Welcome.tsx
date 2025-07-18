import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import Layout from './Layout';
import { usePermissions } from '../hooks/useAuth';

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const cometIntervalRef = useRef<NodeJS.Timeout>();

  // Measure container size correctly
  useEffect(() => {
    const measureContainer = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    const handleResize = () => {
      // Usar requestAnimationFrame para mejor rendimiento
      requestAnimationFrame(measureContainer);
    };

    // Observar cambios en el tamaño del contenedor
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', handleResize);
    
    // Medir inicialmente con un pequeño delay para asegurar que el layout esté listo
    setTimeout(measureContainer, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  // Enhanced comet animations - cometas cada 8 segundos con inicio inmediato
  useEffect(() => {
    if (!permissions.isBasicUser() && containerSize.width > 0 && containerSize.height > 0) {
      const startGalaxyAnimation = () => {
        clearInterval(cometIntervalRef.current);
        
        // Lanzar el primer cometa inmediatamente
        setTimeout(() => {
          controls.start('cometBurst');
        }, 1000);
        
        // Luego lanzar cometas cada 8 segundos
        cometIntervalRef.current = setInterval(() => {
          controls.start('cometBurst');
        }, 8000);
      };
      
      startGalaxyAnimation();
    }

    return () => {
      clearInterval(cometIntervalRef.current);
    };
  }, [permissions, controls, containerSize]);

  // Generate dynamic stars
  const generateDynamicStars = () => {
    return Array.from({ length: 120 }).map((_, i) => {
      const size = Math.random() * 3 + 1;
      const duration = Math.random() * 4 + 2;
      const delay = Math.random() * 5;
      
      return (
        <motion.div
          key={`star-${i}`}
          className="absolute bg-white rounded-full"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [0.8, 1.2, 0.8],
            boxShadow: [
              '0 0 0px rgba(255,255,255,0.5)',
              '0 0 20px rgba(255,255,255,0.8)',
              '0 0 0px rgba(255,255,255,0.5)'
            ]
          }}
          transition={{
            duration: duration,
            delay: delay,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      );
    });
  };

  // Basic user content with responsive design
  const BasicUserContent = () => (
    <div 
      ref={containerRef}
      className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center p-2 sm:p-4 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">{generateDynamicStars()}</div>
      
      {/* Floating geometric shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`geo-${i}`}
            className="absolute border-2 border-white/20"
            style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              borderRadius: Math.random() > 0.5 ? '50%' : '0%',
            }}
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        ))}
      </div>
      
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 w-full max-w-sm sm:max-w-md"
      >
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border border-white/30">
          <motion.div
            className="text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6"
            >
              🚀
            </motion.div>
            
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4">
              ¡Bienvenido a la Plataforma!
            </h2>
            
            <motion.div
              className="h-0.5 bg-gradient-to-r from-transparent via-white/60 to-transparent mb-3 sm:mb-4"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
            
            <p className="text-white/90 text-sm sm:text-base leading-relaxed">
              Actualmente tienes acceso básico al sistema. Para obtener acceso a más funcionalidades,
              por favor contacta al administrador del sistema.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );

  // Enhanced Galaxy Comet with explosion effect and DILE text
  const GalaxyComet = ({ index }: { index: number }) => {
    // Solo renderizar si tenemos las dimensiones del contenedor
    if (containerSize.width === 0 || containerSize.height === 0) {
      return null;
    }

    // Colores más variados y brillantes
    const cometColors = [
      'from-red-400 via-pink-300 to-transparent',
      'from-blue-400 via-cyan-300 to-transparent',
      'from-green-400 via-lime-300 to-transparent',
      'from-purple-400 via-violet-300 to-transparent',
      'from-yellow-400 via-orange-300 to-transparent',
      'from-pink-400 via-rose-300 to-transparent',
      'from-orange-400 via-amber-300 to-transparent',
      'from-cyan-400 via-teal-300 to-transparent',
      'from-emerald-400 via-green-300 to-transparent',
      'from-indigo-400 via-blue-300 to-transparent',
      'from-fuchsia-400 via-purple-300 to-transparent',
      'from-rose-400 via-pink-300 to-transparent',
      'from-lime-400 via-green-300 to-transparent',
      'from-sky-400 via-blue-300 to-transparent',
      'from-violet-400 via-purple-300 to-transparent',
      'from-amber-400 via-yellow-300 to-transparent',
    ];

    const randomColor = cometColors[Math.floor(Math.random() * cometColors.length)];

    // Usar las dimensiones EXACTAS medidas del contenedor Welcome
    const containerWidth = containerSize.width;
    const containerHeight = containerSize.height;
    // Calcular offset automático basado en el tamaño del contenedor (3% del tamaño)
    const offsetX = containerWidth ;  // 3% del ancho como offset
    const offsetY = containerHeight ; // 3% del alto como offset
    
    // ESQUINAS EXACTAS basadas en las dimensiones reales
    const corners = [
      { x: 0, y: 0, name: "Superior-Izquierda" },
      { x: containerWidth, y: 0, name: "Superior-Derecha" },
      { x: containerWidth, y: containerHeight, name: "Inferior-Derecha" },
      { x: 0, y: containerHeight, name: "Inferior-Izquierda" }
    ];

    // Cada cometa usa una esquina específica (NO ALEATORIA)
    const cornerIndex = index % corners.length;
    const corner = corners[cornerIndex];
    
    // Posición inicial: Automática con offset calculado
    const startX = corner.x === 0 ? -offsetX : corner.x + offsetX;
    const startY = corner.y === 0 ? -offsetY : corner.y + offsetY;

    // Explosión: CENTRO exacto del contenedor medido
    const endX = containerWidth / 2;
    const endY = containerHeight / 2;

    // Duración para el movimiento
    const travelDuration = 6 + Math.random() * 2;
    const delay = Math.random() * 0.5;

    return (
      <motion.div
        key={`galaxy-comet-${index}-${Date.now()}`}
        variants={{
          cometBurst: {
            x: [startX, endX],
            y: [startY, endY],
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1, 1, 0],
            transition: {
              duration: travelDuration,
              delay: delay,
              ease: 'easeInOut',
            },
          },
        }}
        initial={{ x: startX, y: startY, opacity: 0, scale: 0.5 }}
        animate={controls}
        className="absolute pointer-events-none z-[9999]"
      >
        <div className="relative">
          {/* Cola del cometa */}
          <motion.div
            className={`w-40 sm:w-48 md:w-64 h-4 bg-gradient-to-r ${randomColor} rounded-full shadow-2xl`}
            animate={{
              width: [40, 64, 40],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Núcleo del cometa */}
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-8 sm:w-10 h-8 sm:h-10 bg-white rounded-full shadow-xl shadow-white/80">
            <div className="absolute inset-0 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Explosión mejorada tipo cohete */}
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0, 1, 1, 1, 0],
            scale: [0, 0, 3, 5, 7, 0],
          }}
          transition={{
            duration: travelDuration,
            delay: delay,
            times: [0, 0.6, 0.7, 0.8, 0.9, 1],
            ease: 'easeOut',
          }}
        >
          <div className="relative">
            {/* Círculo principal de explosión */}
            <motion.div
              className="absolute inset-0 w-48 h-48 bg-gradient-to-r from-white via-yellow-400 to-orange-500 rounded-full blur-2xl"
              animate={{
                scale: [0, 4, 6],
                opacity: [1, 0.8, 0],
              }}
              transition={{
                duration: 2,
                delay: travelDuration * 0.7 + delay,
                ease: 'easeOut',
              }}
            />

            {/* Círculo secundario para brillo */}
            <motion.div
              className="absolute inset-0 w-36 h-36 bg-white rounded-full blur-xl"
              animate={{
                scale: [0, 3, 5],
                opacity: [1, 0.6, 0],
              }}
              transition={{
                duration: 1.8,
                delay: travelDuration * 0.7 + delay,
                ease: 'easeOut',
              }}
            />

            {/* Círculo terciario para destello */}
            <motion.div
              className="absolute inset-0 w-24 h-24 bg-yellow-200 rounded-full blur-lg"
              animate={{
                scale: [0, 2, 4],
                opacity: [1, 0.4, 0],
              }}
              transition={{
                duration: 1.5,
                delay: travelDuration * 0.7 + delay,
                ease: 'easeOut',
              }}
            />

            {/* Partículas de explosión */}
            {Array.from({ length: 16 }).map((_, i) => {
              const particleSize = Math.random() * 8 + 6;
              const angle = (i * 360) / 16 * Math.PI / 180;
              const distance = 100 + Math.random() * 80;
              
              return (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute bg-yellow-100 rounded-full shadow-md"
                  style={{
                    width: `${particleSize}px`,
                    height: `${particleSize}px`,
                    left: '50%',
                    top: '50%',
                  }}
                  animate={{
                    x: [0, Math.cos(angle) * distance],
                    y: [0, Math.sin(angle) * distance],
                    opacity: [1, 0.7, 0],
                    scale: [1, 1.5, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    delay: travelDuration * 0.7 + delay,
                    ease: 'easeOut',
                  }}
                />
              );
            })}

            {/* Texto DILE */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                opacity: [0, 1, 1, 1, 0],
                scale: [0, 1.5, 2, 2.5, 0],
                rotate: [0, 5, -5, 0, 0],
              }}
              transition={{
                duration: 3,
                delay: travelDuration * 0.7 + delay,
                ease: 'easeOut',
              }}
            >
              <span className="text-white font-extrabold text-3xl sm:text-4xl md:text-6xl drop-shadow-2xl">
                DILE
              </span>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Morphing card component
  const MorphingCard = ({
    title,
    description,
    onClick,
    icon,
    index,
    colorFrom,
    colorTo,
  }: {
    title: string;
    description: string;
    onClick: () => void;
    icon: React.ReactNode;
    index: number;
    colorFrom: string;
    colorTo: string;
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 50, rotateX: -90 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{
          duration: 0.6,
          delay: index * 0.1,
          type: 'spring',
          stiffness: 100,
        }}
        className="w-full h-full perspective-1000"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        <motion.div
          className="relative w-full h-full cursor-pointer transform-gpu"
          whileHover={{ 
            scale: 1.05,
            rotateY: 10,
            rotateX: 5,
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <div className={`relative w-full h-full min-h-[140px] sm:min-h-[160px] md:min-h-[180px] bg-gradient-to-br ${colorFrom} ${colorTo} rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-xl overflow-hidden`}>
            
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/30 to-transparent"></div>
              <motion.div
                className="absolute -top-4 -right-4 w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-white/20"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            
            {/* Glowing border effect */}
            <motion.div
              className="absolute inset-0 rounded-xl sm:rounded-2xl"
              animate={{
                boxShadow: isHovered 
                  ? ['0 0 0px rgba(255,255,255,0.5)', '0 0 30px rgba(255,255,255,0.8)', '0 0 0px rgba(255,255,255,0.5)']
                  : '0 0 0px rgba(255,255,255,0)'
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center">
              <motion.div
                animate={{
                  scale: isHovered ? [1, 1.2, 1] : 1,
                  rotate: isHovered ? [0, 360] : 0,
                }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                className="text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-3 filter drop-shadow-lg"
              >
                {icon}
              </motion.div>
              
              <h3 className="font-extrabold text-white text-sm sm:text-base md:text-lg mb-2 sm:mb-3 leading-tight px-1 drop-shadow-lg">
                {title}
              </h3>
              
              <motion.div
                className="h-1 bg-white/80 mb-2 sm:mb-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: isHovered ? '90%' : '50%' }}
                transition={{ duration: 0.3 }}
              />
              
              <p className="text-white/95 text-xs sm:text-sm md:text-base leading-relaxed px-1 font-medium drop-shadow-md">
                {description}
              </p>
            </div>
            
            {/* Hover glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl sm:rounded-2xl"
              animate={{
                opacity: isHovered ? [0, 0.3, 0] : 0,
              }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Privileged user content with responsive grid
  const PrivilegedUserContent = () => {
    const availableOptions = [];
    if (permissions.canAccessPayments()) {
      availableOptions.push({
        title: 'Ver Pagos',
        description: 'Gestiona los pagos de los clientes',
        onClick: () => navigate('/payments'),
        icon: '💰',
        colorFrom: 'from-teal-500',
        colorTo: 'to-blue-600',
      });
    }
    if (permissions.canAccessCredits()) {
      availableOptions.push({
        title: 'Solicitudes de Crédito',
        description: 'Revisa y aprueba solicitudes de crédito',
        onClick: () => navigate('/credit-requests'),
        icon: '📝',
        colorFrom: 'from-teal-500',
        colorTo: 'to-blue-600',
      });
    }
    if (permissions.canAccessBotInteractions()) {
      availableOptions.push({
        title: 'Interacciones del Bot',
        description: 'Analiza las interacciones con el bot',
        onClick: () => navigate('/bot-interactions'),
        icon: '🤖',
        colorFrom: 'from-teal-500',
        colorTo: 'to-blue-600',
      });
    }
    if (permissions.canAccessConsultaCuotas()) {
      availableOptions.push({
        title: 'Consulta de Cuotas',
        description: 'Revisa el estado de las cuotas',
        onClick: () => navigate('/consultas-cuotas'),
        icon: '📊',
        colorFrom: 'from-teal-500',
        colorTo: 'to-blue-600',
      });
    }
    if (!permissions.isBasicUser()) {
      availableOptions.push({
        title: 'Consultar socios',
        description: 'Gestiona tu base de clientes',
        onClick: () => navigate('/consulta-clientes'),
        icon: '👥',
        colorFrom: 'from-teal-500',
        colorTo: 'to-blue-600',
      });
    }
    if (permissions.canManageUsers()) {
      availableOptions.push({
        title: 'Gestión de Usuarios',
        description: 'Administra los usuarios del sistema',
        onClick: () => navigate('/user-management'),
        icon: '👤',
        colorFrom: 'from-teal-500',
        colorTo: 'to-blue-600',
      });
    }
    if (permissions.canAccessGestionMora()) {
      availableOptions.push({
        title: 'Gestión de Mora',
        description: 'Gestiona clientes en mora y seguimiento',
        onClick: () => navigate('/gestion-mora'),
        icon: '📋',
        colorFrom: 'from-teal-500',
        colorTo: 'to-blue-600',
      });
    }
    if (permissions.canAccessPendientesDesembolsar()) {
      availableOptions.push({
        title: 'Pendientes a Desembolsar',
        description: 'Gestiona créditos pendientes de desembolso',
        onClick: () => navigate('/pendientes-desembolsar'),
        icon: '💳',
        colorFrom: 'from-teal-500',
        colorTo: 'to-blue-600',
      });
    }

    return (
      <div
        ref={containerRef}
        className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-500 overflow-x-hidden lg:overflow-hidden lg:flex lg:flex-col lg:items-center lg:justify-center overflow-y-auto"
      >
        <div className="min-h-full flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 lg:min-h-0 lg:h-full" style={{ minHeight: window.innerWidth >= 1024 ? 'auto' : 'max(100vh, 800px)' }}>
          <div className="absolute inset-0 pointer-events-none">{generateDynamicStars()}</div>
          
          {/* Floating nebula effects */}
          <div className="absolute inset-0 overflow-hidden opacity-20">
            <div className="absolute top-1/4 left-1/4 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-cyan-400 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/3 right-1/3 w-40 sm:w-56 md:w-72 h-40 sm:h-56 md:h-72 bg-blue-400 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
            <div className="absolute top-1/2 right-1/4 w-24 sm:w-32 md:w-48 h-24 sm:h-32 md:h-48 bg-cyan-300 rounded-full mix-blend-screen filter blur-2xl animate-pulse"></div>
          </div>
          
          {/* Enhanced Galaxy Comets */}
          {Array.from({ length: 3 }).map((_, i) => (
            <GalaxyComet key={`galaxy-comet-${i}`} index={i} />
          ))}
          
          {/* Responsive grid */}
          <div className="relative z-10 w-full max-w-6xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {availableOptions.map((option, index) => (
                <MorphingCard
                  key={`${option.title}-${index}`}
                  title={option.title}
                  description={option.description}
                  onClick={option.onClick}
                  icon={option.icon}
                  index={index}
                  colorFrom={option.colorFrom}
                  colorTo={option.colorTo}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout title="Bienvenido a la Plataforma DILE" showBackButton={false}>
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .transform-gpu {
          transform-style: preserve-3d;
        }
        
        .backdrop-blur-lg {
          backdrop-filter: blur(16px);
        }
        
        .mix-blend-screen {
          mix-blend-mode: screen;
        }
        
        .filter {
          filter: var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow);
        }
        
        .blur-2xl {
          --tw-blur: blur(40px);
        }
        
        .blur-3xl {
          --tw-blur: blur(64px);
        }
        
        .blur-xl {
          --tw-blur: blur(24px);
        }
        
        .blur-lg {
          --tw-blur: blur(16px);
        }
        
        .drop-shadow-lg {
          --tw-drop-shadow: drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1));
        }
        
        .drop-shadow-2xl {
          --tw-drop-shadow: drop-shadow(0 25px 25px rgb(0 0 0 / 0.15));
        }
        
        @media (max-width: 640px) {
          .perspective-1000 {
            perspective: 500px;
          }
        }
      `}</style>
      
      {permissions.isBasicUser() ? <BasicUserContent /> : <PrivilegedUserContent />}
    </Layout>
  );
};

export default Welcome;