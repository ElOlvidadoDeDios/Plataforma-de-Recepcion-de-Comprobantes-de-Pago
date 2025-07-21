import { ConsultaCuota } from '../types/consultaCuotas';
import { SessionManager } from '../utils/sessionManager';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchAllConsultas = async (): Promise<ConsultaCuota[]> => {
    const response = await fetch(`${API_URL}/api/consultas-cuotas`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SessionManager.getItem('token')}`
        },
    });

    if (!response.ok) {
        throw new Error('Error al obtener las consultas');
    }

    const data = await response.json();
    return data.data;
};

export const fetchConsultasByDni = async (dni: string): Promise<ConsultaCuota[]> => {
    const response = await fetch(`${API_URL}/api/consultas-cuotas/dni/${dni}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SessionManager.getItem('token')}`
        },
    });

    if (!response.ok) {
        throw new Error('Error al obtener las consultas para este DNI');
    }

    const data = await response.json();
    return data.data;
};


export const fetchConsultasByDniAndPagare = async (dni: string, pagare: string): Promise<ConsultaCuota[]> => {
    const response = await fetch(`${API_URL}/api/consultas-cuotas/dni/${dni}/pagare/${pagare}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SessionManager.getItem('token')}`
        },
    });

    if (!response.ok) {
        throw new Error('Error al obtener las consultas para este DNI y pagaré');
    }

    const data = await response.json();
    return data.data;
};

export const fetchConsultasByFecha = async (fechas: { fechaInicio: string, fechaFin: string }): Promise<ConsultaCuota[]> => {
    const response = await fetch(`${API_URL}/api/consultas-cuotas/fecha`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SessionManager.getItem('token')}`
        },
        body: JSON.stringify(fechas)
    });

    if (!response.ok) {
        throw new Error('Error al obtener las consultas por fecha');
    }

    const data = await response.json();
    return data.data;
};
