import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePermissions } from '../hooks/useAuth';
import Layout from './Layout';

const isMobile = () => window.innerWidth <= 768;
const isTablet = () => window.innerWidth > 768 && window.innerWidth <= 1024;
const isSmallDesktop = () => window.innerWidth > 1024 && window.innerWidth <= 1280;

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Estado para forzar re-render cuando cambie el tamaño de pantalla
  const [, setWindowSize] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  
  // Detectar cambios de tamaño de pantalla
  React.useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Comet and stars animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const stars = Array.from({ length: isMobile() ? 100 : 200 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.4,
    }));

    let comet = {
      x: -20,
      y: Math.random() * window.innerHeight * 0.5,
      vx: 8,
      vy: Math.random() * 2 - 1,
      active: true,
      explode: false,
      explodeTime: 0,
      explodeScale: 0,
      particles: [] as Array<{x: number, y: number, vx: number, vy: number, color: string, life: number}>,
    };

    const resetComet = () => {
      comet = {
        x: -20,
        y: Math.random() * window.innerHeight * 0.5,
        vx: 8,
        vy: Math.random() * 2 - 1,
        active: true,
        explode: false,
        explodeTime: 0,
        explodeScale: 0,
        particles: [],
      };
    };

    const createExplosionParticles = (x: number, y: number) => {
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#FFD700', '#FFA500'];
      for (let i = 0; i < 30; i++) {
        comet.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1.2,
        });
      }
    };

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw stars with glow
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 5;
        ctx.fill();
      });
      ctx.shadowBlur = 0; // Reset shadow

      // Animate comet
      if (comet.active) {
        comet.x += comet.vx;
        comet.y += comet.vy;

        // Draw comet
        ctx.beginPath();
        ctx.arc(comet.x, comet.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 200, 100, 1)';
        ctx.shadowColor = 'rgba(255, 200, 100, 0.8)';
        ctx.shadowBlur = 10;
        ctx.fill();

        // Draw comet tail
        const gradient = ctx.createLinearGradient(
          comet.x,
          comet.y,
          comet.x - comet.vx * 15,
          comet.y - comet.vy * 15
        );
        gradient.addColorStop(0, 'rgba(255, 200, 100, 1)');
        gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
        ctx.beginPath();
        ctx.moveTo(comet.x, comet.y);
        ctx.lineTo(comet.x - comet.vx * 15, comet.y - comet.vy * 15);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Trigger explosion
        if (comet.x > canvas.width * 0.3 && Math.random() < 0.02) {
          comet.explode = true;
          comet.active = false;
          comet.explodeTime = Date.now();
          createExplosionParticles(comet.x, comet.y);
        }

        // Keep comet in bounds
        if (comet.x > canvas.width || comet.y > canvas.height || comet.y < 0) {
          resetComet();
        }
      }

      // Draw explosion with particles and text "DILE"
      if (comet.explode) {
        const elapsed = (Date.now() - comet.explodeTime) / 1000;
        comet.explodeScale = Math.min(elapsed * 3, 1.5);
        const opacity = Math.max(1 - elapsed / 2.5, 0);

        // Update and draw particles
        comet.particles.forEach((particle, ) => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.2;
          particle.life -= 0.015;

          if (particle.life > 0) {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = particle.color + Math.floor(particle.life * 255).toString(16).padStart(2, '0');
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 8;
            ctx.fill();
          }
        });

        // Remove dead particles
        comet.particles = comet.particles.filter(p => p.life > 0);

        // Draw explosion text "DILE" con colores dorado/amarillo
        ctx.save();
        ctx.translate(comet.x, comet.y);
        ctx.scale(comet.explodeScale, comet.explodeScale);
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        
        // Sombra exterior dorada
        ctx.shadowColor = 'rgba(255, 215, 0, 0.9)';
        ctx.shadowBlur = 25;
        ctx.strokeStyle = `rgba(255, 140, 0, ${opacity})`;
        ctx.lineWidth = 4;
        ctx.strokeText('DILE', 0, 0);
        
        // Texto principal dorado brillante
        const gradient = ctx.createLinearGradient(0, -30, 0, 30);
        gradient.addColorStop(0, `rgba(255, 223, 0, ${opacity})`); // Amarillo dorado claro
        gradient.addColorStop(0.5, `rgba(255, 215, 0, ${opacity})`); // Dorado
        gradient.addColorStop(1, `rgba(255, 165, 0, ${opacity})`); // Naranja dorado
        ctx.fillStyle = gradient;
        ctx.fillText('DILE', 0, 0);
        
        ctx.restore();

        // Trigger vibration effect on cards
        if (elapsed < 0.5) {
          const cards = document.querySelectorAll('[data-card]');
          cards.forEach(card => {
            if (!card.classList.contains('animate-shake')) {
              card.classList.add('animate-shake');
              setTimeout(() => {
                card.classList.remove('animate-shake');
              }, 500);
            }
          });
        }

        // Reset comet after 2.5 seconds
        if (elapsed > 2.5) {
          resetComet();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars.forEach((star) => {
        star.x = Math.random() * canvas.width;
        star.y = Math.random() * canvas.height;
      });
      resetComet();
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Tarjeta reutilizable optimizada
  const Card = ({
    title,
    description,
    onClick,
    icon,
    index,
  }: {
    title: string;
    description: string;
    onClick: () => void;
    icon: React.ReactNode;
    index: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="w-full"
      onClick={onClick}
    >
      <div className={`relative w-full bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 flex flex-col ${
        isMobile()
          ? 'p-3 min-h-[300px]'
          : isTablet()
          ? 'p-4 min-h-[160px]'
          : isSmallDesktop()
          ? 'p-5 min-h-[180px]'
          : 'p-6 lg:p-8 min-h-[200px] lg:min-h-[220px] xl:min-h-[240px]'
      }`}
      data-card
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className={`mb-2 ${
            isMobile()
              ? 'text-xl'
              : isTablet()
              ? 'text-2xl'
              : isSmallDesktop()
              ? 'text-3xl'
              : 'text-4xl lg:text-5xl xl:text-6xl'
          }`}>{icon}</div>
          <h3 className={`font-bold text-white mb-2 leading-tight px-1 ${
            isMobile()
              ? 'text-xs'
              : isTablet()
              ? 'text-sm'
              : isSmallDesktop()
              ? 'text-base'
              : 'text-lg lg:text-xl xl:text-2xl'
          }`}>{title}</h3>
          <div className="h-0.5 bg-white/60 mb-2 rounded-full w-full max-w-[80%]" />
          <p className={`text-white/90 leading-relaxed px-1 flex-1 ${
            isMobile()
              ? 'text-xs line-clamp-2'
              : isTablet()
              ? 'text-xs line-clamp-3'
              : isSmallDesktop()
              ? 'text-sm line-clamp-3'
              : 'text-sm lg:text-base xl:text-lg line-clamp-4'
          }`}>{description}</p>
        </div>
      </div>
    </motion.div>
  );

  // Contenido para usuarios con privilegios
  const PrivilegedUserContent = () => {
    const availableOptions = [
      ...(permissions.canAccessPayments()
        ? [{
            title: 'Ver Pagos',
            description: 'Gestiona los pagos de los clientes',
            onClick: () => navigate('/payments'),
            icon: '💰',
          }]
        : []),
      ...(permissions.canAccessCredits()
        ? [{
            title: 'Solicitudes de Crédito',
            description: 'Revisa y aprueba solicitudes de crédito',
            onClick: () => navigate('/credit-requests'),
            icon: '📝',
          }]
        : []),
      ...(permissions.canAccessBotInteractions()
        ? [{
            title: 'Interacciones del Bot',
            description: 'Analiza las interacciones con el bot',
            onClick: () => navigate('/bot-interactions'),
            icon: '🤖',
          }]
        : []),
      ...(permissions.canAccessConsultaCuotas()
        ? [{
            title: 'Consulta de Cuotas',
            description: 'Revisa el estado de las cuotas',
            onClick: () => navigate('/consultas-cuotas'),
            icon: '📊',
          }]
        : []),
      ...(!permissions.isBasicUser()
        ? [{
            title: 'Consultar socios',
            description: 'Gestiona tu base de clientes',
            onClick: () => navigate('/consulta-clientes'),
            icon: '👥',
          }]
        : []),
      ...(permissions.canManageUsers()
        ? [{
            title: 'Gestión de Usuarios',
            description: 'Administra los usuarios del sistema',
            onClick: () => navigate('/user-management'),
            icon: '👤',
          }]
        : []),
      ...(permissions.canAccessGestionMora()
        ? [{
            title: 'Gestión de Mora',
            description: 'Gestiona clientes en mora y seguimiento',
            onClick: () => navigate('/gestion-mora'),
            icon: '📋',
          }]
        : []),
      ...(permissions.canAccessPendientesDesembolsar()
        ? [{
            title: 'Pendientes a Desembolsar',
            description: 'Gestiona créditos pendientes de desembolso',
            onClick: () => navigate('/pendientes-desembolsar'),
            icon: '💳',
          }]
        : []),
    ];

    // Grid responsivo mejorado para adaptarse a diferentes tamaños de pantalla
    const getGridClass = () => {
      const optionsCount = availableOptions.length;
      
      if (isMobile()) {
        // Móvil: 1 columna para pantallas muy pequeñas, 2 para pantallas móviles más grandes
        return window.innerWidth <= 480 ? 'grid-cols-1' : 'grid-cols-2';
      }
      
      if (isTablet()) {
        // Tablet: 2-3 columnas dependiendo del número de opciones
        if (optionsCount <= 3) return 'grid-cols-2';
        return 'grid-cols-3';
      }
      
      if (isSmallDesktop()) {
        // Desktop pequeño: 2-4 columnas
        if (optionsCount <= 2) return 'grid-cols-2';
        if (optionsCount <= 4) return 'grid-cols-3';
        return 'grid-cols-4';
      }
      
      // Desktop grande: tarjetas más grandes, distribución optimizada
      if (optionsCount <= 2) return 'grid-cols-1 lg:grid-cols-2';
      if (optionsCount <= 4) return 'grid-cols-2 lg:grid-cols-2 xl:grid-cols-3';
      if (optionsCount <= 6) return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-3';
      return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    };

    return (
      <div className={`${isMobile() ? 'min-h-screen' : 'fixed inset-0'} bg-gradient-to-br from-cyan-500 to-blue-500 ${isMobile() ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 50 }}
        />
        
        {/* Contenido principal */}
        <div className={`relative z-10 ${isMobile() ? 'min-h-screen' : 'h-full'} flex flex-col`}>
          {/* Header para móvil */}
          {isMobile() && (
            <div className="flex-shrink-0 p-4 text-center">
              <h1 className="text-white text-lg font-bold">Panel de Control</h1>
            </div>
          )}
          
          {/* Grid de opciones */}
          <div className={`${isMobile() ? 'flex-1 pb-8' : 'flex-1 flex items-center justify-center'} p-4 sm:p-6 lg:p-8 relative z-10`}>
            <div className="w-full ">
              <div className={`grid ${getGridClass()} gap-4 sm:gap-6 lg:gap-8`}>
                {availableOptions.map((option, index) => (
                  <Card
                    key={`${option.title}-${index}`}
                    title={option.title}
                    description={option.description}
                    onClick={option.onClick}
                    icon={option.icon}
                    index={index}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Contenido para usuarios básicos optimizado
  const BasicUserContent = () => (
    <div className="fixed inset-0 bg-gradient-to-br from-cyan-500 to-blue-500 overflow-hidden flex items-center justify-center p-4">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />
      
      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-white/30">
          <div className="text-center">
            <div className="text-4xl sm:text-5xl mb-4 sm:mb-6">🚀</div>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
              ¡Bienvenido a la Plataforma!
            </h2>
            <div className="h-0.5 bg-gradient-to-r from-transparent via-white/60 to-transparent mb-4 sm:mb-6" />
            <p className="text-white/90 text-sm leading-relaxed">
              Actualmente tienes acceso básico al sistema. Para obtener acceso a más funcionalidades,
              por favor contacta al administrador del sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout title="Bienvenido a la Plataforma de DILE" showBackButton={false}>
      <style>{`
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* Solo prevenir scroll en desktop */
        @media (min-width: 769px) {
          body, html {
            overflow: hidden !important;
            height: 100vh !important;
          }
          
          #root {
            height: 100vh !important;
            overflow: hidden !important;
          }
        }
        
        /* Permitir scroll en móvil */
        @media (max-width: 768px) {
          body, html {
            overflow-x: hidden;
            overflow-y: auto;
          }
        }
        
        /* Animación de vibración para las tarjetas */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        /* Clase para remover padding del Layout solo en Welcome */
        .welcome-full-width {
          margin: -1.5rem !important;
          width: calc(100% + 3rem) !important;
          height: calc(100% + 3rem) !important;
        }
        
        /* Mejoras responsivas adicionales */
        @media (max-width: 480px) {
          .welcome-full-width .grid {
            gap: 0.75rem !important;
          }
        }
        
        @media (min-width: 481px) and (max-width: 768px) {
          .welcome-full-width .grid {
            gap: 1rem !important;
          }
        }
        
        @media (min-width: 769px) and (max-width: 1024px) {
          .welcome-full-width .grid {
            gap: 1.25rem !important;
          }
        }
        
        /* Transiciones suaves para cambios de tamaño */
        .welcome-full-width .grid > * {
          transition: all 0.3s ease-in-out;
        }
        
        /* Clase adicional para line-clamp-2 */
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      <div className="welcome-full-width">
        {permissions.isBasicUser() ? <BasicUserContent /> : <PrivilegedUserContent />}
      </div>
    </Layout>
  );
};

export default Welcome;