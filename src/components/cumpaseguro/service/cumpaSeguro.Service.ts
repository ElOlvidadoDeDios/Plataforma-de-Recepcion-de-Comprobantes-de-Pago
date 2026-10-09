import { AseguramientoPayload, AseguramientoResponse } from '../types';


 /* Todos los datos se envían en MAYÚSCULAS excepto el correo (siempre en minúsculas).
 */
const API_BASE_URL_2 = import.meta.env.VITE_API_BASE_URL_GEODILE
const API_BASE_URL = `${API_BASE_URL_2}/api_mongo_firm_easy/api`; 
const API_CONTRATOS_URL = `${API_BASE_URL_2}/api_app_dile_v1_1/api`;
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

  // --- BENEFICIARIOS (array vacío o con datos) ---
  const beneficiarios = payload.beneficiarios && payload.beneficiarios.length > 0
    ? payload.beneficiarios
    : payload.beneficiario
      ? [payload.beneficiario]
      : [];

  if (beneficiarios.length > 0) {
    const beneficiariosData = beneficiarios.map((beneficiario) => ({
      tipo_documento: toUpperCase(beneficiario.tipoDoc),
      nro_documento: toUpperCase(beneficiario.dni),
      nombres: toUpperCase(beneficiario.nombre),
      apellido_paterno: toUpperCase(beneficiario.apePaterno),
      apellido_materno: toUpperCase(beneficiario.apeMaterno),
      direccion: toUpperCase(beneficiario.direccion),
      correo: beneficiario.correo.toLowerCase(),
      celular: toUpperCase(beneficiario.celular),
    }));
    formData.append('beneficiarios', JSON.stringify(beneficiariosData));

    beneficiarios.forEach((beneficiario, index) => {
      if (beneficiario.fotoDniAnverso) {
        formData.append(`beneficiario_anverso[${index}]`, beneficiario.fotoDniAnverso);
      }
      if (beneficiario.fotoDniReverso) {
        formData.append(`beneficiario_reverso[${index}]`, beneficiario.fotoDniReverso);
      }
    });
  } else {
    formData.append('beneficiarios', JSON.stringify([]));
  }

  return formData;
}

export const cumpaSeguroService = {
  
  async guardarAseguramiento(
    payload: AseguramientoPayload
  ): Promise<AseguramientoResponse> {

    const formData = construirFormData(payload);

    try {

      const respuesta = await fetch(`${API_BASE_URL}/RegistrarAtencion`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': '69420',
          Authorization: `${token}`,
        },
        body: formData,
      });

      // Primero intentamos leer la respuesta del backend
      const data = await respuesta.json();

      // Si HTTP no fue exitoso, mostramos el message del backend
      if (!respuesta.ok) {
        throw new Error(
          data?.message ||
          `Error HTTP: ${respuesta.status} ${respuesta.statusText}`
        );
      }

      // Verificar si la respuesta es exitosa
      if (data.status === true || data.success === true) {
        return {
          success: true,
          codigo:
            data.codigo ||
            data.id ||
            `CS-${Date.now().toString().slice(-8)}`,
          fechaRegistro: payload.fechaRegistro,
        };
      }

      // El servidor respondió correctamente a nivel HTTP,
      // pero la operación fue rechazada por la lógica del backend.
      throw new Error(
        data?.message || 'Error al registrar aseguramiento'
      );

    } catch (error: any) {

      console.error(
        '[CumpaSeguro] Error al guardar aseguramiento:',
        error
      );

      throw new Error(
        error?.message || 'Error de conexión con el servidor'
      );
    }
  },
  /**
   * Lista los aseguramientos/pólizas de un usuario específico
   * Endpoint: /ListarIngresadosAseguradosPorUser
   * Body: { "user": "75654687" }
   */
  async listarPolizasPorUsuario(userDni: string): Promise<any> {
    try {
      const respuesta = await fetch(`${API_BASE_URL}/ListarIngresadosAseguradosPorUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '69420',
          Authorization: `${token}`,
        },
        body: JSON.stringify({ user: userDni }),
      });

      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status} ${respuesta.statusText}`);
      }

      const data = await respuesta.json();

      if (data.status === true) {
        return {
          success: true,
          cantidad: data.cantidad || 0,
          data: data.data || [],
        };
      } else {
        throw new Error(data.message || 'Error al obtener pólizas');
      }
    } catch (error: any) {
      console.error('[CumpaSeguro] Error al listar pólizas:', error);
      throw new Error(error.message || 'Error de conexión con el servidor');
    }
  },

  /**
   * Genera el contrato para un asegurado
   * Endpoint: /contrato_asegurado_mi_cumpla
   * Body: { "id": "6a91ad2a629cf3b9fd0f48cc" }
   */
  async generarContrato(polizaId: string): Promise<any> {
    try {
      const respuesta = await fetch(`${API_CONTRATOS_URL}/contrato_asegurado_mi_cumpla`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '69420',
          Authorization: `${token}`,
        },
        body: JSON.stringify({ id: polizaId }),
      });

      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status} ${respuesta.statusText}`);
      }

      const data = await respuesta.json();

      if (data.status === true || data.success === true) {
        return {
          success: true,
          message: data.message || 'Contrato generado exitosamente',
          data: data.data || data,
        };
      } else {
        throw new Error(data.message || 'Error al generar contrato');
      }
    } catch (error: any) {
      console.error('[CumpaSeguro] Error al generar contrato:', error);
      throw new Error(error.message || 'Error de conexión con el servidor');
    }
  },

  /**
   * Obtiene la IP pública del usuario
   */
  async obtenerIpPublica(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json', {
        method: 'GET',
      });
      const data = await response.json();
      return data.ip || 'N/A';
    } catch (error) {
      console.warn('[CumpaSeguro] No se pudo obtener la IP pública:', error);
      return 'N/A';
    }
  },

  /**
   * Detecta el sistema operativo del navegador
   */
  detectarSistemaOperativo(): string {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    if (userAgent.indexOf('Win') !== -1) return 'Windows 10';
    if (userAgent.indexOf('Mac') !== -1) return 'macOS';
    if (userAgent.indexOf('Linux') !== -1) return 'Linux';
    if (userAgent.indexOf('Android') !== -1) return 'Android';
    if (userAgent.indexOf('iPhone') !== -1 || userAgent.indexOf('iPad') !== -1) return 'iOS';
    
    return platform || 'Unknown';
  },

  /**
   * Detecta el navegador y su versión
   */
  detectarNavegador(): string {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    let version = '';

    if (userAgent.indexOf('Chrome') !== -1 && userAgent.indexOf('Edg') === -1) {
      browser = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : '';
    } else if (userAgent.indexOf('Edg') !== -1) {
      browser = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      version = match ? match[1] : '';
    } else if (userAgent.indexOf('Firefox') !== -1) {
      browser = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? match[1] : '';
    } else if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
      browser = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? match[1] : '';
    }

    return version ? `${browser} ${version}` : browser;
  },

  /**
   * Obtiene el documento de seguro firmado
   * Endpoint: /get_doc_seguro_firm
   */
  async obtenerDocumentoFirmado(data: {
    tokenFirm: string;
    agencia: string;
    nroDoc: string;
    user: string;
  }): Promise<any> {
    try {
      // Obtener IP pública del usuario
      const ipAddress = await this.obtenerIpPublica();

      // Detectar tipo de dispositivo
      const deviceType = /Mobile|Android|iPhone|iPad|iPod/.test(navigator.userAgent) ? 'mobile' : 'desktop';

      // Obtener información del dispositivo de manera dinámica
      const infoDesk = {
        action: `ver_documento_${data.nroDoc}`,
        ip_address: ipAddress,
        device_type: deviceType,
        os: this.detectarSistemaOperativo(),
        browser: this.detectarNavegador(),
        user_agent: navigator.userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };

      const payload = {
        ID_DOCUMENT_FIRM: data.tokenFirm,
        AGENCIA: data.agencia,
        NRO_DOC: data.nroDoc,
        USER: data.user,
        INFO_DESK: infoDesk
      };

      const respuesta = await fetch(`${API_CONTRATOS_URL}/get_doc_seguro_firm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '69420',
          Authorization: `${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status} ${respuesta.statusText}`);
      }

      const responseData = await respuesta.json();

      // Retornar la respuesta completa, incluso si status es false
      // para que el componente pueda manejar el mensaje apropiadamente
      if (responseData.status === true || responseData.success === true) {
        return {
          success: true,
          status: responseData.status,
          message: responseData.message || responseData.update?.message || 'Documento obtenido exitosamente',
          data: responseData.data || responseData.update?.data,
          update: responseData.update, // Mantener estructura completa
          ruta_aws: responseData.ruta_aws,
        };
      } else if (responseData.status === false) {
        // Cuando el documento aún no está firmado, retornar la respuesta sin lanzar error
        return {
          success: false,
          status: false,
          message: responseData.message || 'El documento aún no está disponible',
          data: null,
        };
      } else {
        throw new Error(responseData.message || 'Error al obtener documento');
      }
    } catch (error: any) {
      console.error('[CumpaSeguro] Error al obtener documento firmado:', error);
      throw new Error(error.message || 'Error de conexión con el servidor');
    }
  },

  /**
   * Valida la firma de un asegurado
   * Endpoint: /validarFirmaAsegurado
   * Body: { "dni": "72369991", "id_document": "a29ea45e-5c46-4d0f-8b38-d02240ccda1d" }
   */
  async validarFirmaAsegurado(data: {
    dni: string;
    idDocument: string;
  }): Promise<any> {
    try {
      const payload = {
        dni: data.dni,
        id_document: data.idDocument
      };

      const respuesta = await fetch(`${API_BASE_URL}/validarFirmaAsegurado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '69420',
          Authorization: `${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status} ${respuesta.statusText}`);
      }

      const responseData = await respuesta.json();

      if (responseData.status === true || responseData.success === true) {
        return {
          success: true,
          status: responseData.status,
          message: responseData.message || 'Firma validada exitosamente',
          data: responseData.data || responseData,
        };
      } else if (responseData.status === false) {
        // Retornar respuesta cuando la validación falla
        return {
          success: false,
          status: false,
          message: responseData.message || 'No se pudo validar la firma',
          data: null,
        };
      } else {
        throw new Error(responseData.message || 'Error al validar firma');
      }
    } catch (error: any) {
      console.error('[CumpaSeguro] Error al validar firma:', error);
      throw new Error(error.message || 'Error de conexión con el servidor');
    }
  },

  /**
   * Anula/Deshabilita una póliza de seguro
   * Endpoint: /AnularPolizaSeguro
   * Body: { dni: string, id_document: string }
   */
  async anularPolizaSeguro(data: {
    dni: string;
    idDocument: string;
  }): Promise<any> {
    try {
      const payload = {
        dni: data.dni,
        id_document: data.idDocument
      };

      const respuesta = await fetch(`${API_BASE_URL}/AnularPolizaSeguro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '69420',
          Authorization: `${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status} ${respuesta.statusText}`);
      }

      const responseData = await respuesta.json();

      if (responseData.status === true || responseData.success === true) {
        return {
          success: true,
          status: responseData.status,
          message: responseData.message || 'Póliza anulada exitosamente',
          data: responseData.data || responseData,
        };
      } else if (responseData.status === false) {
        return {
          success: false,
          status: false,
          message: responseData.message || 'No se pudo anular la póliza',
          data: null,
        };
      } else {
        throw new Error(responseData.message || 'Error al anular póliza');
      }
    } catch (error: any) {
      console.error('[CumpaSeguro] Error al anular póliza:', error);
      throw new Error(error.message || 'Error de conexión con el servidor');
    }
  },

  /**
   * Sube el voucher/comprobante de pago para una póliza
   * Endpoint: /SubirVoucherDocumentoAsegurado
   * Body: FormData con { id_document: token de firma, dni: dniTitular, user_registra: user, imagen: File }
   */
  async subirVoucher(tokenFirma: string, dniTitular: string, user: string, voucherFile: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('id_document', tokenFirma);
      formData.append('dni', dniTitular);
      formData.append('user_registra', user);
      formData.append('imagen', voucherFile);

      const respuesta = await fetch(`${API_BASE_URL}/SubirVoucherDocumentoAsegurado`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': '69420',
          Authorization: `${token}`,
        },
        body: formData,
      });

      // Intentar leer la respuesta JSON del backend siempre
      const responseData = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        const errorMsg =
          responseData?.message ||
          responseData?.error ||
          responseData?.detail ||
          responseData?.msg ||
          `Error HTTP ${respuesta.status}: ${respuesta.statusText}`;
        throw new Error(errorMsg);
      }

      if (responseData?.status === true || responseData?.success === true) {
        return {
          success: true,
          status: responseData.status,
          message: responseData.message || 'Voucher subido exitosamente',
          data: responseData.data || responseData,
        };
      } else {
        const mensajeBackend =
          responseData?.message ||
          responseData?.error ||
          responseData?.detail ||
          responseData?.msg ||
          'Error al subir voucher';
        throw new Error(mensajeBackend);
      }
    } catch (error: any) {
      console.error('[CumpaSeguro] Error al subir voucher:', error);
      throw new Error(error?.message || 'Error de conexión con el servidor');
    }
  },
};