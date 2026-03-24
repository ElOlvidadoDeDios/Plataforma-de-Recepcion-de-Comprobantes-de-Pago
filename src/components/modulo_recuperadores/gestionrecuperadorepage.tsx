import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../Layout';
import { ClipboardList, ChevronRight, Eye, FileEdit, MessageCircle, BarChart2, X } from 'lucide-react';
import { useGestionMora } from './hooks/userecuperador';
import VerSocioModal from './components/versociomodal';
import GestionarSocioModal from './components/gestionsociomodal';
import GestionesXEstados from './components/gestionXestados';
import BuscadorSocios from './components/BuscadorSocios';
import { SocioMora } from './services/gestios_recuperadores.service';

const GestionRecuperadoresPage = () => {
  const {
    isSuperOrGerente,
    isRecuperador,
    administradores, loadingAdmins,
    selectedAdmin, setSelectedAdmin,
    analistas, loadingAnalistas,
    selectedAnalista, setSelectedAnalista,
    miAnalistaPropio,
    sociosMora, loadingSocios,
    gestionesXEstados,
  } = useGestionMora();

  const [modal, setModal] = useState<'ver' | 'gestionar' | 'whatsapp' | null>(null);
  const [selectedSocio, setSelectedSocio] = useState<SocioMora | null>(null);
  const [showGestiones, setShowGestiones] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const openModal = (socio: SocioMora, type: 'ver' | 'gestionar' | 'whatsapp') => {
    setSelectedSocio(socio);
    setModal(type);
  };

  const closeModal = () => {
    setModal(null);
    setSelectedSocio(null);
  };

  const handleSocioSelect = (socio: SocioMora, action: 'ver' | 'gestionar' | 'whatsapp') => {
    openModal(socio, action);
  };

  const sociosToShow = sociosMora || [];

  const sociosPaginados = useMemo(() => {
    if (!Array.isArray(sociosToShow)) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sociosToShow.slice(startIndex, endIndex);
  }, [sociosToShow, currentPage, itemsPerPage]);

  const totalPages = Math.ceil((sociosToShow?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAnalista]);

  return (
    <>
    <Layout title="Gestión de Recuperadores" showBackButton={true}>
      <div className="space-y-4">

        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ClipboardList className="w-5 h-5 text-[#0f2d5e]" />
            <h1 className="text-lg font-bold text-gray-800">Gestión de Recuperadores</h1>
            {sociosToShow.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                {sociosToShow.length} socio{sociosToShow.length !== 1 ? 's' : ''} en mora
              </span>
            )}
          </div>

          {(isSuperOrGerente || isRecuperador) && gestionesXEstados && (
            <button
              onClick={() => setShowGestiones(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors shadow-sm"
            >
              <BarChart2 className="w-4 h-4" />
              Ver Reportes de Mora
            </button>
          )}
        </div>

        {/* Buscador de Socios */}
        <BuscadorSocios onSocioSelect={handleSocioSelect} />

        {/* Selector de analistas para RECUPERADOR */}
        {isRecuperador && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <span className="font-medium text-gray-800">Seleccionar Analista</span>
              {selectedAnalista && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="font-medium text-blue-600">SOCIOS EN MORA</span>
                </>
              )}
            </div>

            {!selectedAnalista ? (
              loadingAnalistas ? (
                <p className="text-xs text-gray-400">Cargando analistas de tu agencia...</p>
              ) : (
                <>
                  {/* Vista móvil - Tarjetas */}
                  <div className="block md:hidden space-y-2">
                    {analistas.map((analista) => (
                      <button
                        key={analista.ID_ANA}
                        onClick={() => setSelectedAnalista(analista)}
                        className="w-full text-left p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-xs font-semibold">
                              {analista.ANA_ACTUAL.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">{analista.ANA_ACTUAL}</p>
                            <p className="text-xs text-gray-400">{analista.AGENCIA}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                    {miAnalistaPropio && (
                      <button
                        onClick={() => setSelectedAnalista(miAnalistaPropio)}
                        className="w-full text-center p-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span>📋</span>
                          <span className="text-sm font-medium">Mis Moras</span>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Vista desktop - Grid */}
                  <div className="hidden md:grid grid-cols-2 gap-2">
                    {analistas.map((analista) => (
                      <button
                        key={analista.ID_ANA}
                        onClick={() => setSelectedAnalista(analista)}
                        className="text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                      >
                        <p className="text-sm font-medium text-gray-700 truncate">{analista.ANA_ACTUAL}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{analista.AGENCIA}</p>
                      </button>
                    ))}
                    {miAnalistaPropio && (
                      <button
                        onClick={() => setSelectedAnalista(miAnalistaPropio)}
                        className="col-span-2 text-center p-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span>📋</span>
                          <span className="text-sm font-medium">Mis Moras</span>
                        </div>
                      </button>
                    )}
                  </div>
                </>
              )
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Analista seleccionado</p>
                    <p className="text-sm font-medium text-gray-700">{selectedAnalista.ANA_ACTUAL}</p>
                    <p className="text-xs text-gray-500">Agencia: {selectedAnalista.AGENCIA}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAnalista(null)}
                  className="px-3 py-2 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <span>👥</span> Cambiar Analista
                </button>
              </div>
            )}
          </div>
        )}

        {/* Selector admin → analista (super/gerente/admin) */}
        {isSuperOrGerente && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <span className={`font-medium ${selectedAdmin ? 'text-blue-600' : 'text-gray-800'}`}>
                Recuperadores
              </span>
              {selectedAdmin && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span className="font-medium text-gray-800">SOCIOS EN MORA</span>
                </>
              )}
            </div>

            {!selectedAdmin ? (
              loadingAdmins ? (
                <p className="text-xs text-gray-400">Cargando administradores...</p>
              ) : (
                <>
                  {/* Vista móvil - Tarjetas */}
                  <div className="block md:hidden space-y-3">
                    {administradores.map((admin) => (
                      <button
                        key={admin.NOM_ADMI}
                        onClick={() => setSelectedAdmin(admin)}
                        className="w-full text-left p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm font-semibold">
                              {admin.NOM_ADMI.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{admin.NOM_ADMI}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <span>📍</span> {admin.AGENCIA}
                            </p>
                          </div>
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                            Recuperador
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Vista desktop - Grid */}
                  <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {administradores.map((admin) => (
                      <button
                        key={admin.NOM_ADMI}
                        onClick={() => setSelectedAdmin(admin)}
                        className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-sm font-semibold">
                              {admin.NOM_ADMI.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                            Recuperador
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 mb-1">{admin.NOM_ADMI}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <span>📍</span> {admin.AGENCIA}
                        </p>
                      </button>
                    ))}
                  </div>
                </>
              )
            ) : !selectedAnalista ? (
              <div>
                <button
                  onClick={() => setSelectedAdmin(null)}
                  className="text-xs text-blue-500 hover:text-blue-700 mb-3 flex items-center gap-1"
                >
                  ← Cambiar Recuperador
                </button>
                <p className="text-xs text-gray-500 mb-2">
                  Recuperador: <span className="font-medium text-gray-700">{selectedAdmin.NOM_ADMI}</span> · {selectedAdmin.AGENCIA}
                </p>
                {loadingAnalistas ? (
                  <p className="text-xs text-gray-400">Cargando analistas...</p>
                ) : (
                  <>
                    {/* Vista móvil - Tarjetas */}
                    <div className="block md:hidden space-y-2">
                      {analistas.map((analista) => (
                        <button
                          key={analista.ID_ANA}
                          onClick={() => setSelectedAnalista(analista)}
                          className="w-full text-left p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 text-xs font-semibold">
                                {analista.ANA_ACTUAL.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 truncate">{analista.ANA_ACTUAL}</p>
                              <p className="text-xs text-gray-400">{analista.AGENCIA}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                      {isRecuperador && miAnalistaPropio && (
                        <button
                          onClick={() => setSelectedAnalista(miAnalistaPropio)}
                          className="w-full text-center p-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span>📋</span>
                            <span className="text-sm font-medium">Mis Moras</span>
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Vista desktop - Grid */}
                    <div className="hidden md:grid grid-cols-2 gap-2">
                      {analistas.map((analista) => (
                        <button
                          key={analista.ID_ANA}
                          onClick={() => setSelectedAnalista(analista)}
                          className="text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                        >
                          <p className="text-sm font-medium text-gray-700 truncate">{analista.ANA_ACTUAL}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{analista.AGENCIA}</p>
                        </button>
                      ))}
                      {isRecuperador && miAnalistaPropio && (
                        <button
                          onClick={() => setSelectedAnalista(miAnalistaPropio)}
                          className="col-span-2 text-center p-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-all"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span>📋</span>
                            <span className="text-sm font-medium">Mis Moras</span>
                          </div>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Analista seleccionado</p>
                    <p className="text-sm font-medium text-gray-700">{selectedAnalista.ANA_ACTUAL}</p>
                    <p className="text-xs text-gray-500">De: {selectedAdmin?.NOM_ADMI} - {selectedAdmin?.AGENCIA}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setSelectedAnalista(null)}
                    className="flex-1 px-3 py-2 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <span>👥</span> Cambiar Analista
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAnalista(null);
                      setSelectedAdmin(null);
                    }}
                    className="flex-1 px-3 py-2 text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <span>↺</span> Cambiar Recuperador
                  </button>
                  {isRecuperador && miAnalistaPropio && (
                    <button
                      onClick={() => setSelectedAnalista(miAnalistaPropio)}
                      className="flex-1 px-3 py-2 text-xs bg-cyan-500 text-white hover:bg-cyan-600 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <span>📋</span> Mis Moras
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botón Mis Moras para recuperadores viendo otro analista */}
        {isRecuperador && selectedAnalista && miAnalistaPropio && selectedAnalista.ID_ANA !== miAnalistaPropio.ID_ANA && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Viendo socios de</p>
                <p className="text-sm font-medium text-gray-700">{selectedAnalista.ANA_ACTUAL}</p>
                <p className="text-xs text-gray-500">Agencia: {selectedAnalista.AGENCIA}</p>
              </div>
              <button
                onClick={() => setSelectedAnalista(miAnalistaPropio)}
                className="px-4 py-2 text-sm bg-cyan-500 text-white hover:bg-cyan-600 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>📋</span> Mis Moras
              </button>
            </div>
          </div>
        )}

        {/* Lista socios en mora */}
        {selectedAnalista && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loadingSocios ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                Cargando socios en mora...
              </div>
            ) : sociosToShow.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                Sin socios en mora para este periodo
              </div>
            ) : (
              <>
                {/* Vista móvil - Tarjetas */}
                <div className="block md:hidden space-y-3 p-4">
                  {sociosPaginados.map((socio, i) => {
                    const diasAtraso = Number(socio.CREDITO_MORA.DIAS_ATRASO);
                    return (
                      <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 text-sm mb-1">
                              {socio.CREDITO_MORA.SOCIO}
                            </h3>
                            <p className="text-xs text-gray-500">{socio.CREDITO_MORA.PRODUCTO}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            diasAtraso > 30 ? 'bg-red-100 text-red-700' :
                            diasAtraso > 15 ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {diasAtraso} días
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                          <div>
                            <p className="text-gray-500">Pagaré</p>
                            <p className="font-medium text-gray-800">{socio.CREDITO_MORA.PAGARE}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Por pagar</p>
                            <p className="font-semibold text-gray-800">S/ {socio.CREDITO_MORA.POR_PAGAR.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {socio.GESTION_MORA.length} gestiones
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openModal(socio, 'ver')}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver detalle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openModal(socio, 'gestionar')}
                              className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                              title="Gestionar"
                            >
                              <FileEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openModal(socio, 'whatsapp')}
                              className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Vista desktop - Tabla */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Socio</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pagaré</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Por pagar</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Días</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gestiones</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sociosPaginados.map((socio, i) => {
                        const diasAtraso = Number(socio.CREDITO_MORA.DIAS_ATRASO);
                        return (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-800">{socio.CREDITO_MORA.SOCIO}</p>
                              <p className="text-xs text-gray-400">{socio.CREDITO_MORA.PRODUCTO}</p>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">{socio.CREDITO_MORA.PAGARE}</td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-800">
                              S/ {socio.CREDITO_MORA.POR_PAGAR.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                diasAtraso > 30 ? 'bg-red-100 text-red-700' :
                                diasAtraso > 15 ? 'bg-orange-100 text-orange-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {diasAtraso}d
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs text-gray-500">
                                {socio.GESTION_MORA.length}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => openModal(socio, 'ver')}
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Ver detalle"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openModal(socio, 'gestionar')}
                                  className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Gestionar"
                                >
                                  <FileEdit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openModal(socio, 'whatsapp')}
                                  className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Paginación */}
            {sociosMora.length > itemsPerPage && (
              <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Mostrando {startIndex + 1} - {Math.min(endIndex, sociosMora.length)} de {sociosMora.length} socios
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Anterior
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = index + 1;
                      } else if (currentPage <= 3) {
                        pageNum = index + 1;
                      } else if (currentPage > totalPages - 3) {
                        pageNum = totalPages - 4 + index;
                      } else {
                        pageNum = currentPage - 2 + index;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm rounded ${
                            pageNum === currentPage
                              ? 'bg-cyan-500 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>

    <div>
      {/* Modal Ver */}
      {modal === 'ver' && selectedSocio && (
        <VerSocioModal socio={selectedSocio} onClose={closeModal} />
      )}

      {/* Modal Gestionar */}
      {modal === 'gestionar' && selectedSocio && (
        <GestionarSocioModal socio={selectedSocio} onClose={closeModal} />
      )}

      {/* Modal WhatsApp */}
      {modal === 'whatsapp' && selectedSocio && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">WhatsApp</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600">Función de WhatsApp próximamente disponible</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Reporte de Gestiones ── solo header + GestionesXEstados */}
      {showGestiones && gestionesXEstados && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg shadow-2xl w-full max-w-full md:max-w-8xl max-h-[98vh] overflow-hidden border border-cyan-200">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white">Reporte de Gestiones</h2>
                  <p className="text-cyan-100 text-xs mt-1">Agencia: {gestionesXEstados.AGENCIA}</p>
                </div>
                <button
                  onClick={() => setShowGestiones(false)}
                  className="text-white hover:text-cyan-200 transition-colors duration-200 bg-white bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-30"
                >
                  <span className="text-lg font-bold">×</span>
                </button>
              </div>
            </div>
            <div className="p-2 md:p-4 overflow-y-auto max-h-[calc(95vh-80px)]">
              <GestionesXEstados data={gestionesXEstados} />
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default GestionRecuperadoresPage;