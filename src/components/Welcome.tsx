import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCombinedPermissions } from '../hooks/useCombinedPermissions';
import Layout from './Layout';

const isMobile = () => window.innerWidth <= 768;
const isTablet = () => window.innerWidth > 768 && window.innerWidth <= 1024;
const isSmallDesktop = () => window.innerWidth > 1024 && window.innerWidth <= 1280;

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const permissions = useCombinedPermissions();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Componente del icono SVG de Geodile
  const GeodileIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 141 153" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M82.4004 84.2898H58.5996C57.1667 84.2879 55.7931 83.7174 54.7806 82.7035C53.768 81.6897 53.1993 80.3153 53.1993 78.8824V56.4493C53.1993 55.0171 53.7683 53.6435 54.781 52.6308C55.7938 51.618 57.1673 51.049 58.5996 51.049H82.4004C83.8326 51.049 85.2062 51.618 86.219 52.6308C87.2317 53.6435 87.8007 55.0171 87.8007 56.4493V78.8824C87.8007 80.3153 87.232 81.6897 86.2194 82.7035C85.2069 83.7174 83.8333 84.2879 82.4004 84.2898Z" fill="currentColor"/>
      <path d="M101.323 30.5406C84.2968 13.5219 56.7031 13.5219 39.6774 30.5406C23.6527 46.5723 22.5811 72.2132 37.231 89.5209L63.3724 120.414C67.1019 124.82 73.8981 124.82 77.6275 120.414L103.769 89.5209C118.419 72.2132 117.347 46.5723 101.323 30.5406ZM70.5 94.1105C51.4015 94.1105 35.9127 78.6287 35.9127 59.5232C35.9127 40.4177 51.4015 24.9429 70.5 24.9429C89.5984 24.9429 105.087 40.4247 105.087 59.5232C105.087 78.6216 89.5984 94.1105 70.5 94.1105Z" fill="currentColor"/>
      <path d="M70.5 70.4013C71.9622 70.4013 73.3645 70.9822 74.3984 72.0161C75.4323 73.05 76.0131 74.4522 76.0131 75.9144V83.2746H64.9869V75.9144C64.9869 74.4522 65.5677 73.05 66.6017 72.0161C67.6356 70.9822 69.0378 70.4013 70.5 70.4013Z" fill="white"/>
    </svg>
  );
  
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
        gradient.addColorStop(0, `rgba(255, 223, 0, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(255, 215, 0, ${opacity})`);
        gradient.addColorStop(1, `rgba(255, 165, 0, ${opacity})`);
        ctx.fillStyle = gradient;
        ctx.fillText('DILE', 0, 0);
        
        ctx.restore();

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

  // Tarjeta reutilizable optimizada para móviles
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
          ? 'p-4 min-h-[200px] aspect-square'
          : isTablet()
          ? 'p-4 min-h-[140px]' // Reducido de 160 a 140
          : isSmallDesktop()
          ? 'p-4 min-h-[150px]' // Reducido de 180 a 150
          : 'p-6 lg:p-8 min-h-[200px] lg:min-h-[220px] xl:min-h-[240px]'
      }`}
      data-card
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className={`mb-3 ${
            isMobile()
              ? 'text-3xl'
              : isTablet()
              ? 'text-2xl' // Reducido un poco
              : isSmallDesktop()
              ? 'text-2xl' // Reducido de text-3xl a text-2xl
              : 'text-4xl lg:text-5xl xl:text-6xl'
          }`}>{icon}</div>
          <h3 className={`font-bold text-white mb-3 leading-tight px-1 ${
            isMobile()
              ? 'text-sm'
              : isTablet()
              ? 'text-xs' // Reducido de text-sm a text-xs
              : isSmallDesktop()
              ? 'text-sm' // Reducido de text-base a text-sm
              : 'text-lg lg:text-xl xl:text-2xl'
          }`}>{title}</h3>
          <div className="h-0.5 bg-white/60 mb-3 rounded-full w-full max-w-[80%]" />
          <p className={`text-white/90 leading-relaxed px-1 flex-1 ${
            isMobile()
              ? 'text-xs leading-tight'
              : isTablet()
              ? 'text-xs line-clamp-2' // Cambiado a line-clamp-2 para mostrar menos líneas
              : isSmallDesktop()
              ? 'text-xs line-clamp-2' // Cambiado a text-xs y line-clamp-2
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
      ...(permissions.canAccessConsultaSocios()
        ? [{
            title: 'Consultar socios',
            description: 'Gestiona tu base de clientes',
            onClick: () => navigate('/consulta-clientes'),
            icon: '👥',
          }]
        : []),
      ...(permissions.canAccessRegistroClientes()
        ? [{
            title: 'Registro de Clientes',
            description: 'Registra y gestiona información de clientes',
            onClick: () => navigate('/registro-clientes'),
            icon: '👤',
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
        ...(permissions.canAccessCalculadoraCreditos()
        ? [{
            title: 'Calculadora de Créditos',
            description: 'Calcula el monto de crédito para un cliente',
            onClick: () => navigate('/calculadora-creditos'),
            icon: '📊'
          }]
        : []),
        ...(permissions.canAccessGeodile()
        ? [{
            title: 'Geodile',
            description: 'Sistema de geolocalización y mapas para verificación de ubicaciones',
            onClick: () => navigate('/geodile'),
            icon: <GeodileIcon className={
              isMobile()
                ? 'w-8 h-8 text-white'
                : isTablet()
                ? 'w-8 h-8 text-white' // Reducido de w-10 h-10
                : isSmallDesktop()
                ? 'w-8 h-8 text-white' // Reducido de w-12 h-12
                : 'w-16 h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 text-white'
            } />
          }]
        : []),
    ];

    // Grid responsivo mejorado especialmente para desktop pequeño
    const getGridClass = () => {
      const optionsCount = availableOptions.length;
      
      if (isMobile()) {
        return 'grid-cols-2';
      }
      
      if (isTablet()) {
        if (optionsCount <= 4) return 'grid-cols-2';
        if (optionsCount <= 6) return 'grid-cols-3';
        return 'grid-cols-4';
      }
      
      if (isSmallDesktop()) {
        // Mejorado para desktop pequeño - más columnas para mejor aprovechamiento
        if (optionsCount <= 4) return 'grid-cols-4';
        if (optionsCount <= 6) return 'grid-cols-3';
        if (optionsCount <= 8) return 'grid-cols-4';
        return 'grid-cols-4';
      }
      
      // Desktop grande
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
          {/* Header para móvil - más pequeño */}
          {isMobile() && (
            <div className="flex-shrink-0 p-3 text-center">
              <h1 className="text-white text-base font-bold">Panel de Control</h1>
            </div>
          )}
          
          {/* Grid de opciones con mejor espaciado para desktop pequeño */}
          <div className={`${isMobile() ? 'flex-1 pb-8' : 'flex-1 flex items-center justify-center'} ${
            isMobile() ? 'p-3' : 'p-3 sm:p-4 lg:p-8'
          } relative z-10`}>
            <div className="w-full">
              <div className={`grid ${getGridClass()} ${
                isMobile() ? 'gap-3' : isTablet() ? 'gap-3' : isSmallDesktop() ? 'gap-3' : 'gap-4 sm:gap-6 lg:gap-8'
              }`}>
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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
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
        
        /* Clase para remover padding del Layout solo en Welcome */
        .welcome-full-width {
          margin: -1.5rem !important;
          width: calc(100% + 3rem) !important;
          height: calc(100% + 3rem) !important;
        }
        
        /* Mejoras específicas para desktop pequeño */
        @media (min-width: 1025px) and (max-width: 1280px) {
          .welcome-full-width .grid {
            gap: 0.75rem !important;
            max-height: calc(100vh - 6rem);
            overflow-y: auto;
            padding: 1rem;
          }
          
          .welcome-full-width [data-card] {
            min-height: 140px !important;
          }
        }
        
        /* Mejoras responsivas para móviles */
        @media (max-width: 768px) {
          .welcome-full-width .grid {
            gap: 0.75rem !important;
          }
          
          .welcome-full-width [data-card] {
            aspect-ratio: 1 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
          }
        }
        
        @media (min-width: 481px) and (max-width: 768px) {
          .welcome-full-width .grid {
            gap: 1rem !important;
          }
        }
        
        @media (min-width: 769px) and (max-width: 1024px) {
          .welcome-full-width .grid {
            gap: 0.75rem !important;
          }
        }
        
        /* Transiciones suaves para cambios de tamaño */
        .welcome-full-width .grid > * {
          transition: all 0.3s ease-in-out;
        }
        
        /* Mejoras específicas para texto en móvil */
        @media (max-width: 768px) {
          .welcome-full-width h3 {
            line-height: 1.2 !important;
            margin-bottom: 0.5rem !important;
          }
          
          .welcome-full-width p {
            line-height: 1.3 !important;
            font-size: 0.75rem !important;
          }
        }
        
        /* Scroll suave para desktop pequeño cuando hay muchas tarjetas */
        @media (min-width: 1025px) and (max-width: 1280px) {
          .welcome-full-width .grid {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
          }
          
          .welcome-full-width .grid::-webkit-scrollbar {
            width: 6px;
          }
          
          .welcome-full-width .grid::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .welcome-full-width .grid::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }
          
          .welcome-full-width .grid::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
        }
      `}</style>
      <div className="welcome-full-width">
        {permissions.isBasicUser() ? <BasicUserContent /> : <PrivilegedUserContent />}
      </div>
    </Layout>
  );
};

export default Welcome;