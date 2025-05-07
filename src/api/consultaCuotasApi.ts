import { ConsultaCuota } from '../types/consultaCuotas';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3030/api';

export const fetchAllConsultas = async (): Promise<ConsultaCuota[]> => {
    const response = await fetch(`${API_URL}/consultas-cuotas`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
    });

    if (!response.ok) {
        throw new Error('Error al obtener las consultas');
    }

    const data = await response.json();
    return data.data;
};

export const fetchConsultasByDni = async (dni: string): Promise<ConsultaCuota[]> => {
    const response = await fetch(`${API_URL}/consultas-cuotas/${dni}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
    });

    if (!response.ok) {
        throw new Error('Error al obtener las consultas para este DNI');
    }

    const data = await response.json();
    return data.data;
};