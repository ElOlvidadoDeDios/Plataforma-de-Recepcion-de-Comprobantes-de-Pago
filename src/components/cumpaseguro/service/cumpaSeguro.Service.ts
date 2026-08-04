import { AseguramientoPayload, AseguramientoResponse, PersonaData } from '../types';

/**
 * Servicio de CumpaSeguro.
 *
 * `construirFormData` arma el FormData que se envía al backend, respetando
 * los nombres de campo que espera el PHP (bloque $_POST de la app actual):
 *
 *   "tipo_doc"       => $_POST['T_TIPO_DOC']
 *   "num_doc"        => $_POST['T_NUM_DOC']
 *   "nombres"        => $_POST['T_NOMBRES']
 *   "ape_pat"        => $_POST['T_APE_PAT']
 *   "ape_mat"        => $_POST['T_APE_MAT']
 *   "tipo_atencion"  => $_POST['T_TIPO_ATENCION']
 *   "direccion"      => $_POST['T_DIRECCION']
 *   "costo"          => $_POST['T_COSTO']
 *   "correo"         => $_POST['T_CORREO']
 *   "celular"        => $_POST['T_CELULAR']
 *
 * Para el BENEFICIARIO uso el mismo patrón mirrorenado con prefijo "B_"
 * (B_TIPO_DOC, B_NUM_DOC, etc.) como ejemplo razonable, ya que el
 * backend aún no define esos nombres. AJUSTA el prefijo/las llaves del
 * objeto `CAMPOS_BENEFICIARIO` de abajo apenas confirmes con backend
 * cómo espera recibir esos datos (o si va en un bloque separado).
 *
 * Nota: como el beneficiario ya no pide tipo de atención ni costo,
 * esos dos campos no se envían para él.
 */

// Mapeo de campos del TITULAR -> nombre exacto que espera el backend.
const CAMPOS_TITULAR: Record<string, keyof PersonaData> = {
  T_TIPO_DOC: 'tipoDoc',
  T_NUM_DOC: 'dni',
  T_NOMBRES: 'nombre',
  T_APE_PAT: 'apePaterno',
  T_APE_MAT: 'apeMaterno',
  T_TIPO_ATENCION: 'tipoAtencion',
  T_DIRECCION: 'direccion',
  T_COSTO: 'costo',
  T_CORREO: 'correo',
  T_CELULAR: 'celular',
};

// Mapeo de campos del BENEFICIARIO (ejemplo con prefijo "B_", a confirmar
// con backend). Sin tipo de atención ni costo.
const CAMPOS_BENEFICIARIO: Record<string, keyof PersonaData> = {
  B_TIPO_DOC: 'tipoDoc',
  B_NUM_DOC: 'dni',
  B_NOMBRES: 'nombre',
  B_APE_PAT: 'apePaterno',
  B_APE_MAT: 'apeMaterno',
  B_DIRECCION: 'direccion',
  B_CORREO: 'correo',
  B_CELULAR: 'celular',
};

/**
 * Arma el FormData completo (campos de texto + archivos) listo para enviar
 * por POST/multipart. Se usa FormData (y no un objeto plano) porque hay
 * imágenes (DNI anverso/reverso y voucher) que deben viajar como archivos.
 */
export function construirFormData(payload: AseguramientoPayload): FormData {
  const formData = new FormData();

  // --- Titular ---
  Object.entries(CAMPOS_TITULAR).forEach(([nombreCampo, propiedad]) => {
    formData.append(nombreCampo, String(payload.titular[propiedad] ?? ''));
  });
  if (payload.titular.fotoDniAnverso) {
    formData.append('T_FOTO_DNI_ANVERSO', payload.titular.fotoDniAnverso);
  }
  if (payload.titular.fotoDniReverso) {
    formData.append('T_FOTO_DNI_REVERSO', payload.titular.fotoDniReverso);
  }
  if (payload.titular.fotoVoucher) {
    formData.append('T_FOTO_VOUCHER', payload.titular.fotoVoucher);
  }

  // --- Beneficiario (solo si el checkbox "Agregar beneficiario" estaba activo) ---
  formData.append('TIENE_BENEFICIARIO', payload.beneficiario ? '1' : '0');
  if (payload.beneficiario) {
    Object.entries(CAMPOS_BENEFICIARIO).forEach(([nombreCampo, propiedad]) => {
      formData.append(nombreCampo, String(payload.beneficiario![propiedad] ?? ''));
    });
    if (payload.beneficiario.fotoDniAnverso) {
      formData.append('B_FOTO_DNI_ANVERSO', payload.beneficiario.fotoDniAnverso);
    }
    if (payload.beneficiario.fotoDniReverso) {
      formData.append('B_FOTO_DNI_REVERSO', payload.beneficiario.fotoDniReverso);
    }
  }

  formData.append('FECHA_REGISTRO', payload.fechaRegistro);

  return formData;
}

export const cumpaSeguroService = {
  async guardarAseguramiento(payload: AseguramientoPayload): Promise<AseguramientoResponse> {
    const formData = construirFormData(payload);

    // --- MOCK actual: simula la llamada y solo muestra en consola qué se
    // habría enviado. Cuando el endpoint real esté listo, reemplazar este
    // bloque por algo como:
    //
    // const respuesta = await fetch('/ruta/al/endpoint.php', {
    //   method: 'POST',
    //   body: formData, // NO poner Content-Type manual, el navegador lo arma con el boundary
    // });
    // const data = await respuesta.json();

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const entradas: Record<string, string> = {};
    formData.forEach((valor, clave) => {
      entradas[clave] = valor instanceof File ? `[archivo] ${valor.name}` : String(valor);
    });
    // eslint-disable-next-line no-console
    console.log('[CumpaSeguro][mock] FormData que se enviaría:', entradas);

    const codigo = `CS-${Date.now().toString().slice(-8)}`;

    return {
      success: true,
      codigo,
      fechaRegistro: payload.fechaRegistro,
    };
  },
};