import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/roles';
import Layout from '../Layout';

const PendientesAdesembolsar: React.FC = () => {
  const { user } = useAuth();

  // Verificar si el usuario tiene permisos para acceder a este componente
  const hasAccess = (): boolean => {
    if (!user || !user.role) return false;
    
    const allowedRoles = [
      UserRole.SUPER_ADMIN,
      UserRole.GERENTE_GENERAL,
      UserRole.JEFE_OPERACIONES,
      UserRole.CAJERO
    ];
    
    return allowedRoles.includes(user.role);
  };

  // Si no tiene acceso, mostrar mensaje de error
  if (!hasAccess()) {
    return (
      <Layout title="Acceso Denegado" showBackButton={true}>
        <div className="flex flex-col items-center justify-center h-full bg-red-50 rounded-lg p-8">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Acceso Denegado
            </h2>
            <p className="text-red-500 mb-4">
              No tienes permisos para acceder a esta sección.
            </p>
            <p className="text-gray-600 text-sm">
              Este módulo está disponible solo para: Super Usuario, Gerencia, Jefa de Operaciones y Cajera.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Créditos Pendientes a Desembolsar" showBackButton={true}>
      <div className="h-full flex flex-col">
        {/* Header de la página */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 rounded-lg shadow-lg">
            <h2 className="text-white text-2xl font-bold mb-2">
              Créditos Pendientes a Desembolsar
            </h2>
            <p className="text-blue-100">
              Gestión de créditos aprobados pendientes de desembolso
            </p>
          </div>
        </div>

        {/* Contenido principal - Por ahora solo un placeholder */}
        <div className="flex-1 bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg
              className="w-16 h-16 text-blue-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Módulo en Desarrollo
            </h3>
            <p className="text-gray-500 mb-4">
              Este módulo está actualmente en desarrollo.
            </p>
            <p className="text-sm text-gray-400">
              Funcionalidades que se incluirán:
            </p>
            <ul className="text-sm text-gray-400 mt-2 space-y-1">
              <li>• Listado de créditos aprobados pendientes</li>
              <li>• Procesamiento de desembolsos</li>
              <li>• Generación de comprobantes</li>
              <li>• Seguimiento de estado</li>
            </ul>
          </div>

          {/* Información del usuario actual */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 text-center">
              <p>
                <strong>Usuario:</strong> {user?.name || user?.email}
              </p>
              <p>
                <strong>Rol:</strong> {user?.role}
              </p>
              <p className="text-green-600 mt-2">
                ✓ Tienes acceso autorizado a este módulo
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PendientesAdesembolsar;
