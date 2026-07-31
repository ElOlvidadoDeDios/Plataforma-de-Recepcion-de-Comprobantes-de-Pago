import { AseguramientoPayload, AseguramientoResponse } from '../types';

/**
 * Servicio simulado (mock) de CumpaSeguro.
 * Cuando el backend esté listo, reemplazar el cuerpo de `guardarAseguramiento`
 * por la llamada real (fetch/axios) manteniendo la misma firma, para no
 * tener que tocar el hook ni las páginas que lo consumen.
 */
export const cumpaSeguroService = {
  async guardarAseguramiento(payload: AseguramientoPayload): Promise<AseguramientoResponse> {
    // Simula latencia de red
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Simula persistencia. La fecha se recibe ya en ISO (ver useAseguramiento)
    // y solo se formatea al momento de mostrarla (ver utils/formatFecha).
    const codigo = `CS-${Date.now().toString().slice(-8)}`;

    // eslint-disable-next-line no-console
    console.log('[CumpaSeguro][mock] Registro guardado:', payload);

    return {
      success: true,
      codigo,
      fechaRegistro: payload.fechaRegistro,
    };
  },
};