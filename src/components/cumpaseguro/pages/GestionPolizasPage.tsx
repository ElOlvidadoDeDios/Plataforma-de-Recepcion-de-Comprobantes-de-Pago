import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../contexts/AuthContext';
import { cumpaSeguroService } from '../service/cumpaSeguro.Service';
import { Poliza } from '../types';
import Layout from '../../Layout';
import { FileText, CheckCircle, Upload, Eye, Download } from 'lucide-react';
import DocumentoFirmadoModal from './Documentofirmadomodal';
import DetallePolizaModal from './Detallepolizamodal';
import ModalSubirComprobante from './modal_subir_comprobantes';


interface GestionPolizasPageProps {
  onVolver: () => void;
}

const GestionPolizasPage: React.FC<GestionPolizasPageProps> = ({ onVolver }) => {
  const { user } = useContext(AuthContext);
  const [polizas, setPolizas] = useState<Poliza[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedPoliza, setSelectedPoliza] = useState<Poliza | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showDocumentoModal, setShowDocumentoModal] = useState<boolean>(false);
  const [showVoucherModal, setShowVoucherModal] = useState<boolean>(false);
  const [documentoUrl, setDocumentoUrl] = useState<string>('');
  const [loadingDocumento, setLoadingDocumento] = useState<boolean>(false);
  const [polizaActual, setPolizaActual] = useState<Poliza | null>(null);
  const [verificandoFirma, setVerificandoFirma] = useState<boolean>(false);
  const [anulandoPoliza, setAnulandoPoliza] = useState<boolean>(false);
  const [documentoFirmado, setDocumentoFirmado] = useState<boolean>(false);
  const [mensajeDocumento, setMensajeDocumento] = useState<string>(''); // Mensaje cuando el documento no está disponible

  // Estados para loading individual de cada acción
  const [generandoContrato, setGenerandoContrato] = useState<string | null>(null);
  const [cargandoDocumento, setCargandoDocumento] = useState<string | null>(null);

  useEffect(() => {
    cargarPolizas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarPolizas = async () => {
    // user.user contiene el DNI del usuario logueado
    const userDni = user?.dni;

    if (!userDni) {
      setError('No se encontró información del usuario');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Pasar el DNI del usuario
      const response = await cumpaSeguroService.listarPolizasPorUsuario(userDni);

      if (response.success) {
        setPolizas(response.data);
      } else {
        setError('No se pudieron cargar las pólizas');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar las pólizas');
    } finally {
      setLoading(false);
    }
  };

  const obtenerEstadoContrato = (poliza: Poliza): 'PENDIENTE' | 'GENERADO' | 'PENDIENTE_FIRMA' | 'FIRMADO' | 'COMPLETADO' => {
    // 1. Si tiene voucher_url, está COMPLETADO (con voucher subido)
    if (poliza.voucher_url) {
      return 'COMPLETADO';
    }

    // 2. Verificar si existe firma y su estructura
    if (poliza.firma?.status === true && poliza.firma.data?.firm_easy) {
      const firmEasy = poliza.firma.data.firm_easy;

      // Caso: Contrato validado (status = "signed")
      if (firmEasy.status === 'signed') {
        return 'FIRMADO';
      }

      // Caso: Contrato generado y en proceso (status = "pending")
      // Puede estar:
      // - Firmado digitalmente pero pendiente de validación (signed_file existe, firm_aws existe)
      // - Creado pero sin firmar aún (signed_file = null, firm_aws = null)
      if (firmEasy.status === 'pending') {
        return 'GENERADO'; // Color AZUL
      }
    }

    // 3. Caso: Contrato no creado (firma.status = false o no existe token)
    // Este es el estado inicial cuando aún no se ha generado el contrato
    return 'PENDIENTE'; // Color NARANJA - Botón "Generar Contrato"
  };

  const handleGenerarContrato = async (poliza: Poliza) => {
    // Confirmación antes de generar
    if (!window.confirm(`¿Desea generar el contrato para ${poliza.titular.nombres} ${poliza.titular.apellido_paterno}?`)) {
      return;
    }

    try {
      setGenerandoContrato(poliza._id);

      const response = await cumpaSeguroService.generarContrato(poliza._id);

      if (response.success) {
        alert(`✅ ${response.message}`);

        // Recargar la lista de pólizas para actualizar el estado
        await cargarPolizas();
      } else {
        alert('❌ Error al generar el contrato');
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setGenerandoContrato(null);
    }
  };

  const handleVerContrato = async (poliza: Poliza) => {
    // Verificar si hay token de firma para obtener el documento
    const tokenFirm = poliza.firma?.data?.firm_easy?.token;

    if (!tokenFirm) {
      alert('⚠️ No se encontró token de firma. El contrato aún no ha sido generado.');
      return;
    }

    // Verificar si ya tenemos la URL directamente desde firm_aws
    const firmAwsUrl = poliza.firma?.data?.firm_easy?.firm_aws;

    if (firmAwsUrl) {
      // Usar URL directa de AWS sin llamar al API
      setPolizaActual(poliza);
      setDocumentoUrl(firmAwsUrl);
      setMensajeDocumento('');

      // Verificar si está firmado basándose en el status
      const estaFirmado = poliza.firma?.data?.firm_easy?.status === 'signed';
      setDocumentoFirmado(estaFirmado);
      setShowDocumentoModal(true);
      return;
    }

    try {
      setCargandoDocumento(poliza._id);
      setLoadingDocumento(true);
      setPolizaActual(poliza);

      // Llamar al API get_doc_seguro_firm para verificar el documento
      const response = await cumpaSeguroService.obtenerDocumentoFirmado({
        tokenFirm: tokenFirm,
        agencia: poliza.agencia_nom,
        nroDoc: poliza.titular.nro_documento,
        user: poliza.user
      });

      // Manejar respuesta cuando el documento no está firmado aún
      if (response.status === false) {
        const mensaje = response.message || 'El documento aún no está disponible';
        // Abrir modal mostrando el mensaje
        setMensajeDocumento(mensaje);
        setDocumentoUrl('');
        setDocumentoFirmado(false);
        setShowDocumentoModal(true);
        return;
      }

      if (response.success || response.status) {
        // Extraer URL del documento desde la nueva estructura
        const docUrl = response.update?.data?.firm_aws ||
                      response.update?.data?.signed_file_pre_frim ||
                      response.data?.firm_aws ||
                      response.data?.signed_file_pre_frim ||
                      response.data?.documento_url ||
                      response.data?.url ||
                      response.data?.signed_file ||
                      poliza.firma?.data?.firm_easy?.signed_file;

        // Verificar si el documento ya está firmado (basado en signed_file o status)
        const responseStatus = response.update?.data?.status || response.data?.status || poliza.firma?.data?.firm_easy?.status;
        const estaFirmado = responseStatus === 'signed' || !!(response.update?.data?.signed_file || response.data?.signed_file);
        setDocumentoFirmado(estaFirmado);
        setMensajeDocumento(''); // Limpiar mensaje de error

        if (docUrl) {
          setDocumentoUrl(docUrl);
          setShowDocumentoModal(true);
        } else {
          // Mostrar modal con mensaje de que no está disponible
          setMensajeDocumento('El documento aún no está disponible. Por favor, espere unos momentos.');
          setDocumentoUrl('');
          setDocumentoFirmado(false);
          setShowDocumentoModal(true);
        }
      } else {
        // Mostrar modal con mensaje de error
        setMensajeDocumento('No se pudo obtener el documento. Intente nuevamente más tarde.');
        setDocumentoUrl('');
        setDocumentoFirmado(false);
        setShowDocumentoModal(true);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error al obtener el documento';
      // Mostrar modal con el error
      setMensajeDocumento(errorMessage);
      setDocumentoUrl('');
      setDocumentoFirmado(false);
      setShowDocumentoModal(true);
    } finally {
      setLoadingDocumento(false);
      setCargandoDocumento(null);
    }
  };

  const handleVerificarDocumento = async () => {
    if (!polizaActual) return;

    const tokenFirm = polizaActual.firma?.data?.firm_easy?.token;
    const dni = polizaActual.titular.nro_documento;

    if (!tokenFirm) {
      alert('⚠️ No se encontró el token de firma');
      return;
    }

    if (!window.confirm('¿Desea validar la firma de este documento?')) {
      return;
    }

    try {
      setVerificandoFirma(true);

      // Llamar al nuevo endpoint de validación
      const response = await cumpaSeguroService.validarFirmaAsegurado({
        dni: dni,
        idDocument: tokenFirm
      });

      // Manejar respuesta cuando la validación falla
      if (response.status === false) {
        const mensaje = response.message || 'No se pudo validar la firma';
        alert(`⚠️ ${mensaje}`);
        return;
      }

      if (response.success || response.status === true) {
        // Validación exitosa
        alert('✅ ' + (response.message || 'Firma validada exitosamente. El documento ha sido validado correctamente.'));

        // Cerrar el modal
        setShowDocumentoModal(false);
        setDocumentoUrl('');
        setPolizaActual(null);
        setDocumentoFirmado(false);
        setMensajeDocumento('');

        // Recargar la lista de pólizas para ver los cambios
        await cargarPolizas();
      } else {
        alert('❌ No se pudo validar la firma del documento');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error al validar la firma';
      alert(`❌ ${errorMessage}`);
    } finally {
      setVerificandoFirma(false);
    }
  };

  const handleAnularPoliza = async () => {
    if (!polizaActual) return;

    // Confirmación antes de anular
    if (!window.confirm('¿Está seguro que desea ANULAR/DESHABILITAR este documento? Esta acción es irreversible.')) {
      return;
    }

    try {
      setAnulandoPoliza(true);

      const tokenFirm = polizaActual.firma?.data?.firm_easy?.token;
      const dniTitular = polizaActual.titular.nro_documento;

      if (!tokenFirm) {
        alert('⚠️ No se encontró token de firma. No se puede anular el documento.');
        return;
      }

      const response = await cumpaSeguroService.anularPolizaSeguro({
        dni: dniTitular,
        idDocument: tokenFirm
      });

      // Manejar respuesta cuando la anulación falla
      if (response.status === false) {
        const mensaje = response.message || 'No se pudo anular la póliza';
        alert(`⚠️ ${mensaje}`);
        return;
      }

      if (response.success || response.status === true) {
        // Anulación exitosa
        alert('✅ ' + (response.message || 'Póliza anulada exitosamente. El documento ha sido deshabilitado.'));

        // Cerrar el modal
        setShowDocumentoModal(false);
        setDocumentoUrl('');
        setPolizaActual(null);
        setDocumentoFirmado(false);
        setMensajeDocumento('');

        // Recargar la lista de pólizas para ver los cambios
        await cargarPolizas();
      } else {
        alert('❌ No se pudo anular la póliza');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error al anular la póliza';
      alert(`❌ ${errorMessage}`);
    } finally {
      setAnulandoPoliza(false);
    }
  };

  const handleSubirVoucher = (poliza: Poliza) => {
    setSelectedPoliza(poliza);
    setShowVoucherModal(true);
  };

  const handleSubmitVoucher = async (poliza: Poliza, file: File) => {
    try {
      // Obtener el user del usuario logueado
      const userName = user?.user;
      if (!userName) {
        throw new Error('No se encontró información del usuario');
      }

      // Obtener el token de firma
      const token = poliza.firma?.data?.firm_easy?.token;
      if (!token) {
        throw new Error('No se encontró el token de firma en la póliza');
      }

      // Llamar al servicio con los parámetros correctos
      const response = await cumpaSeguroService.subirVoucher(
        token, // token de firma en lugar del id
        poliza.titular.nro_documento, // dni: DNI del titular/socio
        userName, // user_registra: user del sistema
        file // imagen: archivo del voucher
      );
      
      if (response.success) {
        alert(`✅ ${response.message}`);
        setShowVoucherModal(false);
        setSelectedPoliza(null);
        // Recargar pólizas para actualizar el estado
        await cargarPolizas();
      } else {
        throw new Error(response.message || 'Error al subir el voucher');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Error al subir el voucher');
    }
  };

  const handleVerDetalles = (poliza: Poliza) => {
    setSelectedPoliza(poliza);
    setShowModal(true);
  };

  const renderAcciones = (poliza: Poliza) => {
    const estadoContrato = obtenerEstadoContrato(poliza);
    const estaGenerando = generandoContrato === poliza._id;
    const estaCargando = cargandoDocumento === poliza._id;

    return (
      <div className="flex flex-wrap gap-2 justify-start md:justify-center">
        {/* Botón: Generar Contrato (Naranja) - Solo si está PENDIENTE */}
        {estadoContrato === 'PENDIENTE' && (
          <button
            onClick={() => handleGenerarContrato(poliza)}
            disabled={estaGenerando || estaCargando}
            className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            title="Generar Contrato"
          >
            {estaGenerando ? (
              <svg className="animate-spin h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <FileText size={18} />
            )}
          </button>
        )}

        {/* Botón: Ver y Verificar Contrato (Azul) - Solo si está GENERADO */}
        {estadoContrato === 'GENERADO' && (
          <button
            onClick={() => handleVerContrato(poliza)}
            disabled={estaGenerando || estaCargando}
            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            title="Ver y Verificar Contrato"
          >
            {estaCargando ? (
              <svg className="animate-spin h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Eye size={18} />
            )}
          </button>
        )}

        {/* Botón: Ver Contrato Firmado (Verde) - Solo si está FIRMADO */}
        {estadoContrato === 'FIRMADO' && (
          <>
            <button
              onClick={() => handleVerContrato(poliza)}
              disabled={estaGenerando || estaCargando}
              className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              title="Ver Contrato Firmado"
            >
              {estaCargando ? (
                <svg className="animate-spin h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <CheckCircle size={18} />
              )}
            </button>
            <button
              onClick={() => handleSubirVoucher(poliza)}
              disabled={estaGenerando || estaCargando}
              className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Subir Voucher de Pago"
            >
              <Upload size={18} />
            </button>
          </>
        )}

        {/* Botón: Completado (Verde) - Solo si está COMPLETADO */}
        {estadoContrato === 'COMPLETADO' && (
          <>
            <button
              onClick={() => handleVerContrato(poliza)}
              disabled={estaGenerando || estaCargando}
              className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              title="Ver Contrato"
            >
              {estaCargando ? (
                <svg className="animate-spin h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <CheckCircle size={18} />
              )}
            </button>
            <button
              onClick={() => handleVerDetalles(poliza)}
              disabled={estaGenerando || estaCargando}
              className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Ver Voucher"
            >
              <Download size={18} />
            </button>
          </>
        )}

        {/* Botón: Ver Detalles (Siempre disponible) */}
        <button
          onClick={() => handleVerDetalles(poliza)}
          disabled={estaGenerando || estaCargando}
          className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Ver Detalles"
        >
          <Eye size={18} />
        </button>
      </div>
    );
  };

  const obtenerBadgeEstado = (estado: string) => {
    const estadoContrato = estado.toUpperCase();
    const colores: { [key: string]: string } = {
      'PENDIENTE': 'bg-orange-100 text-orange-800 border-orange-200',
      'GENERADO': 'bg-blue-100 text-blue-800 border-blue-200',
      'PENDIENTE_FIRMA': 'bg-blue-100 text-blue-800 border-blue-200',
      'FIRMADO': 'bg-green-100 text-green-800 border-green-200',
      'COMPLETADO': 'bg-green-100 text-green-800 border-green-200',
      'INGRESADO': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };

    const colorClase = colores[estadoContrato] || 'bg-gray-100 text-gray-800 border-gray-200';

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colorClase}`}>
        {estadoContrato.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout title="Gestión de Pólizas" showBackButton={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando pólizas...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Gestión de Pólizas" showBackButton={true}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={cargarPolizas}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Reintentar
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestión de Pólizas" showBackButton={true}>
      <div className="space-y-4">
        {/* Botón de Volver personalizado */}
        <div className="flex items-center gap-4">
          <button
            onClick={onVolver}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </button>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Pólizas Registradas</h2>
            <p className="text-xs sm:text-sm text-gray-600">Total: {polizas.length} pólizas</p>
          </div>
          <button
            onClick={cargarPolizas}
            className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            🔄 Actualizar
          </button>
        </div>

        {/* Tabla de Pólizas - Vista Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Titular
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo Atención
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Beneficiarios
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {polizas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No hay pólizas registradas
                    </td>
                  </tr>
                ) : (
                  polizas.map((poliza) => (
                    <tr key={poliza._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{poliza.fecha_local}</div>
                          <div className="text-xs text-gray-500">{poliza.hora_local}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {poliza.titular.nombres}
                        </div>
                        <div className="text-sm text-gray-500">
                          {poliza.titular.apellido_paterno} {poliza.titular.apellido_materno}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{poliza.titular.tipo_documento}</div>
                        <div className="text-xs text-gray-500">{poliza.titular.nro_documento}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {poliza.titular.tipo_atencion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        S/ {poliza.titular.costo.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {poliza.beneficiarios.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {obtenerBadgeEstado(obtenerEstadoContrato(poliza))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renderAcciones(poliza)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vista de Tarjetas - Vista Móvil */}
        <div className="md:hidden space-y-4">
          {polizas.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              No hay pólizas registradas
            </div>
          ) : (
            polizas.map((poliza) => (
              <div key={poliza._id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                {/* Header de la tarjeta */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-base">
                      {poliza.titular.nombres}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {poliza.titular.apellido_paterno} {poliza.titular.apellido_materno}
                    </p>
                  </div>
                  <div className="ml-2">
                    {obtenerBadgeEstado(obtenerEstadoContrato(poliza))}
                  </div>
                </div>

                {/* Información en grid */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">📅 Fecha:</span>
                    <span className="font-medium text-gray-900">
                      {poliza.fecha_local} {poliza.hora_local}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">📄 Documento:</span>
                    <span className="font-medium text-gray-900">
                      {poliza.titular.tipo_documento}: {poliza.titular.nro_documento}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">🏥 Atención:</span>
                    <span className="font-medium text-gray-900">{poliza.titular.tipo_atencion}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">💰 Costo:</span>
                    <span className="font-bold text-green-600">S/ {poliza.titular.costo.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">👥 Beneficiarios:</span>
                    <span className="font-medium text-gray-900">{poliza.beneficiarios.length}</span>
                  </div>
                </div>

                {/* Botones de acciones - Adaptados para móvil */}
                <div className="border-t pt-3 mt-3">
                  {renderAcciones(poliza)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal de Detalles */}
        {showModal && selectedPoliza && (
          <DetallePolizaModal
            poliza={selectedPoliza}
            estadoContrato={obtenerEstadoContrato(selectedPoliza)}
            obtenerBadgeEstado={obtenerBadgeEstado}
            onClose={() => setShowModal(false)}
          />
        )}

        {/* Modal de Documento Firmado */}
        {showDocumentoModal && (
          <DocumentoFirmadoModal
            polizaActual={polizaActual}
            documentoUrl={documentoUrl}
            loadingDocumento={loadingDocumento}
            mensajeDocumento={mensajeDocumento}
            documentoFirmado={documentoFirmado}
            verificandoFirma={verificandoFirma}
            anulandoPoliza={anulandoPoliza}
            onVerificar={handleVerificarDocumento}
            onAnular={handleAnularPoliza}
            onClose={() => {
              setShowDocumentoModal(false);
              setDocumentoUrl('');
              setPolizaActual(null);
              setDocumentoFirmado(false);
              setMensajeDocumento('');
            }}
          />
        )}

        {/* Modal de Subir Comprobante */}
        {showVoucherModal && selectedPoliza && (
          <ModalSubirComprobante
            poliza={selectedPoliza}
            onClose={() => {
              setShowVoucherModal(false);
              setSelectedPoliza(null);
            }}
            onSubir={handleSubmitVoucher}
          />
        )}
      </div>
    </Layout>
  );
};

export default GestionPolizasPage;