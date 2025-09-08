import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { UserWithRole } from '../types/roles';
import { UserRole } from '../types/permissions';
import { SessionManager } from '../utils/sessionManager';

// Interfaz que define la estructura del contexto de autenticación
export interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  user: UserWithRole | null;
  setUser: React.Dispatch<React.SetStateAction<UserWithRole | null>>;
  hasPermission: (permission: string) => boolean;
  initializeUser: (userData: Partial<UserWithRole>) => void;
}

// Creación del contexto con valores iniciales
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  user: null,
  setUser: () => {},
  hasPermission: () => false,
  initializeUser: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!SessionManager.getItem('token');
  });
  
  const [user, setUser] = useState<UserWithRole | null>(() => {
    const storedUser = SessionManager.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        if (!parsedUser.role || !Object.values(UserRole).includes(parsedUser.role)) {
          parsedUser.role = UserRole.BASIC_USER;
        }

        // Asegurar que los permisos estén sincronizados con el token
        try {
          const token = SessionManager.getItem('token');
          if (token) {
            const payload = jwtDecode(token) as any;
            // Usar solo el sistema unificado de permissions
            parsedUser.permissions = payload.permissions || [];
            // Sincronizar también id_age e id_ana desde el token
            parsedUser.id_age = payload.id_age;
            parsedUser.id_ana = payload.id_ana;
          }
        } catch (error) {
          parsedUser.permissions = parsedUser.permissions || [];
        }

        return parsedUser;
      } catch (error) {

        return null;
      }
    } else {
      return null;
    }
  });

  const initializeUser = (userData: Partial<UserWithRole>) => {
    if (!userData.dni || !userData.email) {
      throw new Error('El DNI y email son requeridos para inicializar el usuario');
    }

    // Intentar obtener datos del token JWT si existe
    let permissions: any[] = [];
    let tokenData: any = {};
    try {
      const token = SessionManager.getItem('token');
      if (token) {
        const payload = jwtDecode(token) as any;
        permissions = payload.permissions || [];
        tokenData = {
          id_age: payload.id_age,
          id_ana: payload.id_ana,
          cargo: payload.cargo,
          // Incluir otros campos que podrían venir del token
        };
      }
    } catch (error) {
    }

    const newUser: UserWithRole = {
      _id: userData._id || '',
      email: userData.email,
      dni: userData.dni,
      razon: userData.razon,
      cargo: userData.cargo || tokenData.cargo,
      role: userData.role || UserRole.BASIC_USER,
      status: 0, // CREATED - Sin permisos hasta que un admin lo active
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      agencias: userData.agencias || [],
      permissions: userData.permissions || permissions,
      id_age: userData.id_age || tokenData.id_age, // Priorizar userData, fallback a token
      id_ana: userData.id_ana || tokenData.id_ana, // Priorizar userData, fallback a token
      user: userData.user || tokenData.cod_user || '', // Priorizar userData, fallback a token
    };
    
    setUser(newUser);
    SessionManager.setItem('user', JSON.stringify(newUser));
  };

  // MÉTODO BÁSICO DE COMPATIBILIDAD - NO USA LÓGICA DE NEGOCIO
  // La verificación REAL de permisos se hace en useCombinedPermissions
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Solo retorna true para casos básicos de autenticación
    // TODO: Este método es legacy, usar useCombinedPermissions para lógica real
    switch (permission) {
      case 'isAuthenticated':
        return true; // Si hay usuario, está autenticado
      case 'isBasicUser':
        return user.role === UserRole.BASIC_USER;
      case 'isSuperAdmin':
        return user.role === UserRole.SUPER_ADMIN;
      default:
        // Para cualquier otro permiso, retorna false
        // Los componentes deben usar useCombinedPermissions para lógica real
        return false;
    }
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    setIsAuthenticated,
    user,
    setUser,
    hasPermission,
    initializeUser
  };

  // Verificar expiración del token periódicamente
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = SessionManager.getItem('token');
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            // Token expirado - solo limpiar la sesión actual
            setIsAuthenticated(false);
            setUser(null);
            SessionManager.removeItem('token');
            SessionManager.removeItem('user');
            window.location.href = '/login';
          }
        } catch (error) {
        }
      }
    };

    // Verificar al montar el componente
    checkTokenExpiration();

    // Verificar cada minuto
    const interval = setInterval(checkTokenExpiration, 60000);
    return () => clearInterval(interval);
  }, []);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

