// src/components/auditoria_geodile/AuditoriaTable.tsx

import React, { useState } from 'react';
import { Search, ShieldCheck, Eye, UserCheck, AlertCircle } from 'lucide-react';
import { getVerificacionGpsPorDni } from '../../api/auditoriaGeodileApi';
import AuditoriaModal from './AuditoriaModal';
import toast from 'react-hot-toast';
import Layout from '../Layout';

export default function AuditoriaTable() {
  const [dniBusqueda, setDniBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [socioEncontrado, setSocioEncontrado] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dniBusqueda || dniBusqueda.length < 8) {
      toast.error('Ingrese un número de DNI válido');
      return;
    }

    setLoading(true);
    setSocioEncontrado(null);

    try {
      const response = await getVerificacionGpsPorDni(dniBusqueda);
      if (response.status && response.data) {
        const socioData = {
          id: response.dni_socio,
          dni: response.dni_socio,
          nombres: response.socio,
          agencia: 'AGENCIA PRINCIPAL', 
          estado: 'PENDIENTE_AUDITORIA',
          visitas: response.data 
        };
        
        setSocioEncontrado(socioData);
        toast.success(`¡Socio encontrado!`);
      } else {
        toast.error('No se encontraron registros GPS para este DNI');
      }
    } catch (error) {
      toast.error('Error al conectar con la API de GeoDile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = () => {
    if (!socioEncontrado) return;
    setModalOpen(true);
  };

  // Función para limpiar la búsqueda y buscar otro
  const limpiarBusqueda = () => {
    setSocioEncontrado(null);
    setDniBusqueda('');
  };

  return (
    <Layout title="Auditoría GeoDile (10k)">
      {/* Redujimos el ancho máximo a 4xl para que la tarjeta simple no se vea estirada */}
      <div className="max-w-4xl mx-auto p-4 sm:p-8 mt-4 sm:mt-8 mb-8">
        
        {/* CAJA DE BÚSQUEDA SIEMPRE VISIBLE */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8 mb-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-cyan-50 rounded-full mb-4">
              <ShieldCheck className="w-10 h-10 text-[#06b6d4]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0c4a6e] mb-2">
              Verificación GeoDile
            </h2>
            <p className="text-gray-500 text-sm">
              Ingrese el DNI del socio para extraer sus capturas en campo.
            </p>
          </div>

          <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Ejemplo: 42827356"
                value={dniBusqueda}
                onChange={(e) => setDniBusqueda(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent focus:bg-white focus:outline-none text-lg transition-all shadow-inner"
                maxLength={12}
                autoComplete="off"
              />
              <Search className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-[#0c4a6e] text-white rounded-xl hover:bg-[#082f49] transition-all font-bold text-lg flex items-center justify-center shadow-lg disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Buscar Socio'
              )}
            </button>
          </form>
        </div>

        {/* ÁREA DE RESULTADOS */}
        <div className="transition-all duration-500 ease-in-out">
          {loading && (
            <div className="flex flex-col justify-center items-center py-12">
              <p className="text-[#0c4a6e] font-medium animate-pulse">Conectando con base de datos GeoDile...</p>
            </div>
          )}

          {/* NUEVO DISEÑO: TARJETA DE PERFIL (Reemplaza a la tabla) */}
          {!loading && socioEncontrado && (
            <div className="bg-white rounded-2xl shadow-lg border border-cyan-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gradient-to-r from-cyan-50 to-white px-6 py-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                
                {/* Info del Socio */}
                <div className="flex items-center gap-5 w-full md:w-auto">
                  <div className="hidden sm:flex items-center justify-center w-16 h-16 bg-[#0c4a6e] rounded-full shadow-md text-white flex-shrink-0">
                    <UserCheck className="w-8 h-8" />
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold tracking-wider uppercase mb-2">
                      {socioEncontrado.estado}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
                      {socioEncontrado.nombres}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2 text-sm font-medium text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded">DNI: {socioEncontrado.dni}</span>
                      <span className="hidden sm:inline text-gray-300">•</span>
                      <span>{socioEncontrado.agencia}</span>
                    </div>
                  </div>
                </div>

                {/* Botón de Acción Principal */}
                <div className="w-full md:w-auto flex flex-col gap-2">
                  <button
                    onClick={abrirModal}
                    className="w-full md:w-auto px-8 py-4 bg-[#06b6d4] text-white rounded-xl hover:bg-[#0891b2] transition-all font-bold shadow-md flex items-center justify-center gap-3 hover:scale-105 active:scale-95"
                  >
                    <Eye className="w-5 h-5" />
                    Abrir Auditoría
                  </button>
                  <button 
                    onClick={limpiarBusqueda}
                    className="text-xs text-gray-400 hover:text-gray-600 text-center underline underline-offset-2"
                  >
                    Limpiar y buscar otro
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ESTADO VACÍO ELEGANTE (Cuando no se ha buscado nada) */}
          {!loading && !socioEncontrado && (
            <div className="text-center py-12 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Esperando consulta</h3>
              <p className="text-gray-500 text-sm">
                Los resultados de la búsqueda y opciones de auditoría aparecerán aquí.
              </p>
            </div>
          )}
        </div>

        {/* Modal de Auditoría (Intacto, a tu jefe le encantó) */}
        {modalOpen && socioEncontrado && (
          <AuditoriaModal 
            socio={socioEncontrado} 
            onClose={() => setModalOpen(false)} 
            onRefresh={limpiarBusqueda}
          />
        )}
      </div>
    </Layout>
  );
}