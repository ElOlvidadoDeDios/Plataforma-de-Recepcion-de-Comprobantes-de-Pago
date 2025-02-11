import axios, { AxiosError } from 'axios';
import { User } from '../types';
import { UserRole } from '../types/roles';
import { APIError } from '../utils/error';

const LOGIN_API_BASE_URL = import.meta.env.VITE_LOGIN_API_BASE_URL;

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

export const fetchAllUsers = async (): Promise<User[]> => {
  try {
    const response = await userApiInstance.get('/users');
    return Array.isArray(response.data) ? response.data : response.data.users || [];
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

export const updateUserRole = async (userId: string, role: UserRole): Promise<User> => {
  try {
    const response = await userApiInstance.patch<User>(
      `change-role/${userId}`,
      { role }
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        'Error al actualizar el rol del usuario',
        error.response?.status
      );
    }
    throw new APIError('Error al actualizar el rol del usuario');
  }
};

export const toggleUserStatus = async (userId: string): Promise<User> => {
  try {
    const response = await userApiInstance.patch<User>(`toggle-status/${userId}`, {});
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        'Error al actualizar el estado del usuario',
        error.response?.status
      );
    }
    throw new APIError('Error al actualizar el estado del usuario');
  }
};

export const toggleEmailBlock = async (userId: string): Promise<User> => {
  try {
    const response = await userApiInstance.patch<User>(`toggle-email-block/${userId}`);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        'Error al cambiar el estado del correo del usuario',
        error.response?.status
      );
    }
    throw new APIError('Error al cambiar el estado del correo del usuario');
  }
};

export const deleteUser = async (userId: string, permanent: boolean = false): Promise<void> => {
  try {
    const endpoint = permanent ? `users/${userId}/permanent` : `users/${userId}`;
    await userApiInstance.delete(endpoint);
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new APIError(
        'Error al eliminar el usuario',
        error.response?.status
      );
    }
    throw new APIError('Error al eliminar el usuario');
  }
};
