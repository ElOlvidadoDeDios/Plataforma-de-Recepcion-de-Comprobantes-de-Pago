import { ReactElement, useState, useEffect } from "react";
import { FichaIngreso, CertificadoAfiliacion, PreviewModal, Modal} from "./certificados/CertificadoAfiliacion";
import { DatosCertificado } from "../../types/clienteData";
import afiliacionApi from "../../api/afiliacionAPi";
import FormularioAdicional from "./certificados/formularioExtra";
import { createPortal } from "react-dom";

// Props del componente principal
interface CertificadosAfiliacionProps {
  datosCertificado?: DatosCertificado;
  documentosExistentes?: {
    CUENTA?: string;
    DNI_FRONTAL?: string;
    DNI_POSTERIOR?: string;
    OTRO_DOCUMENTO?: string;
  };
}

// Componente principal
export default function CertificadosAfiliacion({
  datosCertificado,
  documentosExistentes
}: CertificadosAfiliacionProps): ReactElement {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isCertificatePreviewModalOpen, setIsCertificatePreviewModalOpen] = useState(false);
  const [isFormularioModalOpen, setIsFormularioModalOpen] = useState(false);
  
  // Estados para validación con getImgSocio
  const [documentosYaExisten, setDocumentosYaExisten] = useState<boolean>(false);
  const [cargandoValidacion, setCargandoValidacion] = useState<boolean>(false);

  // const fichaRef = useRef<HTMLDivElement>(null);
  // const certificadoRef = useRef<HTMLDivElement>(null);

  // Verificar si hay datos completos para generar documentos
  const tieneDAtoCompletos = datosCertificado &&
    datosCertificado.cliente &&
    datosCertificado.cliente.APE_PAT &&
    datosCertificado.cliente.NOMBRES &&
    datosCertificado.cliente.DOC_IDEN;

  // useEffect para validar con getImgSocio
  useEffect(() => {
    const validarDocumentosExistentes = async () => {
      if (datosCertificado?.cliente?.DOC_IDEN) {
        // Limpiar estados anteriores cuando cambia el DNI
        setDocumentosYaExisten(false);
        setCargandoValidacion(true);
           
        try {
          const respuesta = await afiliacionApi.getImgSocio(datosCertificado.cliente.DOC_IDEN);

          
          // Si status es true, significa que YA HAY documentos cargados
          if (respuesta && respuesta.status === true) {
            setDocumentosYaExisten(true);

          } else {
            setDocumentosYaExisten(false);

          }
        } catch (error) {

          // En caso de error, permitir subida
          setDocumentosYaExisten(false);
        } finally {
          setCargandoValidacion(false);
        }
      } else {
        // Si no hay DNI, limpiar estados

        setDocumentosYaExisten(false);
        setCargandoValidacion(false);
      }
    };

    validarDocumentosExistentes();
  }, [datosCertificado?.cliente?.DOC_IDEN]);

  // ✅ DETERMINAR SI SE PUEDE SUBIR (usando validación con getImgSocio)
  const puedeSubirDocumentos = tieneDAtoCompletos && !documentosYaExisten && !cargandoValidacion;

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow-md max-w-full overflow-hidden">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center text-gray-800">
        Certificados y Documentos
      </h1>

      {/* Mostrar estado de los datos */}
      {!tieneDAtoCompletos && (
        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-center text-sm md:text-base">
            ⚠️ <strong>Datos incompletos:</strong> Complete el registro del cliente en las pestañas "Datos" y "Dirección" para poder generar los documentos.
          </p>
        </div>
      )}

      {/* ✅ SECCIÓN: ESTADO DE VALIDACIÓN */}
      {cargandoValidacion && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-blue-700 text-sm md:text-base">Verificando documentos existentes...</p>
          </div>
        </div>
      )}

      {/* ✅ SECCIÓN: DOCUMENTOS YA EXISTEN */}
      {!cargandoValidacion && documentosYaExisten && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-semibold text-yellow-800 mb-3 flex items-center">
            <span className="mr-2">⚠️</span>
            Documentos ya cargados
          </h3>
          <p className="text-yellow-700 text-sm md:text-base">
            Este cliente ya tiene documentos de afiliación cargados en el sistema.
            No es necesario subir nuevos documentos.
          </p>
        </div>
      )}

      {/* ✅ MOSTRAR DOCUMENTOS EXISTENTES SI LOS HAY */}
      {documentosExistentes && (documentosExistentes.DNI_FRONTAL || documentosExistentes.DNI_POSTERIOR || documentosExistentes.OTRO_DOCUMENTO) && (
        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-base md:text-lg font-semibold text-green-800 mb-3 text-center">
            ✅ Documentos ya cargados
          </h3>
          <p className="text-green-700 text-center text-xs md:text-sm mb-4">
            Este socio ya tiene documentos de afiliación registrados en el sistema.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {/* DNI Frontal */}
            {documentosExistentes?.DNI_FRONTAL && (
              <div className="text-center">
                <div className="bg-white p-2 md:p-3 rounded-lg border border-green-300">
                  <h4 className="font-semibold text-green-800 mb-2 text-sm md:text-base">🪪 DNI Frontal</h4>
                  <img
                    src={documentosExistentes.DNI_FRONTAL}
                    alt="DNI Frontal"
                    className="w-full h-24 md:h-32 object-contain rounded border"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text y="50" x="50" text-anchor="middle" dy=".3em">📄</text></svg>';
                    }}
                  />
                  <p className="text-xs text-green-600 mt-2">✅ Cargado</p>
                </div>
              </div>
            )}

            {/* DNI Posterior */}
            {documentosExistentes?.DNI_POSTERIOR && (
              <div className="text-center">
                <div className="bg-white p-2 md:p-3 rounded-lg border border-green-300">
                  <h4 className="font-semibold text-green-800 mb-2 text-sm md:text-base">🪪 DNI Posterior</h4>
                  <img
                    src={documentosExistentes.DNI_POSTERIOR}
                    alt="DNI Posterior"
                    className="w-full h-24 md:h-32 object-contain rounded border"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text y="50" x="50" text-anchor="middle" dy=".3em">📄</text></svg>';
                    }}
                  />
                  <p className="text-xs text-green-600 mt-2">✅ Cargado</p>
                </div>
              </div>
            )}

            {/* Voucher */}
            {documentosExistentes?.OTRO_DOCUMENTO && (
              <div className="text-center">
                <div className="bg-white p-2 md:p-3 rounded-lg border border-green-300">
                  <h4 className="font-semibold text-green-800 mb-2 text-sm md:text-base">🧾 Comprobante</h4>
                  <img
                    src={documentosExistentes.OTRO_DOCUMENTO}
                    alt="Comprobante de Pago"
                    className="w-full h-24 md:h-32 object-contain rounded border"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text y="50" x="50" text-anchor="middle" dy=".3em">📄</text></svg>';
                    }}
                  />
                  <p className="text-xs text-green-600 mt-2">✅ Cargado</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-xs md:text-sm text-center">
              ℹ️ <strong>Información:</strong> Los documentos ya están registrados. No es necesario volver a subirlos.
            </p>
          </div>
        </div>
      )}

      {/* BOTONES PRINCIPALES - RESPONSIVE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <button
          onClick={() => setIsPreviewModalOpen(true)}
          disabled={!tieneDAtoCompletos}
          className={`w-full px-4 md:px-6 py-2.5 md:py-3 text-white rounded-lg shadow transition duration-200 font-medium text-sm md:text-base ${
            tieneDAtoCompletos
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          title={!tieneDAtoCompletos ? 'Complete los datos del cliente primero' : ''}
        >
          <span className="block sm:hidden">📄 Ficha de ingreso</span>
          <span className="hidden sm:block">📄 Imprimir ficha de ingreso</span>
        </button>
        
        <button
          onClick={() => setIsCertificatePreviewModalOpen(true)}
          disabled={!tieneDAtoCompletos}
          className={`w-full px-4 md:px-6 py-2.5 md:py-3 text-white rounded-lg shadow transition duration-200 font-medium text-sm md:text-base ${
            tieneDAtoCompletos
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          title={!tieneDAtoCompletos ? 'Complete los datos del cliente primero' : ''}
        >
          <span className="block sm:hidden">📋 Certificado</span>
          <span className="hidden sm:block">📋 Certificado de afiliación</span>
        </button>
        
        <button
          className={`w-full px-4 md:px-6 py-2.5 md:py-3 text-white rounded-lg shadow transition duration-200 font-medium text-sm md:text-base ${
            puedeSubirDocumentos
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          onClick={() => setIsModalOpen(true)}
          disabled={!puedeSubirDocumentos}
          title={
            !tieneDAtoCompletos
              ? 'Complete los datos del cliente primero'
              : documentosYaExisten
                ? 'Los documentos ya están cargados'
                : 'Subir comprobantes de afiliación'
          }
        >
          {documentosYaExisten ? (
            <>
              <span className="block sm:hidden">✅ Ya cargados</span>
              <span className="hidden sm:block">✅ Documentos ya cargados</span>
            </>
          ) : (
            <>
              <span className="block sm:hidden">📤 Subir docs</span>
              <span className="hidden sm:block">📤 Subir comprobantes de afiliación</span>
            </>
          )}
        </button>

        {/* NUEVO BOTÓN PARA FORMULARIO ADICIONAL */}
        <button
          onClick={() => setIsFormularioModalOpen(true)}
          disabled={!tieneDAtoCompletos || datosCertificado?.cliente?.SITUACION !== 'AFILIADO'} // Desactivar si no es AFILIADO
          className={`w-full px-4 md:px-6 py-2.5 md:py-3 rounded-lg shadow transition duration-200 font-medium text-sm md:text-base ${
            tieneDAtoCompletos && datosCertificado?.cliente?.SITUACION === 'AFILIADO'
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
          title={
            !tieneDAtoCompletos
              ? 'Complete los datos del cliente primero'
              : datosCertificado?.cliente?.SITUACION !== 'AFILIADO'
              ? 'Solo disponible para socios AFILIADOS'
              : 'Abrir formulario adicional'
          }
        >
          <span className="block sm:hidden">📝 Formulario</span>
          <span className="hidden sm:block">📝 Formulario adicional</span>
        </button>
      </div>

      {/* MODALES */}
      {isModalOpen && (
        <Modal
          onClose={() => setIsModalOpen(false)}
          datosCertificado={datosCertificado}
          onUploadSuccess={() => {
            setDocumentosYaExisten(true);
          }}
        />
      )}

      {isPreviewModalOpen && (
        <PreviewModal
          title="Ficha de Ingreso"
          onClose={() => setIsPreviewModalOpen(false)}
        >
          <FichaIngreso datosCertificado={datosCertificado} />
        </PreviewModal>
      )}

      {isCertificatePreviewModalOpen && (
        <PreviewModal
          title="Certificado de Afiliación"
          onClose={() => setIsCertificatePreviewModalOpen(false)}
        >
          <CertificadoAfiliacion datosCertificado={datosCertificado} />
        </PreviewModal>
      )}

      {/* NUEVO MODAL PARA FORMULARIO ADICIONAL CON PORTAL */}
      {isFormularioModalOpen && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center rounded-t-lg z-10">
              <h2 className="text-xl font-bold text-gray-800">📝 Información Adicional</h2>
              <button
                onClick={() => setIsFormularioModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-full"
                title="Cerrar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="p-1">
              <FormularioAdicional
                onSubmit={() => {
                  // Aquí puedes agregar la lógica para enviar los datos al backend
                  // Por ejemplo: await afiliacionApi.guardarInformacionAdicional(datosCertificado?.cliente?.DOC_IDEN, data);
                  alert('✅ Información guardada correctamente');
                  setIsFormularioModalOpen(false);
                }}
                onCancel={() => setIsFormularioModalOpen(false)}
                datosBasicos={{
                  NVA_CTA: datosCertificado?.cliente?.NVA_CTA || '',
                  APE_PAT: datosCertificado?.cliente?.APE_PAT || '',
                  APE_MAT: datosCertificado?.cliente?.APE_MAT || '',
                  NOMBRES: datosCertificado?.cliente?.NOMBRES || '',
                  SITUACION: datosCertificado?.cliente?.SITUACION || '',
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}