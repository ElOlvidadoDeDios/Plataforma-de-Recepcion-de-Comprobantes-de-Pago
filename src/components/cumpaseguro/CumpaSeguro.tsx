import React, { useState } from 'react';
import Layout from '../Layout';

import { Permission } from '../../types/permissions';
import { useCombinedPermissions } from '../../hooks/useCombinedPermissions';

import AsegurarPage from './pages/AsegurarPage';

type Vista = 'inicio' | 'asegurar';

const CumpaSeguro: React.FC = () => {
  const { hasPermission } = useCombinedPermissions();
  const [vista, setVista] = useState<Vista>('inicio');

  if (!hasPermission(Permission.CUMPASEGURO_VIEW)) {
    return (
      <Layout title="Acceso Denegado" showBackButton={true}>
        <div className="flex flex-col items-center justify-center h-full bg-red-50 rounded-lg p-8">
          <div className="text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
            <p className="text-red-500 mb-4">No tienes permisos para acceder a esta sección.</p>
            <p className="text-gray-600 text-sm">
              Contacta con el administrador para solicitar acceso.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (vista === 'asegurar') {
    return <AsegurarPage onVolver={() => setVista('inicio')} />;
  }

  return (
    <Layout title="Mi CumpaSeguro" showBackButton={true}>
      <div className="flex h-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 sm:p-8 md:p-12">
        <div className="text-center max-w-2xl mx-auto">
          {/* Icono Escudo */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-500 rounded-full mb-6 shadow-lg">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          {/* Título */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            Bienvenido a Mi CumpaSeguro
          </h1>

          {/* Descripción */}
          <p className="text-base sm:text-lg text-gray-600 mb-8">
            Gestiona el aseguramiento de tus clientes.
          </p>

          {/* Características / módulos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
            {/* Asegurar: módulo funcional */}
            <button
              type="button"
              onClick={() => setVista('asegurar')}
              className="bg-white p-5 rounded-lg shadow text-left hover:shadow-md hover:-translate-y-0.5 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800">Asegurar</h3>
                  <p className="text-sm text-gray-600">Registra un nuevo aseguramiento</p>
                </div>
              </div>
            </button>

            <div className="bg-white p-5 rounded-lg shadow opacity-60">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800">Gestión de Pólizas</h3>
                  <p className="text-sm text-gray-600">Administra todas las pólizas de seguros</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg shadow opacity-60">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800">Reportes</h3>
                  <p className="text-sm text-gray-600">Informes detallados de coberturas</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg shadow opacity-60">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800">Renovaciones</h3>
                  <p className="text-sm text-gray-600">Alertas de pólizas próximas a vencer</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg shadow opacity-60">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800">Siniestros</h3>
                  <p className="text-sm text-gray-600">Gestión de reclamos y siniestros</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CumpaSeguro;