import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Layout from '../Layout';
import { creditAttentionApi, ClienteMora, fetchCreditAnalysts } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import { jwtDecode } from 'jwt-decode';

// Interface para analista
interface Analista {
  DNI: string;
  NOMBRE: string;
  APE_PAT: string;
  APE_MAT: string;
  RAZON: string;
  CARGO: string;
  ID_AGE: string;
  ID_AGE_ALIAS?: string; // Agregado para agencias especiales como "98"
  NOM_AGENCIA: string;
  ID_ANA: string;
}

const GestionMora = () => {
  const { hasPermission, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [clientes, setClientes] = useState<ClienteMora[]>([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClientes, setFilteredClientes] = useState<ClienteMora[]>([]);
  
  // Estados para la estructura jerárquica
  const [todosLosUsuarios, setTodosLosUsuarios] = useState<Analista[]>([]);
  const [jefes, setJefes] = useState<Analista[]>([]);
  const [analistas, setAnalistas] = useState<Analista[]>([]);
  const [selectedJefe, setSelectedJefe] = useState<string>('');
  const [selectedAnalista, setSelectedAnalista] = useState<string>('');
  const [loadingData, setLoadingData] = useState(false);
  const [showMessage, setShowMessage] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  
  // Estados para los modales
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showGestionModal, setShowGestionModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteMora | null>(null);
  
  // Estados para el formulario de gestión
  const [motivoRetraso, setMotivoRetraso] = useState('');
  const [compromiso, setCompromiso] = useState('');
  const [fechaCompromiso, setFechaCompromiso] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verificar permisos
  if (!hasPermission('canAccessGestionMora')) {
    return (
      <Layout title="Gestión de Mora">
        <div className="h-full w-full bg-gradient-to-br from-slate-50 to-gray-100">
          <div className="max-w-md mx-auto pt-20">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
              <div className="text-center">
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Acceso Denegado</h3>
                <p className="text-gray-600 leading-relaxed">
                  No tienes permisos para acceder a la Gestión de Mora. Contacta con el administrador si necesitas acceso.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Función para obtener datos del token JWT
  const getTokenData = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }
    
    try {
      const decoded: any = jwtDecode(token);
      return {
        id_ana: decoded.id_ana,
        cargo: decoded.cargo,
        id_age: decoded.id_age
      };
    } catch (error) {
      throw new Error('Error al decodificar el token');
    }
  };

  // Función para determinar el rol del usuario actual
  const determinarRolUsuario = () => {
    if (!user) return '';
    return user.role || '';
  };

  // Función para cargar todos los usuarios y filtrarlos
  const cargarTodosLosUsuarios = async () => {
    setLoadingData(true);
    try {
      const todosUsuarios = await fetchCreditAnalysts();
      setTodosLosUsuarios(todosUsuarios);

      const jefesFiltrados = todosUsuarios.filter((u: Analista) => u.CARGO === "04");
      const analistasFiltrados = todosUsuarios.filter((u: Analista) => u.CARGO === "19");
      
      setJefes(jefesFiltrados);
      
      const currentUserRole = determinarRolUsuario();
      setUserRole(currentUserRole);

      if (currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'GERENTE_GENERAL') {
        setAnalistas([]);
      } else if (currentUserRole === 'ADMINISTRADOR') {
        // Para ADMINISTRADOR: solo analistas de su misma agencia
        // Obtener la agencia del usuario actual desde el token
        const tokenData = getTokenData();
        
        if (tokenData.id_age === "98") {

          
          const adminActual = todosUsuarios.find((u: Analista) =>
            u.ID_ANA === tokenData.id_ana && u.ID_AGE === "98"
          );
          
          
          if (adminActual && adminActual.ID_AGE_ALIAS) {
            // Filtrar analistas por el mismo ID_AGE_ALIAS del administrador
            const analistasDeAgencia = analistasFiltrados.filter((analista: Analista) =>
              analista.ID_AGE === "98" && analista.ID_AGE_ALIAS === adminActual.ID_AGE_ALIAS
            );
            setAnalistas(analistasDeAgencia);
          } else {
            // Si no se encuentra el alias, mostrar todos los de agencia 98
            const analistasDeAgencia = analistasFiltrados.filter((analista: Analista) =>
              analista.ID_AGE === "98"
            );
            setAnalistas(analistasDeAgencia);
          }
        } else {
          // Para otras agencias, usar el filtro normal por ID_AGE
          const analistasDeAgencia = analistasFiltrados.filter((analista: Analista) =>
            analista.ID_AGE === tokenData.id_age
          );
          setAnalistas(analistasDeAgencia);
        }
        
        setSelectedJefe('current_user');
      } else if (currentUserRole === 'ANALISTA_CREDITOS_I') {
        setAnalistas([]);
        setSelectedAnalista('current_user');
      }

    } catch (err) {
      setError('Error al cargar lista de usuarios');
    } finally {
      setLoadingData(false);
    }
  };

  // Función para cargar analistas cuando se selecciona un jefe
  const cargarAnalistasPorJefe = (jefeId: string) => {
    if (!jefeId) {
      setAnalistas([]);
      return;
    }

    const jefe = jefes.find(j => j.ID_ANA === jefeId);
    if (!jefe) return;

    const analistasDeAgencia = todosLosUsuarios.filter(u => {
      if (u.CARGO !== "19") return false;
      
      // Caso especial para agencia "98": filtrar por ID_AGE_ALIAS
      if (jefe.ID_AGE === "98") {
        return u.ID_AGE === "98" && u.ID_AGE_ALIAS === jefe.ID_AGE_ALIAS;
      } else {
        // Para otras agencias, usar el filtro normal por ID_AGE
        return u.ID_AGE === jefe.ID_AGE;
      }
    });
    
    setAnalistas(analistasDeAgencia);
    setSelectedAnalista('');
  };

  // Función para cargar clientes en mora
  const cargarClientesEnMora = async () => {
    if (!selectedAnalista) {
      setShowMessage('Seleccione un analista para ver los datos de mora');
      return;
    }

    setIsLoading(true);
    setError('');
    setShowMessage('');

    try {
      let response: any;
      
      if (selectedAnalista === 'current_user') {
        response = await creditAttentionApi.getClientesEnMora();
      } else {
        const analista = analistas.find(a => a.ID_ANA === selectedAnalista);
        if (!analista) {
          throw new Error('Analista no encontrado');
        }
        
        response = await creditAttentionApi.getClientesEnMoraByAnalista({
          ID_ANA: analista.ID_ANA,
          CARGO: analista.CARGO,
          AGENCIA: analista.ID_AGE
        });
      }
      
      // Verificar la nueva estructura de respuesta de la API
      if (response && response.status === false) {
        // Cuando no hay datos en mora
        setShowMessage(response.message || 'No hay datos de mora disponibles');
        setClientes([]);
        setFilteredClientes([]);
      } else if (response && response.status === true && Array.isArray(response.data_mora)) {
        // Cuando sí hay datos en mora
        setClientes(response.data_mora);
        setFilteredClientes(response.data_mora);
        setShowMessage('');
      } else {
        setClientes([]);
        setFilteredClientes([]);
        setShowMessage('No hay datos disponibles');
      }
    } catch (err: any) {
      setError('Error al cargar clientes en mora');
    } finally {
      setIsLoading(false);
    }
  };

  // UseEffects
  useEffect(() => {
    cargarTodosLosUsuarios();
  }, []);

  useEffect(() => {
    if (selectedJefe && selectedJefe !== 'current_user') {
      cargarAnalistasPorJefe(selectedJefe);
    }
  }, [selectedJefe]);

  useEffect(() => {
    if (selectedAnalista) {
      cargarClientesEnMora();
    } else {
      setClientes([]);
      setFilteredClientes([]);
      setShowMessage('');
    }
  }, [selectedAnalista]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredClientes(clientes);
    } else {
      const filtered = clientes.filter(cliente =>
        cliente.CREDITO_MORA.SOCIO.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.CREDITO_MORA.PAGARE.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.CREDITO_MORA.CUENTA.includes(searchTerm)
      );
      setFilteredClientes(filtered);
    }
  }, [searchTerm, clientes]);

  // Función para determinar el estado de mora
const getEstadoMora = (diasAtraso: number) => {
  if (diasAtraso <= 8) {
    return {
      text: 'Normal',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '✅',
      bgGradient: 'from-green-50 to-emerald-50',
    };
  }
  if (diasAtraso <= 30) {
    return {
      text: 'Problemas Potenciales',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: '⚠️',
      bgGradient: 'from-yellow-50 to-amber-50',
    };
  }
  if (diasAtraso <= 60) {
    return {
      text: 'Deficiente',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: '🔶',
      bgGradient: 'from-orange-50 to-red-50',
    };
  }
  if (diasAtraso <= 120) {
    return {
      text: 'Dudoso',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '🚨',
      bgGradient: 'from-red-50 to-pink-50',
    };
  }
  return {
    text: 'Pérdida',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '❌',
    bgGradient: 'from-red-50 to-pink-50',
  };
};

  // Función para obtener estadísticas rápidas
  const getEstadisticas = () => {
    const total = filteredClientes.length;
    const moraTemprana = filteredClientes.filter(c => parseInt(c.CREDITO_MORA.DIAS_ATRASO) <= 30).length;
    const moraMedia = filteredClientes.filter(c => parseInt(c.CREDITO_MORA.DIAS_ATRASO) > 30 && parseInt(c.CREDITO_MORA.DIAS_ATRASO) <= 60).length;
    const moraCritica = filteredClientes.filter(c => parseInt(c.CREDITO_MORA.DIAS_ATRASO) > 60).length;
    const montoTotal = filteredClientes.reduce((sum, c) => sum + parseFloat(c.CREDITO_MORA.SALDO_PRESENTE), 0);

    return { total, moraTemprana, moraMedia, moraCritica, montoTotal };
  };

  const stats = getEstadisticas();

  // Función para abrir modal de detalles
  const abrirModalDetalles = (cliente: ClienteMora) => {
    setSelectedCliente(cliente);
    setShowDetailsModal(true);
  };

  // Función para cerrar modal de detalles
  const cerrarModalDetalles = () => {
    setShowDetailsModal(false);
    setSelectedCliente(null);
  };

  // Función para abrir modal de gestión
  const abrirModalGestion = (cliente: ClienteMora) => {
    setSelectedCliente(cliente);
    // Pre-llenar con datos existentes si los hay
    setMotivoRetraso(cliente.GESTION_MORA.MOTIVO_RETRASO || '');
    setCompromiso(cliente.GESTION_MORA.COMPROMISO || '');
    setFechaCompromiso(cliente.GESTION_MORA.FECHA_COMPROMISO || '');
    setShowGestionModal(true);
  };

  // Función para cerrar modal de gestión
  const cerrarModalGestion = () => {
    setShowGestionModal(false);
    setSelectedCliente(null);
    setMotivoRetraso('');
    setCompromiso('');
    setFechaCompromiso('');
    setIsSubmitting(false);
  };

  // Función para guardar gestión de mora
  const guardarGestionMora = async () => {
    if (!selectedCliente) return;
    
    setIsSubmitting(true);
    try {

      // Simular guardado exitoso
      alert('Gestión de mora guardada exitosamente');
      cerrarModalGestion();
      
      // Recargar datos
      cargarClientesEnMora();
    } catch (error) {
      alert('Error al guardar la gestión de mora');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Gestión de Mora">
      <div className="h-full w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white p-6 rounded-xl shadow-2xl mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">📊 Gestión de Mora</h1>
              <p className="text-blue-100">Monitoreo y gestión de clientes en mora</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-blue-200">Total de casos</div>
            </div>
          </div>
        </div>

        {/* Panel de Filtros Mejorado */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              🔍 Filtros y Búsqueda
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'cards'
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📋 Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📊 Tabla
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Selector de Jefe/Administrador */}
            {(userRole === 'SUPER_ADMIN' || userRole === 'GERENTE_GENERAL') && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  👤 Jefe/Administrador
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  value={selectedJefe}
                  onChange={(e) => {
                    setSelectedJefe(e.target.value);
                    setSelectedAnalista('');
                  }}
                  disabled={loadingData}
                >
                  <option value="">Seleccionar jefe...</option>
                  {jefes.map((jefe) => (
                    <option key={jefe.ID_ANA} value={jefe.ID_ANA}>
                      {jefe.RAZON} - {jefe.NOM_AGENCIA}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Selector de Analista */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                👨‍💼 Analista
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                value={selectedAnalista}
                onChange={(e) => setSelectedAnalista(e.target.value)}
                disabled={loadingData || (userRole === 'SUPER_ADMIN' || userRole === 'GERENTE_GENERAL') && !selectedJefe}
              >
                <option value="">
                  {userRole === 'ANALISTA_CREDITOS_I' ? 'Seleccionar...' : 'Seleccionar analista...'}
                </option>
                {userRole === 'ANALISTA_CREDITOS_I' && (
                  <option value="current_user">📋 Mis datos de mora</option>
                )}
                {analistas.map((analista) => (
                  <option key={analista.ID_ANA} value={analista.ID_ANA}>
                    {analista.RAZON} - {analista.NOM_AGENCIA}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Campo de búsqueda */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                🔍 Buscar Cliente
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:bg-gray-50"
                placeholder={clientes.length > 0 ? "Nombre, pagaré o cuenta..." : "Seleccione un analista primero"}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={clientes.length === 0 && !isLoading}
              />
            </div>
            
            {/* Botón de actualizar */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                🔄 Acciones
              </label>
              <button
                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                onClick={cargarClientesEnMora}
                disabled={isLoading || !selectedAnalista}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Actualizando...
                  </span>
                ) : (
                  '🔄 Actualizar'
                )}
              </button>
            </div>
          </div>
          
          {/* Información del estado actual */}
          <div className="mt-6 space-y-3">
            {loadingData && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-blue-800 font-medium">Cargando datos...</span>
                </div>
              </div>
            )}
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-red-600 font-medium">❌ {error}</span>
                </div>
              </div>
            )}
            
            {showMessage && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-blue-800 font-medium">ℹ️ {showMessage}</span>
                </div>
              </div>
            )}
            
            {!selectedAnalista && !loadingData && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-gray-700">
                  <strong>📋 Instrucciones:</strong> {' '}
                  {userRole === 'SUPER_ADMIN' || userRole === 'GERENTE_GENERAL'
                    ? 'Seleccione un jefe/administrador y luego un analista. Los datos se cargarán automáticamente.'
                    : userRole === 'ADMINISTRADOR'
                    ? 'Seleccione un analista de su agencia. Los datos se cargarán automáticamente.'
                    : 'Seleccione "Mis datos". Los datos se cargarán automáticamente.'
                  }
                </p>
              </div>
            )}
            
            {selectedAnalista && !isLoading && clientes.length > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <span className="text-green-800 font-medium">
                    ✅ Se encontraron {clientes.length} registros de mora. 
                    {searchTerm && ` Mostrando ${filteredClientes.length} resultados filtrados.`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        {filteredClientes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Casos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="text-2xl">📊</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-md border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Mora Temprana</p>
                  <p className="text-2xl font-bold text-yellow-700">{stats.moraTemprana}</p>
                </div>
                <div className="text-2xl">⚠️</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-md border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Mora Media</p>
                  <p className="text-2xl font-bold text-orange-700">{stats.moraMedia}</p>
                </div>
                <div className="text-2xl">🔶</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-md border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Mora Crítica</p>
                  <p className="text-2xl font-bold text-red-700">{stats.moraCritica}</p>
                </div>
                <div className="text-2xl">🚨</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-md border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Monto Total</p>
                  <p className="text-lg font-bold text-blue-700">S/ {stats.montoTotal.toFixed(2)}</p>
                </div>
                <div className="text-2xl">💰</div>
              </div>
            </div>
          </div>
        )}

        {/* Contenido Principal */}
        {viewMode === 'cards' ? (
          /* Vista de Cards */
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-600 font-medium">Cargando datos...</p>
                </div>
              </div>
            ) : filteredClientes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {showMessage || (clientes.length === 0 ? 'No hay clientes en mora' : 'No se encontraron resultados')}
                </h3>
                <p className="text-gray-600">
                  {clientes.length === 0 
                    ? 'Seleccione un analista para ver los datos de mora.'
                    : 'Intente ajustar los filtros de búsqueda.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClientes.map((cliente, index) => {
                  const estadoMora = getEstadoMora(parseInt(cliente.CREDITO_MORA.DIAS_ATRASO));
                  return (
                    <div key={`${cliente.CREDITO_MORA.CUENTA}-${index}`} 
                         className={`bg-gradient-to-br ${estadoMora.bgGradient} rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${estadoMora.color} overflow-hidden`}>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {cliente.CREDITO_MORA.SOCIO}
                            </h3>
                            <p className="text-sm text-gray-600">{cliente.CREDITO_MORA.PRODUCTO}</p>
                          </div>
                          <div className="text-2xl">{estadoMora.icon}</div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Pagaré:</span>
                            <span className="font-semibold text-gray-900">{cliente.CREDITO_MORA.PAGARE}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Cuenta:</span>
                            <span className="font-semibold text-gray-900">{cliente.CREDITO_MORA.CUENTA}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Días atraso:</span>
                            <span className="font-bold text-lg text-gray-900">{cliente.CREDITO_MORA.DIAS_ATRASO} días</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Saldo:</span>
                            <span className="font-bold text-lg text-gray-900">
                              S/ {parseFloat(cliente.CREDITO_MORA.SALDO_PRESENTE).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4 mb-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${estadoMora.color}`}>
                            {estadoMora.text}
                          </span>
                        </div>
                        
                        <div className="flex space-x-2 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => abrirModalDetalles(cliente)}
                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm font-medium"
                          >
                            👁️ Ver detalles
                          </button>
                          <button
                            onClick={() => abrirModalGestion(cliente)}
                            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm font-medium"
                          >
                            ⚡ Gestionar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Vista de Tabla */
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      👤 Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                         Pagaré
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                         Cuenta
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                         Días Atraso
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                         Saldo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                         Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center">
                        <div className="flex justify-center items-center">
                          <svg className="animate-spin h-8 w-8 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-gray-600 font-medium">Cargando datos...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredClientes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center">
                        <div className="text-gray-500">
                          <div className="text-4xl mb-2">📋</div>
                          <div className="font-medium">
                            {showMessage || (clientes.length === 0 ? 'No hay clientes en mora' : 'No se encontraron resultados')}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredClientes.map((cliente, index) => {
                      const estadoMora = getEstadoMora(parseInt(cliente.CREDITO_MORA.DIAS_ATRASO));
                      return (
                        <tr key={`${cliente.CREDITO_MORA.CUENTA}-${index}`} 
                            className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {cliente.CREDITO_MORA.SOCIO.charAt(0)}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-bold text-gray-900">
                                  {cliente.CREDITO_MORA.SOCIO}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {cliente.CREDITO_MORA.PRODUCTO}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {cliente.CREDITO_MORA.PAGARE}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {cliente.CREDITO_MORA.CUENTA}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-bold text-gray-900">
                                {cliente.CREDITO_MORA.DIAS_ATRASO} días
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">
                              S/ {parseFloat(cliente.CREDITO_MORA.SALDO_PRESENTE).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border-2 ${estadoMora.color}`}>
                              {estadoMora.icon} {estadoMora.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => abrirModalDetalles(cliente)}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-xs font-medium"
                              >
                                👁️ Ver
                              </button>
                              <button
                                onClick={() => abrirModalGestion(cliente)}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200 text-xs font-medium"
                              >
                                ⚡ Gestionar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de Detalles */}
        {showDetailsModal && selectedCliente && ReactDOM.createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    📋 Detalles del Cliente en Mora
                  </h2>
                  <button
                    onClick={cerrarModalDetalles}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Información del Crédito */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    🏦 Información del Crédito
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700">Cliente:</label>
                      <p className="text-gray-900 font-semibold">{selectedCliente.CREDITO_MORA.SOCIO}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700">Producto:</label>
                      <p className="text-gray-900">{selectedCliente.CREDITO_MORA.PRODUCTO}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700">Pagaré:</label>
                      <p className="text-gray-900 font-mono">{selectedCliente.CREDITO_MORA.PAGARE}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700">Cuenta:</label>
                      <p className="text-gray-900 font-mono">{selectedCliente.CREDITO_MORA.CUENTA}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700">Fecha Otorgado:</label>
                      <p className="text-gray-900">{new Date(selectedCliente.CREDITO_MORA.OTORGA).toLocaleDateString('es-PE')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700">Días en Atraso:</label>
                      <p className="text-red-600 font-bold text-lg">{selectedCliente.CREDITO_MORA.DIAS_ATRASO} días</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-blue-700">Saldo Presente:</label>
                      <p className="text-red-600 font-bold text-xl">S/ {parseFloat(selectedCliente.CREDITO_MORA.SALDO_PRESENTE).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Información de Gestión de Mora */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-5 border border-amber-200">
                  <h3 className="text-lg font-semibold text-amber-900 mb-4 flex items-center">
                    📊 Gestión de Mora
                  </h3>
                  
                  {selectedCliente.GESTION_MORA.ID_GESTION ? (
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 border border-amber-200">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-amber-700">ID Gestión:</label>
                            <p className="text-gray-900 font-mono">{selectedCliente.GESTION_MORA.ID_GESTION}</p>
                          </div>
                          
                          {selectedCliente.GESTION_MORA.MOTIVO_RETRASO && (
                            <div>
                              <label className="block text-sm font-medium text-amber-700">Motivo del Retraso:</label>
                              <p className="text-gray-900 bg-gray-50 p-3 rounded border">{selectedCliente.GESTION_MORA.MOTIVO_RETRASO}</p>
                            </div>
                          )}
                          
                          {selectedCliente.GESTION_MORA.COMPROMISO && (
                            <div>
                              <label className="block text-sm font-medium text-amber-700">Compromiso:</label>
                              <p className="text-gray-900 bg-gray-50 p-3 rounded border">{selectedCliente.GESTION_MORA.COMPROMISO}</p>
                            </div>
                          )}
                          
                          {selectedCliente.GESTION_MORA.FECHA_COMPROMISO && (
                            <div>
                              <label className="block text-sm font-medium text-amber-700">Fecha de Compromiso:</label>
                              <p className="text-gray-900 font-semibold">{new Date(selectedCliente.GESTION_MORA.FECHA_COMPROMISO).toLocaleDateString('es-PE')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">📝</div>
                      <p className="text-amber-700 font-medium">Sin gestión registrada</p>
                      <p className="text-amber-600 text-sm">Este cliente aún no tiene registros de gestión de mora.</p>
                    </div>
                  )}
                </div>

                {/* Estado de Mora */}
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-5 border border-red-200">
                  <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                    ⚠️ Estado de Mora
                  </h3>
                  <div className="text-center">
                    {(() => {
                      const estado = getEstadoMora(parseInt(selectedCliente.CREDITO_MORA.DIAS_ATRASO));
                      return (
                        <div>
                          <div className="text-4xl mb-2">{estado.icon}</div>
                          <span className={`px-4 py-2 rounded-full text-lg font-semibold ${estado.color}`}>
                            {estado.text}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-xl">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cerrarModalDetalles}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => {
                      cerrarModalDetalles();
                      abrirModalGestion(selectedCliente);
                    }}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                  >
                    ⚡ Gestionar
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Modal de Gestión de Mora */}
        {showGestionModal && selectedCliente && ReactDOM.createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    ⚡ Gestionar Mora - {selectedCliente.CREDITO_MORA.SOCIO}
                  </h2>
                  <button
                    onClick={cerrarModalGestion}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); guardarGestionMora(); }} className="p-6 space-y-6">
                {/* Información resumida del cliente */}
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Pagaré:</span>
                      <span className="ml-2 font-mono">{selectedCliente.CREDITO_MORA.PAGARE}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Cuenta:</span>
                      <span className="ml-2 font-mono">{selectedCliente.CREDITO_MORA.CUENTA}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Días atraso:</span>
                      <span className="ml-2 font-bold text-red-600">{selectedCliente.CREDITO_MORA.DIAS_ATRASO} días</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Saldo:</span>
                      <span className="ml-2 font-bold text-red-600">S/ {parseFloat(selectedCliente.CREDITO_MORA.SALDO_PRESENTE).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Formulario de gestión */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📝 Motivo del Retraso <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={motivoRetraso}
                      onChange={(e) => setMotivoRetraso(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={3}
                      placeholder="Describa el motivo del retraso en el pago..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🤝 Compromiso del Cliente <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={compromiso}
                      onChange={(e) => setCompromiso(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={3}
                      placeholder="Detalle el compromiso de pago acordado con el cliente..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📅 Fecha de Compromiso <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={fechaCompromiso}
                      onChange={(e) => setFechaCompromiso(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-6 -mb-6 -mx-6 px-6 pb-6 rounded-b-xl">
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={cerrarModalGestion}
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSubmitting || !motivoRetraso.trim() || !compromiso.trim() || !fechaCompromiso}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Guardando...
                        </span>
                      ) : (
                        '💾 Guardar Gestión'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>
    </Layout>
  );
};

export default GestionMora;