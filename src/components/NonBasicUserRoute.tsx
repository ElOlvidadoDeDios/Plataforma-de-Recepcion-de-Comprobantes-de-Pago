import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/useAuth';

const NonBasicUserRoute = ({ children }: { children: React.ReactNode }) => {
  const { isBasicUser } = usePermissions();

  if (isBasicUser()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default NonBasicUserRoute;