import axios, { AxiosError } from 'axios';
import logger from '../utils/logger';
import { User, AgenciaCaja, UserResponse } from '../types';
import { UserRole, UserWithRole, UserStatus, UserStatusText } from '../types/roles';
import { APIError } from '../utils/error';
import { withCache, clearCache } from '../utils/cache';
import { SessionManager } from '../utils/sessionManager';

const LOGIN_API_BASE_URL = import.meta.env.VITE_LOGIN_API_BASE_URL;

const getToken = () => {
  return SessionManager.getItem('token');
};

const userApiInstance = axios.create({
  baseURL: LOGIN_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Nueva instancia para endpoints sin prefijo /auth (números de celular)
// LOGIN_API_BASE_URL incluye /auth, necesitamos removerlo
const BASE_API_URL = LOGIN_API_BASE_URL.replace('/auth', '');
const numeroCelularApiInstance = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptores para numeroCelularApiInstance (mismos que userApiInstance)
numeroCelularApiInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Logs desactivados para reducir ruido en consola
    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      logger.error('❌ Request error (NumCel):', error);
    }
    return Promise.reject(error);
  }
);

numeroCelularApiInstance.interceptors.response.use(
  (response) => {
    // Logs desactivados para reducir ruido en consola
    return response;
  },
  async (error) => {
    // Logs desactivados para reducir ruido en consola
    if (error.response?.status === 403) {
      SessionManager.removeItem('token');
      SessionManager.removeItem('user');
      clearCache();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

userApiInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Logs desactivados para reducir ruido en consola
    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      logger.error('❌ Request error:', error);
    }
    return Promise.reject(error);
  }
);

userApiInstance.interceptors.response.use(
  (response) => {
    // Logs desactivados para reducir ruido en consola
    return response;
  },
  async (error) => {
    // Logs desactivados para reducir ruido en consola
    if (error.response?.status === 403) {
      SessionManager.removeItem('token');
      SessionManager.removeItem('user');
      clearCache(); // Limpiar caché cuando el token expire
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getCurrentUser = async (): Promise<UserWithRole> => {
  return withCache('currentUser', async () => {
    try {
      const response = await userApiInstance.get<UserResponse>('user/me');
    
    if (!response.data) {
      throw new Error('No se recibieron datos del usuario');
    }

    const userData = response.data;

    if (!Object.values(UserRole).includes(userData.role as UserRole)) {
      throw new Error(`Rol inválido: ${userData.role}`);
    }

    const userWithRole: UserWithRole = {
      _id: userData._id || String(new Date().getTime()),
      email: userData.email || '',
      razon: userData.razon || '',
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
    if (error instanceof AxiosError) {
      if (error.response?.status === 404) {
        throw new APIError('Usuario no encontrado');
      }
      throw new APIError(`Error al obtener datos: ${error.response?.status}`);
    }
    throw new APIError('Error al obtener datos del usuario');
  }
  }, 5); // Cache por 5 minutos
};

export const fetchAllUsers = async (): Promise<UserResponse[]> => {
  return withCache('allUsers', async () => {
    try {
      interface UsersResponse {
        users?: User[];
      }

      const response = await userApiInstance.get<User[] | UsersResponse>('users');
    const users = Array.isArray(response.data) ? response.data : (response.data.users || []);

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
  }, 2); // Cache por 2 minutos
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<UserResponse> => {
  try {
    const response = await userApiInstance.patch<UserResponse>(
      `change-role/${userId}`,
      { role }
    );

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar el rol del usuario';

      // 🔧 Manejo mejorado de errores específicos
      switch (error.response?.status) {
        case 400:
          if (errorMessage.includes('eliminado')) {
            throw new APIError('No se puede modificar el rol de un usuario eliminado');
          }
          if (errorMessage.includes('propio rol')) {
            throw new APIError('No puedes cambiar tu propio rol. Solicita a otro administrador.');
          }
          throw new APIError(errorMessage);
          
        case 401:
          throw new APIError('No tienes permisos para realizar esta operación');
          
        case 403:
          throw new APIError('Acceso denegado. No tienes los permisos necesarios para esta acción.');
          
        case 404:
          throw new APIError('Usuario no encontrado');
          
        default:
          throw new APIError(errorMessage, error.response?.status);
      }
    }
    throw new APIError('Error al actualizar el rol del usuario');
  }
};

export const updateUserStatus = async (userId: string, newStatus: number): Promise<UserResponse> => {
  try {
    const response = await userApiInstance.patch<UserResponse>(
      `users/${userId}/status`,
      { status: newStatus }
    );

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
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

export const updateUserAgencias = async (userId: string, agencias: AgenciaCaja[]): Promise<UserResponse> => {
  try {
    const agenciasFormateadas = agencias.map(ag => ({
      agencia: String(ag.agencia || '').trim(),
      cod_caja: String(ag.cod_caja || '').trim(),
      user_caja: String(ag.user_caja || '').trim()
    }));

    // 🔧 Solo validar si hay agencias para validar
    if (agenciasFormateadas.length > 0) {
      const camposIncompletos = agenciasFormateadas.some(ag => !ag.agencia || !ag.cod_caja || !ag.user_caja);
      if (camposIncompletos) {
        throw new APIError('Todos los campos son requeridos', 400);
      }

      const formatoInvalido = agenciasFormateadas.some(ag => ag.cod_caja.length < 3 || ag.user_caja.length < 3);
      if (formatoInvalido) {
        throw new APIError('Los códigos deben tener al menos 3 caracteres', 400);
      }

      const codigos = agenciasFormateadas.map(ag => ag.cod_caja);
      if (new Set(codigos).size !== codigos.length) {
        throw new APIError('Los códigos de caja deben ser únicos', 400);
      }
    }

    const requestPayload = { agencias: agenciasFormateadas };

    const response = await userApiInstance.patch<User>(
      `users/${userId}/agencias`,
      requestPayload
    );

    if (!response.data) {
      throw new APIError('Respuesta inválida del servidor', 500);
    }

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

export const updateUserComplete = async (
  userId: string,
  updateData: {
    email?: string;
    razon?: string;
    dni?: string;
    cargo?: string;
    user?: string;
    id_ana?: string;
    id_age?: string;
    password?: string;
    status?: number;
    role?: string;
    agencias?: {
      agencia: string;
      cod_caja: string;
      user_caja: string;
    }[];
    permissions?: string[];
  }
): Promise<UserResponse> => {
  try {
    const response = await userApiInstance.patch<UserResponse>(
      `users/${userId}`,
      updateData
    );

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status || 500;
      let mensaje = 'Error al actualizar el usuario';

      switch (status) {
        case 400:
          mensaje = error.response?.data?.message || 'Datos inválidos';
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
          mensaje = 'Conflicto - El email ya está en uso';
          break;
      }

      throw new APIError(mensaje, status);
    }

    throw new APIError('Error al actualizar el usuario', 500);
  }
};

/**
 * Obtiene los datos completos de un usuario específico
 */
export const fetchUserById = async (userId: string): Promise<UserResponse> => {
  try {
    const response = await userApiInstance.get<UserResponse>(
      `users/${userId}`
    );

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status || 500;
      let mensaje = 'Error al obtener los datos del usuario';

      switch (status) {
        case 404:
          mensaje = 'Usuario no encontrado';
          break;
        case 401:
          mensaje = 'No autorizado - Token inválido';
          break;
        case 403:
          mensaje = 'No tienes permisos para ver este usuario';
          break;
      }

      throw new APIError(mensaje, status);
    }

    throw new APIError('Error al obtener los datos del usuario', 500);
  }
};

// Función para obtener todos los usuarios externos (ahora desde tu backend)
export async function fetchAllExternalUsers() {
  try {

    const response = await userApiInstance.get('users/external/all');

    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else {
      return [];
    }
  } catch (error) {
    throw error;
  }
}

// Función para obtener analistas de crédito (ahora desde tu backend)
export async function fetchCreditAnalysts() {
  try {

    const response = await userApiInstance.get('users/external/credit-analysts');

    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else {
      return [];
    }
  } catch (error) {
    throw error;
  }
}

// Consulta datos de usuario externo por DNI (ahora desde tu backend)
export async function fetchUserDataByDni(dni: string) {
  try {
    const response = await userApiInstance.get(`users/external/dni/${dni}`);

    if (response.data) {
      return response.data;
    } else {
      return null;
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

// Función para obtener los números de celular del usuario autenticado (usa token JWT del sistema)
export async function getMisNumerosCelular(): Promise<{
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    numero_celular: string;
    tipo: 'principal' | 'secundario';
    fecha_creacion: string;
    fecha_actualizacion: string;
  }>
}> {
  try {
    // Usa numeroCelularApiInstance que tiene la URL sin /auth
    const response = await numeroCelularApiInstance.get('numeros-celular/mis-numeros');
    return response.data;
  } catch (error: any) {
    if (import.meta.env.DEV) {
      logger.error('Error al obtener mis números de celular:', error);
    }
    
    throw new APIError(
      error.response?.data?.message || 'Error al obtener números de celular',
      error.response?.status
    );
  }
}

// Función para obtener números de celular por DNI (usa token JWT del sistema, requiere autenticación)
export async function getNumerosCelularByDni(dni: string): Promise<{
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    dni: string;
    numero_celular: string;
    tipo: 'principal' | 'secundario';
    activo: boolean;
    creado_por: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
  }>
}> {
  try {
    // Usa numeroCelularApiInstance que tiene la URL sin /auth
    const response = await numeroCelularApiInstance.get(`numeros-celular/consultar/${dni}`);
    return response.data;
  } catch (error: any) {
    if (import.meta.env.DEV) {
      logger.error('Error al obtener números de celular por DNI:', error);
    }
    
    throw new APIError(
      error.response?.data?.message || 'Error al obtener números de celular',
      error.response?.status
    );
  }
}

