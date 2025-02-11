import axios, { AxiosError } from 'axios';
import { User } from '../types';
import { UserRole } from '../types/roles';
import { APIError } from '../utils/error';

const LOGIN_API_BASE_URL = import.meta.env.VITE_LOGIN_API_BASE_URL;

// Log para depuración en producción
console.log('API Base URL:', LOGIN_API_BASE_URL);

// Función para obtener el token del localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Configuración de Axios para incluir el token en cada solicitud
const userApiInstance = axios.create({
  baseURL: LOGIN_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

userApiInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const fetchAllUsers = async () => {
  try {
    console.log('Iniciando fetchAllUsers');
    const response = await userApiInstance.get('/users');
    console.log('Respuesta de la API:', response);
    console.log('Tipo de response.data:', typeof response.data);
    console.log('Es un array?', Array.isArray(response.data));
    console.log('Contenido de response.data:', response.data);
    
    // Verifica si la data es un array o está dentro de un objeto
    const users = Array.isArray(response.data) ? response.data : response.data.users || [];
    console.log('Users procesados:', users);
    return users;
  } catch (error) {
    console.error('Error en fetchAllUsers:', error);
    if (error instanceof AxiosError) {
      throw new APIError(
        error.response?.data?.message || 'Error al obtener la lista de usuarios',
        error.response?.status
      );
    }
    throw new APIError('Error al obtener la lista de usuarios');
  }
};

export const updateUserRole = async (userId: string, role: UserRole) => {
  try {
    console.log('Enviando actualización de rol:', { userId, role });
    const response = await userApiInstance.patch<User>(
      `change-role/${userId}`,
      { role }
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error('Error en la respuesta:', error.response?.data);
      throw new APIError(
        error.response?.data?.message || 'Error al actualizar el rol del usuario',
        error.response?.status
      );
    }
    throw new APIError('Error al actualizar el rol del usuario');
  }
};

export const toggleUserStatus = async (userId: string) => {
  try {
    const response = await userApiInstance.patch<User>(`toggle-status/${userId}`, {});
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        error.response?.data?.message || 'Error al actualizar el estado del usuario',
        error.response?.status
      );
    }
    throw new APIError('Error al actualizar el estado del usuario');
  }
};

export const toggleEmailBlock = async (userId: string) => {
  try {
    const response = await userApiInstance.patch<User>(`toggle-email-block/${userId}`);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        error.response?.data?.message || 'Error al cambiar el estado del correo del usuario',
        error.response?.status
      );
    }
    throw new APIError('Error al cambiar el estado del correo del usuario');
  }
};

export const deleteUser = async (userId: string, permanent: boolean = false) => {
  try {
    const endpoint = permanent ? `users/${userId}/permanent` : `users/${userId}`;
    const response = await userApiInstance.delete(endpoint);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        error.response?.data?.message || 'Error al eliminar el usuario',
        error.response?.status
      );
    }
    throw new APIError('Error al eliminar el usuario');
  }
};
