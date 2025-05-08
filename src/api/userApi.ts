import axios, { AxiosError } from 'axios';
import { User, AgenciaCaja, UserResponse } from '../types';
import { UserRole, UserWithRole, UserStatus, UserStatusText } from '../types/roles';
import { APIError } from '../utils/error';

const LOGIN_API_BASE_URL = import.meta.env.VITE_LOGIN_API_BASE_URL;

// Función para obtener el token del localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Configuración de Axios para incluir el token en cada solicitud
console.log('API Base URL:', LOGIN_API_BASE_URL);

const userApiInstance = axios.create({
  baseURL: LOGIN_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Interceptor para agregar el token y manejar errores
userApiInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log('🔍 Request:', {
      url: config.url,
      method: config.method,
      hasToken: !!token
    });
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
userApiInstance.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Log de configuración inicial
console.log('Configuración inicial de Axios:', {
  baseURL: userApiInstance.defaults.baseURL,
  headers: userApiInstance.defaults.headers
});

// Interceptor para agregar el token en cada petición
userApiInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log('🔍 Detalles de la solicitud:', {
      originalUrl: config.url,
      baseURL: config.baseURL,
      finalUrl: `${config.baseURL}/${config.url}`,
      method: config.method,
      hasToken: !!token
    });
    return config;
  },
  (error) => {
    console.error('❌ Error en interceptor:', error);
    return Promise.reject(error);
  }
);

// Configurar interceptor de solicitudes con mejor manejo de errores y logging
userApiInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    const originalUrl = config.url;
    
    // Verificar y establecer el token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No se encontró token en localStorage');
    }

    // Log detallado de la solicitud saliente
    console.log('🔍 Detalles de la solicitud:', {
      originalUrl,
      baseURL: config.baseURL,
      finalUrl: `${config.baseURL}/${originalUrl}`,
      method: config.method,
      hasToken: !!token,
      data: config.data
    });

    return config;
  },
  (error) => {
    console.error('❌ Error en el interceptor de solicitud:', {
      message: error.message,
      config: error.config
    });
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de token expirado
// Mejorar el interceptor de respuestas con más información de depuración
userApiInstance.interceptors.response.use(
  (response) => {
    console.log('✅ Respuesta exitosa:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    console.error('❌ Error en la respuesta:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    if (error.response?.status === 403) {
      console.log('🔒 Token expirado o inválido');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Función para obtener datos del usuario actual
export const getCurrentUser = async (): Promise<UserWithRole> => {
  try {
    console.log('Iniciando obtención de datos del usuario...');
    const response = await userApiInstance.get<UserResponse>('/user/me');
    
    if (!response.data) {
      throw new Error('No se recibieron datos del usuario');
    }

    const userData = response.data;
    console.log('Datos recibidos:', {
      email: userData.email,
      role: userData.role,
      status: userData.status,
      statusText: userData.statusText,
      hasAgencias: !!userData.agencias,
      agenciasCount: userData.agencias?.length || 0
    });

    // Validar rol
    if (!Object.values(UserRole).includes(userData.role as UserRole)) {
      console.error('Rol no válido recibido:', userData.role);
      throw new Error(`Rol inválido: ${userData.role}`);
    }

    // Convertir la respuesta a UserWithRole
    const userWithRole: UserWithRole = {
      id: userData._id || String(new Date().getTime()),
      email: userData.email || '',
      name: userData.name || '',
      lastName: userData.lastName || '',
      role: userData.role as UserRole,
      dni: userData.dni || '',
      status: userData.status ?? UserStatus.CREATED,
      statusText: userData.status ? UserStatusText[userData.status as UserStatus] : UserStatusText[UserStatus.CREATED],
      agencias: Array.isArray(userData.agencias) ? userData.agencias : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return userWithRole;
  } catch (error) {
    //console.error('Error al obtener datos del usuario:', error);
    if (error instanceof AxiosError) {
      if (error.response?.status === 404) {
        throw new APIError('Usuario no encontrado');
      }
      throw new APIError(`Error al obtener datos: ${error.response?.status}`);
    }
    throw new APIError('Error al obtener datos del usuario');
  }
};

export const fetchAllUsers = async (): Promise<UserResponse[]> => {
  try {
    //console.log('🔍 Obteniendo lista de usuarios...');
    
    interface UsersResponse {
      users?: User[];
    }

    const response = await userApiInstance.get<User[] | UsersResponse>('/users');
    //console.log('✅ Respuesta recibida:', response.data);

    const users = Array.isArray(response.data) ? response.data : (response.data.users || []);
    //console.log('📊 Usuarios encontrados:', users.length);

    return users.map((user: User) => ({
      ...user,
      statusText: user.status ? UserStatusText[user.status] : UserStatusText[UserStatus.CREATED]
    }));
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        'Error al obtener la lista de usuarios',
        error.response?.status
      );
    }
    throw new APIError('Error al obtener la lista de usuarios');
  }
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<UserResponse> => {
  try {
    console.log('🔄 Actualizando rol de usuario:', { userId, newRole: role });
    const response = await userApiInstance.patch<UserResponse>(
      `/change-role/${userId}`,
      { role }
    );

    /*console.log('✅ Rol actualizado exitosamente:', {
      userId,
      newRole: role,
      newStatus: response.data.status,
      statusText: response.data.statusText
    });*/

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar el rol del usuario';

      if (error.response?.status === 400 && errorMessage.includes('eliminado')) {
        throw new APIError('No se puede modificar el rol de un usuario eliminado');
      }

      if (error.response?.status === 403 && errorMessage.includes('SUPER_ADMIN')) {
        throw new APIError('No se puede modificar el rol de un SUPER_ADMIN');
      }
/*
      console.error('❌ Error al actualizar rol:', {
        userId,
        newRole: role,
        status: error.response?.status,
        message: errorMessage
      });*/

      throw new APIError(errorMessage, error.response?.status);
    }
    throw new APIError('Error al actualizar el rol del usuario');
  }
};

export const updateUserStatus = async (userId: string, newStatus: number): Promise<UserResponse> => {
  try {
    //console.log('🔄 Actualizando estado de usuario:', { userId, newStatus });
    
    const response = await userApiInstance.patch<UserResponse>(
      `/users/${userId}/status`,
      { status: newStatus }
    );

    console.log('✅ Estado actualizado:', response.data);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('Error detallado:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        data: error.response?.data,
        url: error.config?.url
      });

      if (error.response?.status === 500) {
        throw new APIError(`Error interno del servidor: ${error.response?.data?.message || 'Desconocido'}`);
      }

      if (error.response?.status === 400) {
        throw new APIError(error.response?.data?.message || 'Error al actualizar el estado del usuario');
      }

      throw new APIError(
        'Error al actualizar el estado del usuario',
        error.response?.status
      );
    }
    throw new APIError('Error al actualizar el estado del usuario');
  }
};
// funcion para  actudlizar las agencias  de un usuario
export const updateUserAgencias = async (userId: string, agencias: AgenciaCaja[]): Promise<UserResponse> => {
  try {
    // Validar y formatear datos
    const agenciasFormateadas = agencias.map(ag => ({
      agencia: String(ag.agencia || '').trim(),
      cod_caja: String(ag.cod_caja || '').trim(),
      user_caja: String(ag.user_caja || '').trim()
    }));

    // Verificar campos requeridos
    const camposIncompletos = agenciasFormateadas.some(ag => !ag.agencia || !ag.cod_caja || !ag.user_caja);
    if (camposIncompletos) {
      throw new APIError('Todos los campos son requeridos', 400);
    }

    // Verificar formato válido
    const formatoInvalido = agenciasFormateadas.some(ag => ag.cod_caja.length < 3 || ag.user_caja.length < 3);
    if (formatoInvalido) {
      throw new APIError('Los códigos deben tener al menos 3 caracteres', 400);
    }

    // Verificar códigos únicos
    const codigos = agenciasFormateadas.map(ag => ag.cod_caja);
    if (new Set(codigos).size !== codigos.length) {
      throw new APIError('Los códigos de caja deben ser únicos', 400);
    }

    console.log('Enviando datos de agencias:', {
      userId,
      agencias: agenciasFormateadas
    });

    const response = await userApiInstance.patch<User>(
      `/users/${userId}/agencias`,
      { agencias: agenciasFormateadas }
    );

    if (!response.data) {
      throw new APIError('Respuesta inválida del servidor', 500);
    }

    console.log('✅ Actualización exitosa:', {
      userId,
      agenciasActualizadas: response.data.agencias?.length || 0,
      agencias: response.data.agencias,
      status: response.status
    });

    return response.data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    if (error instanceof AxiosError) {
      const status = error.response?.status || 500;
      let mensaje = 'Error al actualizar agencias';

      switch (status) {
        case 400:
          mensaje = error.response?.data?.message || 'Datos de agencias inválidos';
          break;
        case 401:
          mensaje = 'No autorizado - Token inválido';
          break;
        case 403:
          mensaje = 'No tienes permisos para realizar esta acción';
          break;
        case 404:
          mensaje = 'Usuario no encontrado';
          break;
        case 409:
          mensaje = 'Conflicto - Códigos de caja duplicados';
          break;
      }

      throw new APIError(mensaje, status);
    }

    throw new APIError('Error interno del servidor', 500);
  }
};
