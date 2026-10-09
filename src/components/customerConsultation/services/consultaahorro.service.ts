export interface DatosSocioAhorro {
	nro_di: string;
	nombres: string;
	apellido_pat: string;
	apellido_mat: string;
	edad: number;
	estado_civil: string;
	email: string;
	telefono: string;
}

export interface DemograficaAhorro {
	direccion: string;
	departamento: string;
	provincia: string;
	distrito: string;
}

export interface CuentaAhorroDetalle {
	cta_aho: string;
	producto: string;
	saldo_actual: number;
	saldo_interes: number;
	tea: number;
	fecha_apert: string;
	fecha_ult_mov: string;
	tipo_cta: string;
	caracter: string;
	estado: string;
}

export interface DetalleCuentaAhorroData {
	datos_socio: DatosSocioAhorro;
	demografica: DemograficaAhorro;
	cuentas_ahorro: CuentaAhorroDetalle[];
}

export interface DetalleCuentaAhorroResponse {
	status: boolean;
	message: string;
	data: DetalleCuentaAhorroData;
}

export const getDetalleCuentaAhorroSocio = async (
	cuenta: string,
): Promise<DetalleCuentaAhorroData> => {
	if (!cuenta?.trim()) {
		throw new Error('La cuenta es requerida para consultar el detalle de ahorro');
	}

	const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE;
    const API_KEY = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;
	const response = await fetch(
		`${API_BASE_URL}/api_app_dile_v1_1/api/detalleCuentaAhorroSocio`,
		{
			method: 'POST',
			headers: {
                'Content-Type': 'application/json',
                'Authorization': `${API_KEY}`
            },
			body: JSON.stringify({ cuenta: cuenta.trim() }),
		},
	);

	if (!response.ok) {
		throw new Error(`Error al consultar detalle de ahorro: ${response.status}`);
	}

	const payload = (await response.json()) as DetalleCuentaAhorroResponse;

	if (!payload?.status || !payload?.data) {
		throw new Error(payload?.message || 'No se pudo obtener el detalle de cuenta de ahorro');
	}

	return payload.data;
};
