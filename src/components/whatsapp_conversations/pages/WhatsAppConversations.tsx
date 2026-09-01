import React, { useState, useEffect, useRef } from 'react';
import Layout from '../../Layout';
import { Permission } from '../../../types/permissions';
import { useCombinedPermissions } from '../../../hooks/useCombinedPermissions';
import { useNumerosActivos, useEstadisticasNumero } from '../hooks/useNumerosActivos';
import { useConversacion } from '../hooks/useConversacion';
import { Mensaje } from '../services/mensajesWhatsappService';
import { WhatsAppImage } from '../components/WhatsAppImage';

const WhatsAppConversations: React.FC = () => {
  const { hasPermission } = useCombinedPermissions();
  const [numeroSeleccionado, setNumeroSeleccionado] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevNumeroRef = useRef<string | null>(null);

  // Hooks
  const { numeros, loading: loadingNumeros, error: errorNumeros } = useNumerosActivos();
  const { estadisticas, loading: loadingStats } = useEstadisticasNumero(numeroSeleccionado);
  const {
    mensajes,
    loading: loadingMensajes,
    hasMore,
    loadMore,
    pagination,
  } = useConversacion(numeroSeleccionado, 50);

  // Scroll automático solo al cambiar de conversación o carga inicial
  useEffect(() => {
    // Solo hacer scroll si cambió el número seleccionado
    if (numeroSeleccionado !== prevNumeroRef.current && mensajes.length > 0 && chatEndRef.current) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      prevNumeroRef.current = numeroSeleccionado;
    }
  }, [numeroSeleccionado, mensajes.length]);

  if (!hasPermission(Permission.WHATSAPP_CONVERSATIONS_VIEW)) {
    return (
      <Layout title="Acceso Denegado" showBackButton={true}>
        <div className="flex flex-col items-center justify-center h-full bg-red-50 rounded-lg p-8">
          <div className="text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</h2>
            <p className="text-red-500 mb-4">No tienes permisos para acceder a esta sección.</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Filtrar números por búsqueda
  const numerosFiltrados = numeros.filter(num => 
    num && num.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Formatear fecha y hora
  const formatearFecha = (timestamp: number) => {
    const fecha = new Date(timestamp);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    if (fecha.toDateString() === hoy.toDateString()) {
      return `Hoy ${fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (fecha.toDateString() === ayer.toDateString()) {
      return `Ayer ${fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return fecha.toLocaleDateString('es-PE', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <Layout title="Conversaciones WhatsApp" showBackButton={true}>
      <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-lg overflow-hidden">
        {/* SIDEBAR - Lista de conversaciones */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {/* Header del sidebar */}
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Conversaciones
            </h2>
            <p className="text-sm text-gray-100 mt-1">{numeros.length} activas</p>
          </div>

          {/* Barra de búsqueda */}
          <div className="p-3 border-b">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar número..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-cyan-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Lista de conversaciones */}
          <div className="flex-1 overflow-y-auto">
            {loadingNumeros ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
              </div>
            ) : errorNumeros ? (
              <div className="p-4 text-center text-red-500">
                <p>{errorNumeros}</p>
              </div>
            ) : numerosFiltrados.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No se encontraron conversaciones</p>
              </div>
            ) : (
              numerosFiltrados.map((numero) => (
                <div
                  key={numero}
                  onClick={() => setNumeroSeleccionado(numero)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-cyan-50 transition-colors ${
                    numeroSeleccionado === numero ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                      {numero.slice(-2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">+{numero}</p>
                      <p className="text-sm text-gray-500 truncate">Click para ver mensajes</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ÁREA DE CHAT */}
        <div className="flex-1 flex flex-col">
          {numeroSeleccionado ? (
            <>
              {/* Header del chat */}
              <div className="bg-cyan-50 p-4 border-b border-cyan-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                    {numeroSeleccionado.slice(-2)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">+{numeroSeleccionado}</p>
                    {loadingStats ? (
                      <p className="text-xs text-gray-500">Cargando...</p>
                    ) : estadisticas ? (
                      <p className="text-xs text-gray-500">
                        {estadisticas.totalMensajes} mensajes | 
                        {estadisticas.mensajesRecibidos} recibidos | 
                        {estadisticas.mensajesEnviados} enviados
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23d1d5db\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }}>
                {loadingMensajes && mensajes.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
                      <p className="text-gray-500">Cargando mensajes...</p>
                    </div>
                  </div>
                ) : mensajes.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No hay mensajes en esta conversación</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Botón cargar más antiguos */}
                    {hasMore && (
                      <div className="text-center">
                        <button
                          onClick={loadMore}
                          disabled={loadingMensajes}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {loadingMensajes ? 'Cargando...' : 'Cargar mensajes anteriores'}
                        </button>
                      </div>
                    )}

                    {/* Lista de mensajes: antiguos arriba, recientes abajo */}
                    {mensajes.map((mensaje: Mensaje, index: number) => (
                      <div
                        key={mensaje._id || index}
                        className={`flex ${mensaje.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 shadow-sm ${
                            mensaje.direction === 'outbound'
                              ? 'bg-emerald-100 text-gray-800'
                              : 'bg-white text-gray-800'
                          }`}
                        >
                          {/* Renderizar imagen si el tipo es "image" */}
                          {mensaje.type === 'image' ? (
                            <div className="mb-2">
                              <WhatsAppImage
                                imagePath={mensaje.body}
                                alt={`Imagen ${formatearFecha(mensaje.timestamp)}`}
                                className="w-[280px] max-w-full"
                              />
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap break-words">{mensaje.body}</p>
                          )}
                          <p className={`text-xs mt-1 ${
                            mensaje.direction === 'outbound' ? 'text-emerald-700' : 'text-gray-500'
                          }`}>
                            {formatearFecha(mensaje.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              {/* Info de paginación */}
              {pagination.count > 0 && (
                <div className="bg-gray-100 p-2 text-center text-xs text-gray-600 border-t">
                  Mostrando {pagination.count} de {pagination.total} mensajes
                </div>
              )}
            </>
          ) : (
            /* Estado vacío */
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md">
                <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Selecciona una conversación
                </h3>
                <p className="text-gray-500">
                  Elige un número de la lista para ver el historial de mensajes
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default WhatsAppConversations;
