import { ConsultaCuota } from '../types/consultaCuotas';
import { SessionManager } from '../utils/sessionManager';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const mapComprobanteToConsultaCuota = (item: any): ConsultaCuota => ({
    _id: item._id,
    dni: item.dni || '',
    pagare: item.creditoId || '',
    numeroCuotas: item.cuotasVencidasCantidad || '',
    totalPagar: item.cuotasVencidasTotalAPagar || '',
    estado: item.estadoGeneral || '',
    nombreSocio: item.nombreSocio || '',
    celular: item.numero_cel || '',
    ip_origen: item.ip_origen || '',
    fecha: item.fecha || '',
    hora: item.hora || '',
    cuotas_detalle: item.cuotas_detalle || [],
    creditosDisponibles: item.creditosDisponibles || null,
    telefonos: item.telefonos || [],
    comprobantebase_64: item.comprobantebase_64 || [],
});

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

export const fetchMisPagosByRangoFechas = async (
    fechaInicio: string,
    fechaFin: string,
): Promise<ConsultaCuota[]> => {
    const response = await fetch(
        `${API_URL}/api/comprobantes/pagos/rango?fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFin=${encodeURIComponent(fechaFin)}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SessionManager.getItem('token')}`,
            },
        },
    );

    if (!response.ok) {
        throw new Error('Error al obtener mis pagos por rango de fechas');
    }

    const data = await response.json();
    return (data.comprobantes || []).map(mapComprobanteToConsultaCuota);
};

export const fetchMisPagosByRangoFechasYAnalista = async (
    idAnalistaActual: string,
    fechaInicio: string,
    fechaFin: string,
): Promise<ConsultaCuota[]> => {
    const response = await fetch(
        `${API_URL}/api/comprobantes/pagos/rango/analista/${encodeURIComponent(idAnalistaActual)}?fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFin=${encodeURIComponent(fechaFin)}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SessionManager.getItem('token')}`,
            },
        },
    );

    if (!response.ok) {
        throw new Error('Error al obtener mis pagos por analista y fechas');
    }

    const data = await response.json();
    return (data.comprobantes || []).map(mapComprobanteToConsultaCuota);
};
