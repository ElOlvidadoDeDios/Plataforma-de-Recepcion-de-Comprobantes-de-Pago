import { SessionManager } from '../../../utils/sessionManager';
import { VoucherData } from '../../../components/pagos_recaudadores/vaucher_pdf';

export interface VoucherPagoConsultaParams {
	pagare: string;
	nroOperacion: string;
	fecha?: string;
	hora?: string;
	dni?: string;
}

export interface VoucherPagoConsultaResponse {
	success: boolean;
	message: string;
	data: {
		found: boolean;
		pagare?: string;
		nro_operacion?: string;
		nro_voucher?: number;
		cod_age?: string;
		cod_caja?: string;
		fecha?: string;
		hora?: string;
		cuenta?: string;
		dni_socio?: string;
		socio?: string;
	} | null;
}

export interface VoucherExtractorUserData {
	id_age?: string;
	agencias?: Array<{
		agencia?: string;
		cod_caja?: string;
		user_caja?: string;
	}>;
}

export interface VoucherExtractorPayload {
	fecha_mov: string;
	cod_age: string;
	cod_caja: string;
	nro_doc: string;
	cuenta: string;
}

const getAuthHeaders = (): HeadersInit => {
	const token = SessionManager.getItem('token');
	const headers: HeadersInit = {
		'Content-Type': 'application/json',
	};

	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}

	return headers;
};


const normalizarFecha = (fecha?: string): string => {
	const valor = fecha?.trim();
	if (!valor) {
		return '';
	}

	if (valor.includes('/')) {
		return valor;
	}

	const partes = valor.split('-');
	if (partes.length === 3) {
		const [anio, mes, dia] = partes;
		return `${dia}/${mes}/${anio}`;
	}

	return valor;
};

const obtenerCodigoCaja = (user?: VoucherExtractorUserData): string => {
	const codCaja = user?.agencias?.find((agencia) => agencia?.cod_caja)?.cod_caja;
	return String(codCaja || '').trim();
};

const obtenerCodigoAgencia = (user?: VoucherExtractorUserData): string => {
	return String(user?.id_age || '').trim();
};

export const buscarVoucherPago = async (
	params: VoucherPagoConsultaParams,
): Promise<VoucherPagoConsultaResponse['data']> => {
	const pagare = params.pagare?.trim();
	const nroOperacion = params.nroOperacion?.trim();

	if (!pagare || !nroOperacion) {
		throw new Error('pagare y nroOperacion son requeridos para consultar el voucher');
	}

	const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
	if (!API_BASE_URL) {
		throw new Error('VITE_API_BASE_URL no está configurada');
	}

	const searchParams = new URLSearchParams({
		pagare,
		nroOperacion,
	});

	// if (params.fecha?.trim()) {
	// 	searchParams.set('fecha', params.fecha.trim());
	// }
	// if (params.hora?.trim()) {
	// 	searchParams.set('hora', params.hora.trim());
	// }
	// if (params.dni?.trim()) {
	// 	searchParams.set('dni', params.dni.trim());
	// }

	const response = await fetch(
		`${API_BASE_URL}/api/comprobantes/voucher-pagos/buscar?${searchParams.toString()}`,
		{
			method: 'GET',
			headers: getAuthHeaders(),
		},
	);

	if (!response.ok) {
		throw new Error(`Error al consultar voucher: ${response.status}`);
	}

	const payload = (await response.json()) as VoucherPagoConsultaResponse;

	if (!payload?.success) {
		throw new Error(payload?.message || 'No se pudo consultar el voucher');
	}

	return payload.data;
};

export const extraerVoucherExterno = async (
	params: VoucherPagoConsultaParams,
	user?: VoucherExtractorUserData,
): Promise<VoucherData> => {
	const voucherLookup = await buscarVoucherPago(params);

	if (!voucherLookup || !voucherLookup.found) {
		throw new Error('No se encontró el voucher para realizar la extracción');
	}

	const payload: VoucherExtractorPayload = {
		fecha_mov: normalizarFecha(voucherLookup.fecha || params.fecha),
		cod_age: String(voucherLookup.cod_age || '').trim() || obtenerCodigoAgencia(user),
		cod_caja: String(voucherLookup.cod_caja || '').trim() || obtenerCodigoCaja(user),
		nro_doc: String(voucherLookup.nro_voucher || '').trim(),
		cuenta: String(voucherLookup.cuenta || '').trim(),
	};

	if (!payload.fecha_mov || !payload.cod_age || !payload.cod_caja || !payload.nro_doc || !payload.cuenta) {
		throw new Error(
			'No se puede construir el payload del voucher: falta fecha_mov, cod_age, cod_caja, nro_doc o cuenta',
		);
	}

	const response = await fetch(`${import.meta.env.VITE_API_BASE_URL_GEODILE}/api_app_dile_v1_1/api/duplicarvoucherPago` as string, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `${import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN}`,
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		throw new Error(`Error al extraer voucher: ${response.status}`);
	}

	const raw = await response.json();
	const voucherData = (raw?.data?.voucher ?? raw?.data ?? raw) as VoucherData | undefined;

	if (!voucherData) {
		throw new Error('La API externa no devolvió datos del voucher');
	}

	return voucherData;
};
