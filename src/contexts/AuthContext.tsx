import React, { createContext, useState } from 'react';
import { UserRole, UserWithRole, rolePermissions } from '../types/roles';

// Interfaz que define la estructura del contexto de autenticación
export interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  user: UserWithRole | null;
  setUser: React.Dispatch<React.SetStateAction<UserWithRole | null>>;
  hasPermission: (permission: keyof typeof rolePermissions[UserRole]) => boolean;
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
        console.error('Error parsing stored user:', error);
        return null;
      }
    }
    return null;
  });

  const initializeUser = (userData: Partial<UserWithRole>) => {
    const newUser: UserWithRole = {
      id: userData.id || '',
      email: userData.email || '',
      role: userData.role || UserRole.BASIC_USER,
      name: userData.name || '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const hasPermission = (permission: keyof typeof rolePermissions[UserRole]): boolean => {
    if (!user || !user.role) return false;
    
    if (!rolePermissions[user.role]) {
      console.error(`Role ${user.role} not found in permissions configuration`);
      return false;
    }

    if (!(permission in rolePermissions[user.role])) {
      console.error(`Permission ${permission} not found for role ${user.role}`);
      return false;
    }

    return rolePermissions[user.role][permission];
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    setIsAuthenticated,
    user,
    setUser,
    hasPermission,
    initializeUser
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
