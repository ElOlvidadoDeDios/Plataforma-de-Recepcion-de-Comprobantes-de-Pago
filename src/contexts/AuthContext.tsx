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
    console.log('Intentando recuperar usuario del localStorage');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // console.log('Datos del usuario encontrados:', {
        //   id: parsedUser.id,
        //   email: parsedUser.email,
        //   role: parsedUser.role,
        //   hasAgencias: !!parsedUser.agencias,
        //   agenciasCount: parsedUser.agencias?.length
        // });

        if (!parsedUser.role || !Object.values(UserRole).includes(parsedUser.role)) {
          // console.warn('Rol inválido detectado, usando BASIC_USER');
          parsedUser.role = UserRole.BASIC_USER;
        }

        return parsedUser;
      } catch (error) {
        // console.error('Error al parsear usuario del localStorage:', error);
        return null;
      }
    } else {
      // console.log('No se encontró usuario en localStorage');
      return null;
    }
  });

  const initializeUser = (userData: Partial<UserWithRole>) => {
    const newUser: UserWithRole = {
      id: userData.id || '',
      email: userData.email || '',
      role: userData.role || UserRole.BASIC_USER,
      name: userData.name || '',
      status: 0, // CREATED - Sin permisos hasta que un admin lo active
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      agencias: userData.agencias || [],
    };
    
    // console.log('Inicializando usuario con datos:', newUser);
    // console.log('Inicializando nuevo usuario:', {
    //   id: newUser.id,
    //   email: newUser.email,
    //   role: newUser.role,
    //   hasAgencias: !!newUser.agencias,
    //   agenciasCount: newUser.agencias?.length
    // });
    
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  // Ahora la verificación de permisos se delega al backend
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.role) return false;

    // Permisos básicos basados en roles
    switch (permission) {
      case 'canManageUsers':
        return [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role);
      case 'canAssignRoles':
        return [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role);
      case 'canAccessPayments':
        return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PAYMENTS_USER].includes(user.role);
      case 'canAccessCredits':
        return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CREDIT_USER].includes(user.role);
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
