import { ReactElement, useRef, useState } from 'react';
import logo from '../../../logo_dile.webp'; // Ruta corregida del logo (3 niveles hacia arriba)
import { DatosCertificado } from '../../../types/clienteData';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ReactDOM from 'react-dom';
import { useNotifications } from '../../../hooks/useNotifications';
import { uploadAllFilesAtOnce, UploadFileData } from '../../../api/registroDeclientesApi';
// Props para los componentes
interface DocumentoProps {
  datosCertificado?: DatosCertificado;
}



// Helper para formatear texto de estado civil
const formatearEstadoCivil = (cliente: any): string => {
  return cliente?.TIPO_ECIV_TEXTO || cliente?.TIPO_ECIV || '';
};

// Helper para formatear texto de profesión
const formatearProfesion = (cliente: any): string => {
  return cliente?.TIPO_PROF_TEXTO || cliente?.TIPO_PROF || '';
};

// Helper para formatear texto de instrucción
const formatearInstruccion = (cliente: any): string => {
  return cliente?.TIPO_INST_TEXTO || cliente?.TIPO_INST || '';
};

// Helper para formatear sexo
const formatearSexo = (cliente: any): string => {
  return cliente?.SEXO_TEXTO || (cliente?.SEXO === 'M' ? 'Masculino' : cliente?.SEXO === 'F' ? 'Femenino' : '');
};

// Helpers para formatear datos de dirección
const formatearDireccionCompleta = (direccion: any): string => {
  // Prioridad 1: Si hay DIRECCION_COMPLETA mapeada desde registro_datos.tsx
  if (direccion?.DIRECCION_COMPLETA) {
    return direccion.DIRECCION_COMPLETA;
  }
  
  // Prioridad 2: Si hay una dirección ya formateada en DIRECCION
  if (direccion?.DIRECCION) {
    return direccion.DIRECCION;
  }
  
  // Prioridad 3: Construir la dirección a partir de los componentes
  const partes = [];
  
  if (direccion?.TIPO_VIA && direccion?.NOM_VIA) {
    partes.push(`${direccion.TIPO_VIA} ${direccion.NOM_VIA}`);
  } else if (direccion?.NOM_VIA) {
    partes.push(direccion.NOM_VIA);
  }
  
  if (direccion?.NUMERO) {
    partes.push(`N° ${direccion.NUMERO}`);
  }
  
  if (direccion?.INTERIOR) {
    partes.push(`Int. ${direccion.INTERIOR}`);
  }
  
  if (direccion?.NOM_ZONA) {
    partes.push(direccion.NOM_ZONA);
  }
  
  return partes.join(' - ');
};

const formatearUbigeo = (direccion: any, tipo: 'DPTO' | 'PROV' | 'DIST'): string => {
  // Primero verificar si hay datos de texto ya mapeados
  if (tipo === 'DPTO' && direccion?.DPTO_TEXTO) return direccion.DPTO_TEXTO;
  if (tipo === 'PROV' && direccion?.PROV_TEXTO) return direccion.PROV_TEXTO;
  if (tipo === 'DIST' && direccion?.DIST_TEXTO) return direccion.DIST_TEXTO;
  
  // Si no hay texto mapeado, usar el código original
  return direccion?.[tipo] || '';
};

export function FichaIngreso({ datosCertificado }: DocumentoProps) {
    const cliente = datosCertificado?.cliente;
    const direccion = datosCertificado?.direccion;

    return (
        <div className="w-full">
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold uppercase">FICHA DE INGRESO</h1>
                <div className="mt-2 text-sm">
                    <p>COOPERATIVA DE AHORRO Y CRÉDITO DILE</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="p-3"> {/* Se quitó el border-2 border-black */}
                    <h3 className="text-sm font-bold mb-3 uppercase">DATOS PERSONALES</h3>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <p className="text-xs font-semibold mb-1">APELLIDO PATERNO</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{cliente?.APE_PAT || ''}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1">APELLIDO MATERNO</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{cliente?.APE_MAT || ''}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1">NOMBRES</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{cliente?.NOMBRES || ''}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                        <div>
                            <p className="text-xs font-semibold mb-1">NRO D.I</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{cliente?.DOC_IDEN || ''}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1">ESTADO CIVIL</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{formatearEstadoCivil(cliente)}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1">FECHA NACIMIENTO</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">
                                    {cliente?.FECHA_NAC ? new Date(cliente.FECHA_NAC).toLocaleDateString('es-PE') : ''}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1">SEXO</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{formatearSexo(cliente)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <p className="text-xs font-semibold mb-1">PROFESIÓN</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{formatearProfesion(cliente)}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1">GRADO INSTRUCCIÓN</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{formatearInstruccion(cliente)}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1">CENTRO TRABAJO</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{cliente?.OCUPACION || ''}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className="text-xs font-semibold mb-1">CARGO</p>
                        <div className="border-b-2 border-black h-6 flex items-end px-2">
                            <span className="text-xs">{cliente?.OCUPACION || ''}</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className="text-xs font-semibold mb-1">DIRECCIÓN DE DOMICILIO</p>
                        <div className="border-b-2 border-black h-6 flex items-end px-2">
                            <span className="text-xs">{formatearDireccionCompleta(direccion)}</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className="text-xs font-semibold mb-1">REFERENCIA</p>
                        <div className="border-b-2 border-black h-6 flex items-end px-2">
                            <span className="text-xs">{direccion?.REFERENCIA || ''}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <p className="text-xs font-semibold mb-1">DEPARTAMENTO</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{formatearUbigeo(direccion, 'DPTO')}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1">PROVINCIA</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{formatearUbigeo(direccion, 'PROV')}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1">DISTRITO</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{formatearUbigeo(direccion, 'DIST')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-xs font-semibold mb-1">TELÉFONO</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{cliente?.TLF_CELULAR || ''}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1">EMAIL</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{cliente?.EMAIL || ''}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="text-xs font-semibold mb-1">OBSERVACIONES Y/O DECLARACIONES</p>
                        <div className="border-2 border-black h-16"></div>
                    </div>

                    {/* Sección de firmas actualizada */}
                    <div className="text-center mt-20">
                        <div className="border-b-2 border-black w-40 mx-auto mb-4"></div>
                        <p className="text-xs font-semibold mb-10">FIRMA Y HUELLA DEL AFILIADO</p>
                        <div className="flex justify-center gap-16">
                            <div className="text-center mt-4">
                                <div className="border-b-2 border-black w-40 mx-auto mb-4"></div>
                                <p className="text-xs font-semibold">FIRMA</p>
                            </div>
                            <div className="text-center mt-4">
                                <div className="border-b-2 border-black w-40 mx-auto mb-4"></div>
                                <p className="text-xs font-semibold">FIRMA</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="text-center mt-6">
                    <p className="text-xs">
                        Fecha: {new Date().toLocaleDateString('es-PE')}
                    </p>
                </div>

            </div>
        </div>
    );
}



export function CertificadoAfiliacion({ datosCertificado }: DocumentoProps) {
  const cliente = datosCertificado?.cliente;
  const usuario = datosCertificado?.usuario;
  const fechaEmision = datosCertificado?.fechaEmision || new Date();

  return (
    <div className="w-[200mm] h-[297mm] p-8 mx-auto bg-white" style={{fontFamily: 'Arial, sans-serif'}}>
      {/* Header con logo */}
      <div className="flex justify-start mb-4">
        <img src={logo} alt="DILE Logo" className="h-20" />
      </div>

      {/* Título principal */}
      <div className="text-center mb-4">
        <h1 className="text-lg font-bold bg-gray-200 py-2 px-4 ">CERTIFICADO DE AFILIACIÓN</h1>
      </div>

      {/* Párrafo introductorio */}
      <p className="text-xs leading-tight text-justify mb-4">
        La Cooperativa de Ahorro y Crédito De Intelectuales, Líderes y Empresarios, en adelante denominado DILE,
        identificado con RUC N° 2049052787, con domicilio fiscal en la Av. Garcilaso N° 415 - Wanchaq, de acuerdo al
        marco normativo vigente para cooperativas, afilia al socio(a) cuyos datos se mencionan en el cuadro siguiente:
      </p>
      {/* Datos del certificado */}
      <div className="mb-4">
        <table className="w-full text-xs border-collapse">
          <tbody>
            <tr>
              <td className="py-1 pr-2 font-bold w-1/3">CERTIFICADO N°:</td>
              <td className="py-1">{cliente?.NVA_CTA || 'PENDIENTE'}</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-bold">APELLIDOS Y NOMBRES:</td>
              <td className="py-1">
                {`${cliente?.APE_PAT || ''} ${cliente?.APE_MAT || ''} ${cliente?.NOMBRES || ''}`.trim()}
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-bold">TIPO Y NRO DE DOCUMENTO:</td>
              <td className="py-1">DNI {cliente?.DOC_IDEN || ''}</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-bold">N° CUENTA DE SOCIO:</td>
              <td className="py-1">{cliente?.NVA_CTA || 'PENDIENTE'}</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-bold">APORTE INICIAL:</td>
              <td className="py-1">S/ 100.00</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-bold">FECHA DE EMISIÓN:</td>
              <td className="py-1">{fechaEmision.toLocaleDateString('es-PE')}</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-bold">RESPONSABLE:</td>
              <td className="py-1">{usuario?.razon}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Párrafo de derechos y obligaciones */}
      <p className="text-xs leading-tight text-justify mb-4">
        Otorgándole todos los derechos y obligaciones, contemplados en la Ley General del Sistema Financiero, Ley General de Cooperativas, y las Resoluciones de la Superintendencia de Banca y Seguros; lo cual es debidamente informado y puesto en conocimiento de todos los afiliados, en adelante el término equivaldrá a socios para todos los efectos legales.
      </p>

      {/* Sección OBLIGACIONES DEL AFILIADO */}
      <div className="mb-4">
        <h2 className="text-sm font-bold bg-gray-200 py-1 px-2 mb-2">OBLIGACIONES DEL AFILIADO</h2>
        <div className="text-xs leading-tight text-justify">
          <p className="mb-2">Son obligaciones del afiliado los siguientes:</p>
          <p className="pl-6" style={{textIndent: '-0.75rem'}}>
            a) Cumplir las normas, el Estatuto, resoluciones de la Asamblea General, del Consejo de Administración, y Reglamentos Internos. Asimismo, deberá cumplir con sus obligaciones, así como aportar mensualmente, y pagar un certificado de aportación obligatoriamente lo cual equivaldrá a doce aportes, para ser socio hábil. Mayor información en nuestras oficinas y la página web www.dile.com.pe.
          </p>
          <p className="pl-6" style={{textIndent: '-0.75rem'}}>
            b) Informarse y realizar las consultas sobre los lineamientos, cláusulas y disposiciones de los diferentes contratos de servicios financieros, de ahorros, depósitos, y créditos, con respecto a la tasa de interés, rendimientos, comisiones, gastos asociados al servicio, y/o modificación de tarifas, penalidades, procedimientos, vencimiento de contrato, y otros.
          </p>
          <p className="pl-6" style={{textIndent: '-0.75rem'}}>
            c) Contribuir con la buena imagen de la institución.
          </p>
        </div>
      </div>

      {/* Sección DERECHOS DEL AFILIADO */}
      <div className="mb-4">
        <h2 className="text-sm font-bold bg-gray-200 py-1 px-2 mb-2">DERECHOS DEL AFILIADO</h2>
        <div className="text-xs leading-tight text-justify">
          <p className="mb-2">Son derechos del afiliado los siguientes:</p>
          <p className="mb-2 pl-6" style={{textIndent: '-0.75rem'}}>
            a) Beneficiarse de los productos y servicios financieros que ofrece DILE, de acuerdo a las directivas internas fijadas por los órganos correspondientes.
          </p>
          <p className="pl-6" style={{textIndent: '-0.75rem'}}>
            b) En el caso de ser socio hábil, podrá participar en las Asambleas Generales, elegir y ser elegido para los distintos órganos directivos: Consejo de Administración, Consejo de Vigilancia, Comité de Educación, o Comité Electoral.
          </p>
        </div>
      </div>

      {/* Sección SANCIONES Y PENALIDADES */}
      <div className="mb-4">
        <h2 className="text-sm font-bold bg-gray-200 py-1 px-2 mb-2">SANCIONES Y PENALIDADES POR INCUMPLIMIENTO</h2>
        <p className="text-xs leading-tight text-justify">
          En el caso de que el asociado afecte la buena imagen de la institución financiera, DILE iniciará las acciones administrativas y legales de acuerdo a ley.
        </p>
      </div>

      {/* Sección DECLARACIONES Y FIRMAS */}
      <div className="mb-8">
        <h2 className="text-sm font-bold bg-gray-200 py-1 px-2 mb-2">DECLARACIONES Y FIRMAS</h2>
        <p className="text-xs leading-tight text-justify">
          Como asociado, dejo constancia de haber leído y recibido la ficha de afiliación, la cartilla de información para los asociados, así como contratos anexos de ser el caso. Asimismo, declaro que todas las dudas y consultas relacionadas a estos documentos me fueron absueltas, por lo que firmo la presente con conocimiento pleno de las condiciones establecidas en dichos documentos.
        </p>
      </div>

      {/* Sección de firmas */}
      <div className="mt-auto flex justify-between items-end pt-16">
        <div className="text-center">
          <div className="border-t-2 border-black w-64 mx-auto mb-2"></div>
          <p className="text-xs font-bold">Firma y Huella digital del Asociado</p>
        </div>
        <div className="text-center">
          <div className="border-t-2 border-black w-64 mx-auto mb-2"></div>
          <p className="text-xs font-bold">Firma y Sello del Asesor de Negocios</p>
        </div>
      </div>
    </div>
  );
}


const Notification=useNotifications();
// Modal para previsualizar el documento
export function PreviewModal({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: ReactElement;
}): ReactElement {
  const documentRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    if (documentRef.current) {
      try {
        const canvas = await html2canvas(documentRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 0;
        
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`${title}.pdf`);
        onClose();
      } catch (error) {
        Notification.error('Error al generar el PDF');
      }
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-center">{title}</h2>
        
        {/* Vista previa del documento */}
        <div className="border border-gray-300 mb-4 bg-white overflow-auto" style={{ minHeight: '600px' }}>
          <div 
            ref={documentRef}
            className="bg-white p-8"
            style={{
              width: '210mm',
              minHeight: '297mm',
              margin: '0 auto',
              fontSize: '12px',
              lineHeight: '1.4'
            }}
          >
            {children}
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            📄 Generar PDF
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Modal para subir comprobantes
export function Modal({
  onClose,
  datosCertificado,
  onUploadSuccess,
}: {
  onClose: () => void;
  datosCertificado?: DatosCertificado;
  onUploadSuccess?: () => void;
}): ReactElement {
  const [dniFrontalFile, setDniFrontalFile] = useState<File | null>(null);
  const [dniReversoFile, setDniReversoFile] = useState<File | null>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const cliente = datosCertificado?.cliente;
  // ✅ CAPTURAR LOS DATOS DEL ANALISTA ORIGINAL Y AGENCIA ORIGINAL
  const codUserOriginal = datosCertificado?.codUserOriginal;
  const ageOriginal = datosCertificado?.ageOriginal;


  const handleSubmit = async () => {
    if (!dniFrontalFile || !dniReversoFile || !paymentFile) {
      Notification.info("Por favor selecciona todos los archivos requeridos en el orden correcto");
      return;
    }

    if (!cliente?.DOC_IDEN || !ageOriginal || !codUserOriginal) {
      Notification.error("Error: Faltan datos necesarios (DNI, agencia o analista). Por favor complete el registro del cliente.");
      return;
    }

    setIsUploading(true);
    
    try {
      // ✅ PREPARAR DATOS PARA LA API
      const uploadData: UploadFileData = {
        DNI_SOCIO: cliente.DOC_IDEN,      // DNI del socio
        AGENCIA: ageOriginal,             // Agencia original donde se registró
        ANALISTA: codUserOriginal         // Analista que originalmente registró
      };

      // ✅ SUBIR TODO EN UN SOLO PAYLOAD: datos + todas las imágenes juntas
      const result = await uploadAllFilesAtOnce(uploadData, {
        dniFrontal: dniFrontalFile,
        dniReverso: dniReversoFile,
        voucher: paymentFile
      });

      
      if (result.success) {
        
        let mensaje = `✅ ¡Comprobantes subidos exitosamente!`;

        // Si la respuesta contiene información adicional, mostrarla
        if (result.data && Array.isArray(result.data)) {
          mensaje += `\n\n📊 Respuesta de la DB (${result.data.length} elementos):`;
          result.data.forEach((item: any, index: number) => {
            mensaje += `\n• Archivo ${index + 1}: ${JSON.stringify(item)}`;
          });
        } else if (result.data) {
          mensaje += `\n\n📊 Respuesta de la DB:\n${JSON.stringify(result.data, null, 2)}`;
        }
        
        Notification.success(mensaje);
        // Ejecutar callback para refrescar imágenes si existe
        if (onUploadSuccess) {
          onUploadSuccess();
        }
        onClose();
      } else {
        
        let mensajeError = `❌ Error subiendo comprobantes:\n${result.error || 'Error desconocido'}`;
        
        // Si hay datos adicionales en el error, mostrarlos para debug
        if (result.data) {
          mensajeError += `\n\n🔍 Datos de la DB para debug:\n${JSON.stringify(result.data, null, 2)}`;
        }
        
        throw new Error(mensajeError);
      }
    } catch (error) {
      Notification.error(`❌ Error subiendo comprobantes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-t-lg">
          <h2 className="text-xl font-bold text-center">
            📤 Subir Comprobantes de Afiliación
          </h2>
        </div>

        <div className="p-6">
          {/* Datos del cliente disponibles */}
          {cliente && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">📋 Datos Disponibles del Socio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Nombre completo:</span>
                  <p className="text-gray-800">{`${cliente.APE_PAT || ''} ${cliente.APE_MAT || ''} ${cliente.NOMBRES || ''}`.trim()}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">DNI:</span>
                  <p className="text-gray-800">{cliente.DOC_IDEN || 'No disponible'}</p>
                </div>
              </div>
              
              {/* ✅ MOSTRAR DATOS DEL ANALISTA ORIGINAL PARA REFERENCIA */}
              {(codUserOriginal || ageOriginal) && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-800 mb-2">📋 Datos del Registro Original</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {codUserOriginal && (
                      <div>
                        <span className="font-medium text-green-700">Analista Original:</span>
                        <p className="text-gray-800">{codUserOriginal}</p>
                      </div>
                    )}
                    {ageOriginal && (
                      <div>
                        <span className="font-medium text-green-700">Agencia Original:</span>
                        <p className="text-gray-800">{ageOriginal}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instrucciones */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Orden de Carga Obligatorio</h3>
            <p className="text-yellow-700 text-sm">
              Por favor, suba los archivos en este orden específico para mantener la organización correcta:
            </p>
            <ol className="list-decimal list-inside text-yellow-700 text-sm mt-2 space-y-1">
              <li>Primero: DNI cara frontal</li>
              <li>Segundo: DNI cara reverso</li>
              <li>Tercero: Comprobante de pago</li>
            </ol>
          </div>

          {/* Campos de carga en el orden correcto */}
          <div className="flex flex-col space-y-4">
            {/* 1. DNI Cara Frontal - PRIMERO */}
            <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <label className="block text-sm font-bold text-blue-700 mb-2">
                <span className="inline-flex items-center gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                  🪪 DNI del socio - Cara frontal
                </span>
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full border-2 border-blue-300 rounded p-3 focus:border-blue-500 focus:outline-none"
                onChange={(e) => setDniFrontalFile(e.target.files?.[0] || null)}
                placeholder="Seleccionar imagen del DNI frontal..."
              />
              {dniFrontalFile && (
                <p className="text-green-600 text-sm mt-1">✅ {dniFrontalFile.name}</p>
              )}
            </div>

            {/* 2. DNI Cara Reverso - SEGUNDO */}
            <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50">
              <label className="block text-sm font-bold text-green-700 mb-2">
                <span className="inline-flex items-center gap-2">
                  <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                  🪪 DNI del socio - Cara reverso
                </span>
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full border-2 border-green-300 rounded p-3 focus:border-green-500 focus:outline-none"
                onChange={(e) => setDniReversoFile(e.target.files?.[0] || null)}
              />
              {dniReversoFile && (
                <p className="text-green-600 text-sm mt-1">✅ {dniReversoFile.name}</p>
              )}
            </div>

            {/* 3. Comprobante de Pago - TERCERO */}
            <div className="p-4 border-2 border-orange-200 rounded-lg bg-orange-50">
              <label className="block text-sm font-bold text-orange-700 mb-2">
                <span className="inline-flex items-center gap-2">
                  <span className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                  📄 Comprobante de pago
                </span>
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full border-2 border-orange-300 rounded p-3 focus:border-orange-500 focus:outline-none"
                onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
              />
              {paymentFile && (
                <p className="text-green-600 text-sm mt-1">✅ {paymentFile.name}</p>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={`px-6 py-2 text-white rounded-lg transition-colors font-medium ${
                isUploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              onClick={handleSubmit}
              disabled={isUploading}
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Subiendo archivos...
                </span>
              ) : (
                '💾 Guardar Comprobantes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}






export default CertificadoAfiliacion;