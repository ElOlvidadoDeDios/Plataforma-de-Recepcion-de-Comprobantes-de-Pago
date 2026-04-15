import { SessionManager } from "../utils/sessionManager";

// Interface de respuesta para validación de origen - Frontend
export type EstadoValidacion =
  | 'APROBADO_ORIGEN_COINCIDE'              // ✅ Pagador habitual + ES titular
  | 'APROBADO_PAGADOR_HABITUAL_NO_TITULAR'  // ✅ Pagador habitual + NO es titular
  | 'APROBADO_ORIGEN_NUEVO'                 // ✅ Primer pago, nunca visto
  | 'APROBADO_SOCIO_PAGO_DIRECTO'           // ✅ Primera vez pero ES el titular
  | 'ALERTA_ORIGEN_DE_OTRO_SOCIO'           // ⚠️ Este origen pagó a OTRO socio
  | 'ALERTA_ORIGEN_NO_COINCIDE_SOCIO'       // ⚠️ No reconocido + NO es titular
  | 'ERROR_CREDITO_NO_ENCONTRADO';          // ❌ CreditoId no existe

export interface UltimoPago {
  origenRegistrado: string;     // Nombre del último pagador registrado
  nombreSocio: string;          // Nombre del titular del crédito
  fechaUltimoPago: string;      // Fecha formato "YYYY-MM-DD"
  montoUltimoPago: number;      // Monto del último pago
}

export interface SocioEncontrado {
  nombreSocio: string;          // Nombre del otro socio al que pagó
  creditoId: string;            // ID del crédito del otro socio
  fechaPago: string;            // Fecha del pago a ese otro socio
}

export interface Advertencia {
  origenRecibido: string;       // El origen que se envió en la consulta
  socioEsperado: string;        // El titular esperado del crédito
  razon: string;                // Explicación del problema
}

export interface InfoPagador {
  pagadorRegistrado: string;    // Nombre del pagador habitual
  titularCredito: string;       // Nombre del titular del crédito
  nota: string;                 // Nota informativa
}

export interface RespuestaValidacionOrigen {
  estado: EstadoValidacion;
  mensaje: string;
  ultimoPago?: UltimoPago;           // Presente en la mayoría de casos
  socioEncontrado?: SocioEncontrado; // Solo cuando estado = ALERTA_ORIGEN_DE_OTRO_SOCIO
  advertencia?: Advertencia;         // Solo cuando estado = ALERTA_ORIGEN_NO_COINCIDE_SOCIO
  infoPagador?: InfoPagador;         // Solo cuando estado = APROBADO_PAGADOR_HABITUAL_NO_TITULAR
}

// Parámetros requeridos para la validación de origen
export interface ParametrosValidacionOrigen {
  creditoId: string;  // ID del crédito (ej: "98-0007174-25")
  origen: string;     // Nombre del pagador a validar (ej: "LUNA MUÑOZ, JAQUELIN")
}

// Función para validar el origen de un pago
// Endpoint: /api/comprobantes/origen/validar-origen?creditoId=XXX&origen=YYY
export const verificarOrigen = async (params: ParametrosValidacionOrigen): Promise<RespuestaValidacionOrigen> => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    
    // Construir la URL con los parámetros codificados correctamente
    const queryParams = new URLSearchParams({
      creditoId: params.creditoId,
      origen: params.origen
    });
    
    const response = await fetch(
      `${API_BASE_URL}/api/comprobantes/origen/validar-origen?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SessionManager.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error en la consulta: ${response.status}`);
    }

    const data: RespuestaValidacionOrigen = await response.json();
    return data;

  } catch (error) {
    throw error;
  }
};

// Alias con nombre en PascalCase para mantener compatibilidad
export const VerificarOrigen = verificarOrigen;



// // Ejemplo de uso en el frontend:
// function procesarRespuestaValidacion(respuesta: RespuestaValidacionOrigen) {
//   switch (respuesta.estado) {
//     case 'APROBADO_ORIGEN_COINCIDE':
//     case 'APROBADO_SOCIO_PAGO_DIRECTO':
//       // ✅ Verde - Todo OK, proceder sin problemas
//       return { tipo: 'success', color: 'green' };
    
//     case 'APROBADO_PAGADOR_HABITUAL_NO_TITULAR':
//       // ℹ️ Azul - OK pero informar que no es el titular
//       // Mostrar respuesta.infoPagador
//       return { tipo: 'info', color: 'blue' };
    
//     case 'APROBADO_ORIGEN_NUEVO':
//       // ✅ Verde/Amarillo - Nuevo pagador, puede proceder
//       return { tipo: 'success', color: 'yellow' };
    
//     case 'ALERTA_ORIGEN_DE_OTRO_SOCIO':
//       // ⚠️ Naranja - Advertencia, verificar
//       // Mostrar respuesta.socioEncontrado
//       return { tipo: 'warning', color: 'orange' };
    
//     case 'ALERTA_ORIGEN_NO_COINCIDE_SOCIO':
//       // ⚠️ Rojo - Advertencia fuerte, verificar identidad
//       // Mostrar respuesta.advertencia
//       return { tipo: 'danger', color: 'red' };
    
//     case 'ERROR_CREDITO_NO_ENCONTRADO':
//       // ❌ Error - El crédito no existe
//       return { tipo: 'error', color: 'red' };
//   }
// }
