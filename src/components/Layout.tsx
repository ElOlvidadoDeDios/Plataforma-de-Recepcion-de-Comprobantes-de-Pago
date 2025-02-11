import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogoutButton } from './LogoutButton';
import UserInfo from './UserInfo';
import logo from '../logo_dile.webp';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  showBackButton?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title, showBackButton = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gradient-to-b from-customLightBlue to-white">
      <div className="w-full px-6 pb-8">
        <div className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-t-lg shadow-lg">
          <div className="w-full px-6 py-4">
            <div className="flex items-center">
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <motion.div
                  className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <img
                    src={logo}
                    alt="Logo DILE"
                    className="w-full h-full object-contain"
                  />
                </motion.div>
                <motion.div
                  className="flex items-center"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h1 className="text-white font-bold text-xl sm:text-2xl md:text-3xl text-center sm:text-left">
                    {title}
                  </h1>
                </motion.div>
              </div>
              <div className="flex items-center sm:ml-auto">
                <UserInfo />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 to-blue-500 flex flex-col sm:flex-row justify-between items-center gap-2 px-4 sm:px-6 py-2 rounded-b-lg shadow-lg">
          {showBackButton && !isHome && (
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver al Inicio</span>
            </button>
          )}
          <div className="w-full sm:w-auto">
            <LogoutButton />
          </div>
        </div>
        <div className="mt-4 px-2 sm:px-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;