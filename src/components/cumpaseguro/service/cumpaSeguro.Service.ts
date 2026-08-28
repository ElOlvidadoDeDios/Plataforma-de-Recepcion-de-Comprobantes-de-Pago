import { AseguramientoPayload, AseguramientoResponse } from '../types';

/**
 * Servicio de CumpaSeguro.
 * 
 * Conecta con la API: http://192.168.3.34:8080/desarrollo/api_mongo_firm_easy/api/RegistrarAtencion
 * 
 * Estructura del payload:
 * {
 *   "tipo_documento": "DNI",
 *   "nro_documento": "12345678",
 *   "nombres": "CARLOS ALBERTO",
 *   "apellido_paterno": "GARCIA",
 *   "apellido_materno": "LOPEZ",
 *   "tipo_atencion": "PRESENCIAL",
 *   "costo": 140,
 *   "direccion": "AV. LIMA 123",
 *   "correo": "carlos@gmail.com",
 *   "celular": "971159682",
 *   "foto_dni_anverso": File,
 *   "foto_dni_reverso": File,
 *   "voucher": File,
 *   "beneficiarios": [
 *     {
 *       "tipo_documento": "DNI",
 *       "nro_documento": "74859632",
 *       "nombres": "JUAN CARLOS",
 *       "apellido_paterno": "PEREZ",
 *       "apellido_materno": "LOPEZ",
 *       "direccion": "JR. LIMA 123",
 *       "correo": "juan@gmail.com",
 *       "celular": "999888777"
 *     }
 *   ],
 *   "beneficiario_anverso": File,
 *   "beneficiario_reverso": File,
 *   "user": "12345678",
 *   "agencia_nom": "AGENCIA LIMA"
 * }
 * 
 * Todos los datos se envían en MAYÚSCULAS excepto el correo (siempre en minúsculas).
 */

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL_GEODILE}/api_mongo_firm_easy/api`;
const token = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;
/**
 * Convierte un texto a mayúsculas
 */
const toUpperCase = (value: string | number): string => {
  return String(value || '').toUpperCase();
};

/**
 * Arma el FormData completo (campos de texto + archivos) listo para enviar
 * por POST/multipart. Se usa FormData (y no un objeto plano) porque hay
 * imágenes (DNI anverso/reverso y voucher) que deben viajar como archivos.
 */
export function construirFormData(payload: AseguramientoPayload): FormData {
  const formData = new FormData();

  // --- DATOS DEL USUARIO Y AGENCIA ---
  formData.append('user', payload.user);
  formData.append('agencia_nom', toUpperCase(payload.agencia_nom));

  // --- TITULAR (datos principales) ---
  formData.append('tipo_documento', toUpperCase(payload.titular.tipoDoc));
  formData.append('nro_documento', toUpperCase(payload.titular.dni));
  formData.append('nombres', toUpperCase(payload.titular.nombre));
  formData.append('apellido_paterno', toUpperCase(payload.titular.apePaterno));
  formData.append('apellido_materno', toUpperCase(payload.titular.apeMaterno));
  formData.append('tipo_atencion', toUpperCase(payload.titular.tipoAtencion));
  formData.append('costo', String(payload.titular.costo || 0));
  formData.append('direccion', toUpperCase(payload.titular.direccion));
  // El correo NO se convierte a mayúsculas
  formData.append('correo', payload.titular.correo.toLowerCase());
  formData.append('celular', toUpperCase(payload.titular.celular));

  // Imágenes del titular
  if (payload.titular.fotoDniAnverso) {
    formData.append('foto_dni_anverso', payload.titular.fotoDniAnverso);
  }
  if (payload.titular.fotoDniReverso) {
    formData.append('foto_dni_reverso', payload.titular.fotoDniReverso);
  }
  if (payload.titular.fotoVoucher) {
    formData.append('voucher', payload.titular.fotoVoucher);
  }

  // --- BENEFICIARIO (array vacío o con datos) ---
  if (payload.beneficiario) {
    const beneficiarioData = {
      tipo_documento: toUpperCase(payload.beneficiario.tipoDoc),
      nro_documento: toUpperCase(payload.beneficiario.dni),
      nombres: toUpperCase(payload.beneficiario.nombre),
      apellido_paterno: toUpperCase(payload.beneficiario.apePaterno),
      apellido_materno: toUpperCase(payload.beneficiario.apeMaterno),
      direccion: toUpperCase(payload.beneficiario.direccion),
      correo: payload.beneficiario.correo.toLowerCase(),
      celular: toUpperCase(payload.beneficiario.celular),
    };
    formData.append('beneficiarios', JSON.stringify([beneficiarioData]));
    
    // Imágenes del beneficiario
    if (payload.beneficiario.fotoDniAnverso) {
      formData.append('beneficiario_anverso[]', payload.beneficiario.fotoDniAnverso);
    }
    if (payload.beneficiario.fotoDniReverso) {
      formData.append('beneficiario_reverso[]', payload.beneficiario.fotoDniReverso);
    }
  } else {
    formData.append('beneficiarios', JSON.stringify([])); 
  }

  return formData;
}

export const cumpaSeguroService = {
  async guardarAseguramiento(payload: AseguramientoPayload): Promise<AseguramientoResponse> {
    const formData = construirFormData(payload);

    try {
      const respuesta = await fetch(`${API_BASE_URL}/RegistrarAtencion`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': '69420',
          Authorization: `Bearer ${token}`,
        },
        body: formData, // NO poner Content-Type manual, el navegador lo arma con el boundary
      });

      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status} ${respuesta.statusText}`);
      }

      const data = await respuesta.json();

      // Verificar si la respuesta es exitosa
      if (data.status === true || data.success === true) {
        return {
          success: true,
          codigo: data.codigo || data.id || `CS-${Date.now().toString().slice(-8)}`,
          fechaRegistro: payload.fechaRegistro,
        };
      } else {
        throw new Error(data.message || 'Error al registrar aseguramiento');
      }
    } catch (error: any) {
      console.error('[CumpaSeguro] Error al guardar aseguramiento:', error);
      throw new Error(error.message || 'Error de conexión con el servidor');
    }
  },
};