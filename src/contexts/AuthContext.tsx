import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { UserRole, UserWithRole } from '../types/roles';

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
    return !!localStorage.getItem('token');
  });
  
  const [user, setUser] = useState<UserWithRole | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        if (!parsedUser.role || !Object.values(UserRole).includes(parsedUser.role)) {
          parsedUser.role = UserRole.BASIC_USER;
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

    const newUser: UserWithRole = {
      id: userData.id || '',
      email: userData.email,
      dni: userData.dni,
      role: userData.role || UserRole.BASIC_USER,
      name: userData.name || '',
      status: 0, // CREATED - Sin permisos hasta que un admin lo active
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      agencias: userData.agencias || [],
    };
    
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  // Ahora la verificación de permisos se delega al backend
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.role) return false;

    // Permisos básicos basados en roles
    switch (permission) {
      case 'canManageUsers':
        return [UserRole.SUPER_ADMIN, UserRole.GERENTE_GENERAL].includes(user.role); // Solo SUPER_ADMIN y GERENTE_GENERAL pueden gestionar usuarios
      case 'canAssignRoles':
        return [UserRole.SUPER_ADMIN, UserRole.GERENTE_GENERAL].includes(user.role); // Solo SUPER_ADMIN y GERENTE_GENERAL pueden asignar roles
      case 'canAccessPayments':
        return [UserRole.SUPER_ADMIN, UserRole.CAJERO, UserRole.GERENTE_GENERAL, UserRole.JEFE_OPERACIONES].includes(user.role); // JEFE_OPERACIONES también puede ver pagos
      case 'canAccessCredits':
        return [UserRole.SUPER_ADMIN, UserRole.ADMINISTRADOR, UserRole.ANALISTA_CREDITOS_I, UserRole.GERENTE_GENERAL].includes(user.role); // GERENTE_GENERAL también puede acceder a créditos
      case 'canAccessGestionMora':
          return [UserRole.SUPER_ADMIN, UserRole.ANALISTA_CREDITOS_I, UserRole.ADMINISTRADOR, UserRole.GERENTE_GENERAL].includes(user.role); // Roles adicionales pueden acceder a Gestión de Mora
      case 'canAccessBotInteractions':
        return [UserRole.SUPER_ADMIN].includes(user.role); // Solo SUPER_ADMIN puede ver interacciones del bot (son informativas)
      case 'canAccessConsultaCuotas':
        return [UserRole.SUPER_ADMIN].includes(user.role); // Solo SUPER_ADMIN puede ver consulta de cuotas (son informativas)
      case 'canAccessReports':
        return [UserRole.SUPER_ADMIN, UserRole.GERENTE_GENERAL, UserRole.JEFE_OPERACIONES].includes(user.role); // JEFE_OPERACIONES puede generar reportes de pagos
      case 'canBlockEmails':
        return [UserRole.SUPER_ADMIN].includes(user.role);
      case 'canDeleteAccounts':
        return [UserRole.SUPER_ADMIN].includes(user.role);
      default:
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
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            // Token expirado
            setIsAuthenticated(false);
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        } catch (error) {
          // console.error('Error decodificando token:', error);
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

