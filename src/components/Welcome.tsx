import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCombinedPermissions } from '../hooks/useCombinedPermissions';
import Layout from './Layout';

// Funciones para detectar el tipo de dispositivo
const isMobile = () => window.innerWidth <= 768;
const isTablet = () => window.innerWidth > 768 && window.innerWidth <= 1024;
const isSmallDesktop = () => window.innerWidth > 1024 && window.innerWidth <= 1280;

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const permissions = useCombinedPermissions();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Animación de estrellas y cometa (ajustada para el contenedor)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const stars = Array.from({ length: isMobile() ? 50 : 100 }, () => ({
      x: 0,
      y: 0,
      radius: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.4,
    }));

    let comet = {
      x: -20,
      y: 0,
      vx: 8,
      vy: Math.random() * 2 - 1,
      active: true,
      explode: false,
      explodeTime: 0,
      explodeScale: 0,
      particles: [] as Array<{x: number, y: number, vx: number, vy: number, color: string, life: number}>,
    };

    const resetComet = () => {
      const rect = container.getBoundingClientRect();
      comet = {
        x: -20,
        y: Math.random() * rect.height * 0.5,
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
      for (let i = 0; i < 20; i++) {
        comet.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          color: colors[Math.floor(Math.random() * colors.length)],
          life: 1.2,
        });
      }
    };

    const animate = () => {
      if (!ctx || !canvas || !container) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dibujar estrellas
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 3;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Animar cometa
      if (comet.active) {
        comet.x += comet.vx;
        comet.y += comet.vy;

        ctx.beginPath();
        ctx.arc(comet.x, comet.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 200, 100, 1)';
        ctx.shadowColor = 'rgba(255, 200, 100, 0.8)';
        ctx.shadowBlur = 8;
        ctx.fill();

        const gradient = ctx.createLinearGradient(
          comet.x,
          comet.y,
          comet.x - comet.vx * 10,
          comet.y - comet.vy * 10
        );
        gradient.addColorStop(0, 'rgba(255, 200, 100, 1)');
        gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');

        ctx.beginPath();
        ctx.moveTo(comet.x, comet.y);
        ctx.lineTo(comet.x - comet.vx * 10, comet.y - comet.vy * 10);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (comet.x > canvas.width * 0.3 && Math.random() < 0.02) {
          comet.explode = true;
          comet.active = false;
          comet.explodeTime = Date.now();
          createExplosionParticles(comet.x, comet.y);
        }

        if (comet.x > canvas.width || comet.y > canvas.height || comet.y < 0) {
          resetComet();
        }
      }

      // Animación de explosión
      if (comet.explode) {
        const elapsed = (Date.now() - comet.explodeTime) / 1000;
        comet.explodeScale = Math.min(elapsed * 2, 1);
        const opacity = Math.max(1 - elapsed / 2, 0);

        comet.particles.forEach((particle) => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.15;
          particle.life -= 0.02;

          if (particle.life > 0) {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = particle.color + Math.floor(particle.life * 255).toString(16).padStart(2, '0');
            ctx.shadowColor = particle.color;
            ctx.shadowBlur = 4;
            ctx.fill();
          }
        });

        comet.particles = comet.particles.filter(p => p.life > 0);

        ctx.save();
        ctx.translate(comet.x, comet.y);
        ctx.scale(comet.explodeScale, comet.explodeScale);
        ctx.font = `bold ${isMobile() ? '30px' : '40px'} Arial`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(255, 215, 0, 0.9)';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = `rgba(255, 140, 0, ${opacity})`;
        ctx.lineWidth = 2;
        ctx.strokeText('DILE', 0, 0);

        const gradient = ctx.createLinearGradient(0, -15, 0, 15);
        gradient.addColorStop(0, `rgba(255, 223, 0, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(255, 215, 0, ${opacity})`);
        gradient.addColorStop(1, `rgba(255, 165, 0, ${opacity})`);
        ctx.fillStyle = gradient;
        ctx.fillText('DILE', 0, 0);
        ctx.restore();

        if (elapsed > 2) {
          resetComet();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      stars.forEach((star) => {
        star.x = Math.random() * rect.width;
        star.y = Math.random() * rect.height;
      });

      resetComet();
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    resizeCanvas();
    animate();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Componente de tarjeta reutilizable
  type CardProps = {
    title: string;
    description: string;
    onClick: () => void;
    icon: React.ReactNode;
    index: number;
  };

  const Card: React.FC<CardProps> = ({ title, description, onClick, icon, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="w-full"
      onClick={onClick}
    >
      <div className={`relative w-full bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 flex flex-col ${
        isMobile()
          ? 'p-3 min-h-[120px]'
          : isTablet()
          ? 'p-3 min-h-[130px]'
          : isSmallDesktop()
          ? 'p-2 min-h-[110px]'
          : 'p-4 min-h-[160px]'
      }`}>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className={`mb-2 ${
            isMobile() ? 'text-xl' : isSmallDesktop() ? 'text-lg' : 'text-3xl'
          }`}>{icon}</div>
          <h3 className={`font-bold text-white mb-2 leading-tight px-1 ${
            isMobile() ? 'text-xs' : isSmallDesktop() ? 'text-sm' : 'text-lg'
          }`}>{title}</h3>
          <div className="h-0.5 bg-white/60 mb-2 rounded-full w-full max-w-[80%]" />
          <p className={`text-white/90 leading-tight px-1 flex-1 ${
            isMobile() ? 'text-[10px] line-clamp-2' : isSmallDesktop() ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3'
          }`}>{description}</p>
        </div>
      </div>
    </motion.div>
  );

  // Contenido para usuarios con privilegios
  const PrivilegedUserContent = () => {
    const availableOptions = [
      ...(permissions.canAccessPayments() ? [{ title: 'Ver Pagos', description: 'Gestiona los pagos de los clientes', onClick: () => navigate('/payments'), icon: '💰' }] : []),
      ...(permissions.canAccessCredits() ? [{ title: 'Solicitudes de Crédito', description: 'Revisa y aprueba solicitudes de crédito', onClick: () => navigate('/credit-requests'), icon: '📝' }] : []),
       ...(permissions.canViewCreditApproval() ? [{ title: 'Aprobación de Créditos', description: 'Aprueba solicitudes de crédito', onClick: () => navigate('/aprobacion-creditos'), icon: '✅' }] : []),
      ...(permissions.canViewCreditRequest() ? [{ title: 'Solicitud de Crédito', description: 'Realiza solicitudes de crédito', onClick: () => navigate('/solicitud-credito'), icon: '📋' }] : []),
      ...(permissions.canAccessBotInteractions() ? [{ title: 'Interacciones del Bot', description: 'Analiza las interacciones con el bot', onClick: () => navigate('/bot-interactions'), icon: '🤖' }] : []),
      ...(permissions.canAccessConsultaCuotas() ? [{ title: 'Reporte de Consulta de Cuotas', description: 'Revisa el estado de las cuotas', onClick: () => navigate('/consultas-cuotas'), icon: '📊' }] : []),
      ...(permissions.canAccessConsultaSocios() ? [{ title: 'Consultar socios', description: 'Gestiona tu base de clientes', onClick: () => navigate('/consulta-clientes'), icon: '👥' }] : []),
      { title: 'Ver Cuotas en Mora', description: 'Visualiza las cuotas pendientes y en mora de los socios', onClick: () => navigate('/ver-cuotas-mora'), icon: '👁️' },
      ...(permissions.canAccessRegistroClientes() ? [{ title: 'Registro de Socios', description: 'Registra y gestiona información de clientes', onClick: () => navigate('/registro-clientes'), icon: '👤' }] : []),
      ...(permissions.canManageUsers() ? [{ title: 'Gestión de Usuarios', description: 'Administra los usuarios del sistema', onClick: () => navigate('/user-management'), icon: '👤' }] : []),
      ...(permissions.canAccessGestionMora() ? [{ title: 'Gestión de Mora', description: 'Gestiona clientes en mora y seguimiento', onClick: () => navigate('/gestion-mora'), icon: '📋' }] : []),
      ...(permissions.canAccessRecuperaciones() ? [{ title: 'Gestión de Recuperadores', description: 'Gestiona recuperadores y socios en mora', onClick: () => navigate('/gestion-recuperadores'), icon: '🔄' }] : []),
      ...(permissions.canAccessPendientesDesembolsar() ? [{ title: 'Pendientes a Desembolsar', description: 'Gestiona créditos pendientes de desembolso', onClick: () => navigate('/pendientes-desembolsar'), icon: '💳' }] : []),
      ...(permissions.canAccessHistorialDesembolsos() ? [{ title: 'Historial de Desembolsos', description: 'Consulta el historial de desembolsos realizados', onClick: () => navigate('/historial-desembolsos'), icon: '📋' }] : []),
      ...(permissions.canAccessSeguimientoDesembolsosHoy() ? [{ title: 'Seguimiento Desembolsos Hoy', description: 'Monitorea los créditos desembolsados en el día actual', onClick: () => navigate('/seguimiento-desembolsos-hoy'), icon: '📈' }] : []),
      { title: 'Calculadora de Créditos', description: 'Calcula el monto de crédito para un cliente', onClick: () => navigate('/calculadora-creditos'), icon: '📊' },
      ...(permissions.canAccessPagoRecaudadores() ? [{ title: 'Pago Recaudadores', description: 'Gestiona pagos a recaudadores', onClick: () => navigate('/pago-recaudadores'), icon: '🏦' }] : []),
      ...(permissions.canAccessGeodile() ? [{
        title: 'Geodile',
        description: 'Sistema de geolocalización y mapas para verificación de ubicaciones',
        onClick: () => navigate('/geodile'),
        icon: <GeodileIcon className={isMobile() ? 'w-6 h-6' : isSmallDesktop() ? 'w-8 h-8' : 'w-12 h-12'} />
      }] : []),
      ...(permissions.canAccessAffiliationSocios() ? [{
        title: 'Afiliación de Socios',
        description: 'Gestiona afiliaciones de socios',
        onClick: () => navigate('/afiliacion-socios'),
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      }] : []),
      ...(permissions.canAccessCulqui() ? [{
        title: 'QULLQI',
        description: 'Gestión de créditos calificados por qullqis',
        onClick: () => navigate('/culqui-pendientes'),
        icon: '💳'
      }] : []),
    ];

    // Lógica para el grid responsivo
    const getGridClass = () => {
      const optionsCount = availableOptions.length;
      if (isMobile()) return 'grid-cols-2';
      if (isTablet()) return optionsCount <= 4 ? 'grid-cols-2' : 'grid-cols-3';
      if (isSmallDesktop()) return optionsCount <= 6 ? 'grid-cols-3' : 'grid-cols-4';
      return optionsCount <= 4 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4';
    };

    return (
      <div className="relative w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        />

        <div className="relative z-10 w-full h-full flex flex-col">
          {(isMobile() || isSmallDesktop()) && (
            <div className="flex-shrink-0 text-center py-3">
              <h1 className="text-white font-bold text-base">Panel de Control</h1>
            </div>
          )}

          <div className="flex-1 flex items-center justify-center overflow-hidden p-3 pb-6" style={{ height: '100vh' }}>
            <div className={`grid ${getGridClass()} gap-3`}>
              {availableOptions.map((option, index) => (
                <Card key={`${option.title}-${index}`} {...option} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Contenido para usuarios básicos
  const BasicUserContent = () => (
    <div className="relative w-full h-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center p-4">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/30">
          <div className="text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-xl font-bold text-white mb-3">¡Bienvenido a la Plataforma!</h2>
            <div className="h-0.5 bg-gradient-to-r from-transparent via-white/60 to-transparent mb-4" />
            <p className="text-white/90 text-sm">
              Actualmente tienes acceso básico al sistema. Para obtener acceso a más funcionalidades, contacta al administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout title="Bienvenido a la Plataforma de DILE" showBackButton={false}>
      <style>{`
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
        }
        .line-clamp-2, .line-clamp-3 {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 { -webkit-line-clamp: 2; }
        .line-clamp-3 { -webkit-line-clamp: 3; }

        /* Scroll personalizado */
        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        /* Para Firefox */
        .overflow-y-auto {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1);
        }
      `}</style>

      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden relative p-0 m-0"
      >
        {permissions.isBasicUser() ? <BasicUserContent /> : <PrivilegedUserContent />}
      </div>
    </Layout>
  );
};

export default Welcome;
