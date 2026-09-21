import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import {
    prepareInfoReport,
    updateReportData,
    verificarGps,
    verificarSuministro
} from "../../api/geodileApi";
import { useNotifications } from "../../hooks/useNotifications";
import { debounce } from "lodash";
import { FileText, User, CheckCircle, AlertTriangle, Map, Save, Search, Download, ZoomIn, X, Edit3 } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const Notification = useNotifications();

export default function ModalGenerarReportUbicacion({ isOpen, onClose }: ModalProps) {
    const { user } = useContext(AuthContext);
    const userData = user;
    const [isSocio, setIsSocio] = useState<string>('');
    const initialFormData = { DNI: '', SOCIO: '' };
    const [formData, setFormData] = useState(initialFormData);
    const [datosIncompletos, setDatosIncompletos] = useState<any[]>([]);
    const [mostrarVerificacion, setMostrarVerificacion] = useState(false);
    const [datosCompletos, setDatosCompletos] = useState<{ [key: number]: any }>({});
    const [puedeGenerarReporte, setPuedeGenerarReporte] = useState(false);
    const [mensajesSuministro, setMensajesSuministro] = useState<Record<number, { texto: string; color: string } | null>>({});
    
    const [isSearching, setIsSearching] = useState(false);
    const [loadingGuardar, setLoadingGuardar] = useState<Record<number, boolean>>({});
    
    const [activeTab, setActiveTab] = useState<number>(0);

    const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);
    const [mapaAmpliado, setMapaAmpliado] = useState<{lat: string, lng: string, tipo: string} | null>(null);

    // =========================================================================
    // 🧹 LIMPIEZA TOTAL Y CIERRE CON ESCAPE
    // =========================================================================
    const handleCloseModal = () => {
        setFormData(initialFormData);
        setIsSocio('');
        setDatosIncompletos([]);
        setMostrarVerificacion(false);
        setDatosCompletos({});
        setPuedeGenerarReporte(false);
        setMensajesSuministro({});
        setActiveTab(0);
        onClose();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !imagenAmpliada && !mapaAmpliado) {
                handleCloseModal();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, imagenAmpliada, mapaAmpliado]);
    // =========================================================================

    const verificarSuministroDebounced = debounce(async (index: number, suministro: string) => {
        if (!suministro.trim()) {
            setMensajesSuministro(prev => ({ ...prev, [index]: null }));
            return;
        }

        try {
            const data = await verificarSuministro(suministro);
            if (data?.status) {
                setMensajesSuministro(prev => ({
                    ...prev,
                    [index]: {
                        texto: `⚠️ Suministro existente: ${data.socio || 'N/A'} (${data.agencia || 'N/A'})`,
                        color: 'text-yellow-700 bg-yellow-100'
                    }
                }));
            } else {
                setMensajesSuministro(prev => ({
                    ...prev,
                    [index]: {
                        texto: '✅ Suministro nuevo',
                        color: 'text-green-700 bg-green-100'
                    }
                }));
            }
        } catch (error) {
            setMensajesSuministro(prev => ({
                ...prev,
                [index]: {
                    texto: '❌ Error al verificar',
                    color: 'text-red-700 bg-red-100'
                }
            }));
        }
    }, 500);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            [id.toUpperCase()]: value
        }));
    };

    const fetchSocio = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent) => {
        if ('preventDefault' in e) e.preventDefault();
        if (!userData?.dni) {
            Notification.warning('Usuario no encontrado');
            return;
        }

        setIsSearching(true);
        try {
            const reporteInfo = await prepareInfoReport(formData.DNI);
            
            if (reporteInfo.status === true) {
                setIsSocio('true');
                setActiveTab(0);
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    SOCIO: reporteInfo.socio || ''
                }));

                setPuedeGenerarReporte(reporteInfo.GENERAR || false);

                let fotosData: any[] = [];
                try {
                    const gpsResponse = await verificarGps(userData.dni, formData.DNI);
                    if (gpsResponse.status && gpsResponse.data) {
                        fotosData = gpsResponse.data;
                    }
                } catch (error) {
                    console.warn("No se pudieron extraer las fotos del GPS", error);
                }

                const dataCombinada = reporteInfo.data.map(item => {
                    const gpsMatch = fotosData.find((f: any) => f.tipo_ubicacion === item.tipo_ubicacion);
                    return {
                        ...item,
                        fachada: gpsMatch?.fachada || null,
                        selfie: gpsMatch?.selfie || null
                    };
                });

                setDatosIncompletos(dataCombinada);

                const datosCompletos: { [key: number]: any } = {};
                const domicilioIndex = dataCombinada.findIndex(d => d.tipo_ubicacion === 'DOMICILIO');
                const negocioIndex = dataCombinada.findIndex(d => d.tipo_ubicacion === 'NEGOCIO');
                
                dataCombinada.forEach((item, index) => {
                    datosCompletos[index] = { ...item };
                });

                if (domicilioIndex !== -1 && negocioIndex !== -1) {
                    const domicilio = dataCombinada[domicilioIndex];
                    const negocio = dataCombinada[negocioIndex];
                    
                    if (domicilio.condicion_negocio && domicilio.condicion_negocio.trim() !== '' && 
                        (!negocio.condicion_negocio || negocio.condicion_negocio.trim() === '')) {
                        
                        if (domicilio.condicion_negocio === 'SI') {
                            datosCompletos[negocioIndex] = {
                                ...datosCompletos[negocioIndex],
                                suministro: domicilio.suministro || datosCompletos[negocioIndex].suministro,
                                direccion: domicilio.direccion || datosCompletos[negocioIndex].direccion,
                                ref_vehiculo: domicilio.ref_vehiculo || datosCompletos[negocioIndex].ref_vehiculo,
                                ref_paradero: domicilio.ref_paradero || datosCompletos[negocioIndex].ref_paradero,
                                ref_adicional: domicilio.ref_adicional || datosCompletos[negocioIndex].ref_adicional,
                                condicion_negocio: 'Heredado del domicilio'
                            };
                        } else {
                            datosCompletos[negocioIndex] = {
                                ...datosCompletos[negocioIndex],
                                condicion_negocio: domicilio.condicion_negocio
                            };
                        }
                    }
                }
                
                setDatosCompletos(datosCompletos);
                setMostrarVerificacion(true);
            } else {
                setIsSocio('false');
                setPuedeGenerarReporte(false);
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    SOCIO: "EL DNI INGRESADO NO EXISTE EN NUESTRA BD"
                }));
                setMostrarVerificacion(false);
            }
        } catch (error) {
            setIsSocio('false');
            setMostrarVerificacion(false);
        } finally {
            setIsSearching(false);
        }
    };

    const handleVerificacionChange = (index: number, campo: string, valor: string) => {
        setDatosCompletos(prev => ({
            ...prev,
            [index]: {
                ...prev[index],
                [campo]: valor
            }
        }));

        if (campo === 'suministro') {
            verificarSuministroDebounced(index, valor);
        }
    };

    const handleCondicionNegocioChange = (index: number, valor: string) => {
        const item = datosIncompletos[index];
        const negocioIndex = datosIncompletos.findIndex(d => d.tipo_ubicacion === 'NEGOCIO');

        if (item.tipo_ubicacion === 'DOMICILIO' && negocioIndex !== -1) {
            if (valor === 'SI') {
                const datosDelDomicilio = datosCompletos[index];
                setDatosCompletos(prev => ({
                    ...prev,
                    [negocioIndex]: {
                        ...prev[negocioIndex],
                        suministro: datosDelDomicilio.suministro,
                        direccion: datosDelDomicilio.direccion,
                        ref_vehiculo: datosDelDomicilio.ref_vehiculo,
                        ref_paradero: datosDelDomicilio.ref_paradero,
                        ref_adicional: datosDelDomicilio.ref_adicional,
                        condicion_negocio: 'Heredado del domicilio'
                    }
                }));
            } else {
                const datosOriginalesNegocio = datosIncompletos[negocioIndex];
                setDatosCompletos(prev => ({
                    ...prev,
                    [negocioIndex]: {
                        ...prev[negocioIndex],
                        suministro: datosOriginalesNegocio.suministro || '',
                        direccion: datosOriginalesNegocio.direccion || '',
                        ref_vehiculo: datosOriginalesNegocio.ref_vehiculo || '',
                        ref_paradero: datosOriginalesNegocio.ref_paradero || '',
                        ref_adicional: datosOriginalesNegocio.ref_adicional || '',
                        condicion_negocio: valor === 'NO TIENE NEGOCIO' ? 'No aplica - No tiene negocio' : 'Negocio en otra ubicación'
                    }
                }));
            }
        }

        setDatosCompletos(prev => ({
            ...prev,
            [index]: {
                ...prev[index],
                condicion_negocio: valor
            }
        }));
    };

    const actualizarRegistroIndividual = async (index: number) => {
        try {
            if (!userData?.dni) {
                Notification.error('Error: Usuario no encontrado');
                return;
            }

            const registro = datosCompletos[index];
            const camposFaltantes = [
                !registro.suministro || registro.suministro.trim() === '',
                !registro.direccion || registro.direccion.trim() === '',
                !registro.ref_vehiculo || registro.ref_vehiculo.trim() === '',
                !registro.ref_paradero || registro.ref_paradero.trim() === '',
                !registro.ref_adicional || registro.ref_adicional.trim() === '',
                !registro.condicion_negocio || registro.condicion_negocio.trim() === ''
            ].some(campo => campo);

            if (camposFaltantes) {
                Notification.warning('⚠️ Complete todos los campos requeridos para este registro.');
                return;
            }

            setLoadingGuardar(prev => ({ ...prev, [index]: true }));
            const datosParaEnviar = { [index]: registro };
            const result = await updateReportData(datosParaEnviar, userData.dni, formData.SOCIO, formData.DNI);

            if (result.status) {
                const e = new Event('submit') as unknown as React.FormEvent<HTMLFormElement>;
                await fetchSocio(e);
                Notification.success('✅ Datos guardados correctamente.');
            } else {
                Notification.error(`❌ Error al actualizar: ${result.message}`);
            }
        } catch (error: any) {
            Notification.error(`❌ Error: ${error.message}`);
        } finally {
            setLoadingGuardar(prev => ({ ...prev, [index]: false }));
        }
    };

    // =========================================================================
    // 🖨️ MOTOR DE IMPRESIÓN
    // =========================================================================
    const handlePrint = () => {
        Notification.info('Preparando documento PDF...');
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            Notification.warning("⚠️ Su navegador bloqueó la ventana emergente. Por favor, permita los pop-ups.");
            return;
        }

        const fechaImpresion = new Date().toLocaleString('es-PE', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', hour12: true 
        });
        const nombreUsuario = userData?.razon || userData?.user || 'SISTEMA ADMINISTRADOR';

        const htmlContent = datosIncompletos.map((item, index) => {
            const cleanLat = item.lat ? String(item.lat).replace(/[^0-9.-]/g, '') : '';
            const cleanLng = item.lng ? String(item.lng).replace(/[^0-9.-]/g, '') : '';

            return `
                <div class="hoja-a4">
                    <div class="pdf-header">
                        <div class="header-text">
                            <h2>DILE - COOPERATIVA DE AHORRO Y CRÉDITO</h2>
                            <h3>REPORTE DE GEOLOCALIZACIÓN: ${item.tipo_ubicacion}</h3>
                        </div>
                        <img src="https://plataformadepagosdile.netlify.app/assets/logo_dile-CnWgqqS_.webp" alt="Logo" class="pdf-logo" />
                    </div>
                    
                    <div class="pdf-info-consulta">
                        <span>CONSULTADO POR: ${nombreUsuario}</span>
                        <span>FECHA DE IMPRESIÓN: ${fechaImpresion}</span>
                    </div>

                    <div class="pdf-body">
                        <div class="pdf-row">
                            <div class="pdf-col">
                                <div class="pdf-line-item"><span class="pdf-label">SOCIO TITULAR:</span><span class="pdf-value">${formData.SOCIO}</span></div>
                                <div class="pdf-line-item"><span class="pdf-label">DNI:</span><span class="pdf-value">${formData.DNI}</span></div>
                                <div class="pdf-line-item"><span class="pdf-label">CONDICIÓN:</span><span class="pdf-value">${item.condicion_negocio || 'N/A'}</span></div>
                            </div>
                            <div class="pdf-col">
                                <div class="pdf-line-item"><span class="pdf-label" style="width:40%">Nº SUMINISTRO:</span><span class="pdf-value" style="width:60%">${item.suministro || 'S/N'}</span></div>
                                <div class="pdf-line-item"><span class="pdf-label" style="width:40%">FECHA / HORA:</span><span class="pdf-value" style="width:60%">${item.fecha_cap || ''} ${item.hora_cap || ''}</span></div>
                                <div class="pdf-line-item"><span class="pdf-label" style="width:40%">COORDENADAS:</span><span class="pdf-value" style="width:60%">${item.lat}, ${item.lng}</span></div>
                            </div>
                        </div>
                        
                        <div class="pdf-line"></div>
                        
                        <div class="pdf-referencias">
                            <div class="pdf-line-item"><span class="pdf-label" style="width:18%">DIRECCIÓN:</span><span class="pdf-value" style="width:82%">${item.direccion || 'N/A'}</span></div>
                            <div class="pdf-line-item"><span class="pdf-label" style="width:18%">TRANSPORTE:</span><span class="pdf-value" style="width:82%">${item.ref_vehiculo || 'N/A'}</span></div>
                            <div class="pdf-line-item"><span class="pdf-label" style="width:18%">PARADERO:</span><span class="pdf-value" style="width:82%">${item.ref_paradero || 'N/A'}</span></div>
                            <div class="pdf-line-item"><span class="pdf-label" style="width:18%">ADICIONAL:</span><span class="pdf-value" style="width:82%">${item.ref_adicional || 'N/A'}</span></div>
                        </div>
                        
                        <div class="pdf-fotos-container">
                            <div class="pdf-foto-box">
                                <div class="pdf-foto-title">FOTO FACHADA</div>
                                <div class="pdf-foto-img">
                                    ${item.fachada ? `<img src="${item.fachada}" alt="Fachada" />` : `<div class="no-foto">SIN FOTO</div>`}
                                </div>
                            </div>
                            <div class="pdf-foto-box">
                                <div class="pdf-foto-title">FOTO SELFIE</div>
                                <div class="pdf-foto-img">
                                    ${item.selfie ? `<img src="${item.selfie}" alt="Selfie" />` : `<div class="no-foto">SIN FOTO</div>`}
                                </div>
                            </div>
                        </div>
                        
                        <div class="pdf-mapa-container">
                            <div class="pdf-foto-title">MAPA DE UBICACIÓN GPS</div>
                            <div class="pdf-mapa-box">
                                ${cleanLat && cleanLng 
                                    ? `<iframe src="https://maps.google.com/maps?q=${cleanLat},${cleanLng}&hl=es&z=17&output=embed" loading="eager"></iframe>` 
                                    : `<div class="no-foto" style="display:flex; height:100%; align-items:center; justify-content:center;">SIN COORDENADAS</div>`}
                            </div>
                        </div>
                    </div>
                    
                    <div class="pdf-footer">
                        Página ${index + 1} de ${datosIncompletos.length} - Documento Oficial GeoDile
                    </div>
                </div>
            `;
        }).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <title>Reporte_Ubicacion_${formData.DNI}</title>
                <meta charset="UTF-8">
                <style>
                    @page { size: A4 portrait; margin: 0; }
                    body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; background: #f3f4f6; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    * { box-sizing: border-box; }
                    .print-loader { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.95); z-index: 999999; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                    .spinner { border: 5px solid #e5e7eb; border-top: 5px solid #0c4a6e; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 20px; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    .print-loader h2 { color: #0c4a6e; font-size: 20px; margin: 0 0 10px 0; }
                    .print-loader p { color: #6b7280; font-size: 14px; margin: 0; }
                    @media print { .print-loader { display: none !important; } }
                    
                    .hoja-a4 { page-break-after: always; width: 210mm; height: 296mm; overflow: hidden; margin: 0 auto; position: relative; background: white; }
                    .hoja-a4:last-child { page-break-after: auto; }
                    
                    .pdf-header { background-color: #0c4a6e; color: white; padding: 10mm 70mm 10mm 15mm; display: flex; align-items: center; justify-content: center; position: relative; height: 32mm; }
                    .header-text { width: 100%; text-align: center; }
                    .header-text h2 { margin: 0; font-size: 15pt; font-weight: bold; }
                    .header-text h3 { margin: 2mm 0 0 0; font-size: 11pt; font-weight: normal; }
                    .pdf-logo { position: absolute; right: 15mm; top: 50%; transform: translateY(-50%); width: 45mm; height: 16mm; background: white; padding: 2mm; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); object-fit: contain; }

                    .pdf-info-consulta { background: #f3f4f6 !important; padding: 3mm 15mm; font-size: 8pt; color: #374151; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-weight: bold; }
                    
                    .pdf-body { padding: 6mm 15mm; }
                    .pdf-row { display: flex; justify-content: space-between; margin-bottom: 3mm; font-size: 9pt; }
                    .pdf-col { width: 48%; }
                    .pdf-line-item { display: flex; margin-bottom: 2mm; line-height: 1.4; }
                    .pdf-label { font-weight: bold; color: #374151; width: 35%; }
                    .pdf-value { width: 65%; color: #111827; }
                    .pdf-line { border-top: 1px solid #e5e7eb; margin: 4mm 0; }
                    .pdf-referencias .pdf-line-item { margin-bottom: 1.5mm; font-size: 9pt; }
                    .pdf-referencias .pdf-label { width: 20%; }
                    .pdf-referencias .pdf-value { width: 80%; }
                    
                    .pdf-fotos-container { display: flex; justify-content: space-between; margin-top: 5mm; height: 105mm; }
                    .pdf-foto-box { width: 48%; display: flex; flex-direction: column; }
                    .pdf-foto-title { font-weight: bold; color: #0c4a6e; font-size: 10pt; margin-bottom: 2mm; text-transform: uppercase; }
                    .pdf-foto-img { flex: 1; border: 1.5px dashed #bae6fd; border-radius: 6px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
                    .pdf-foto-img img { width: 100%; height: 100%; object-fit: contain; }
                    
                    .pdf-mapa-container { margin-top: 5mm; }
                    .pdf-mapa-box { height: 55mm; border: 1.5px dashed #bae6fd; border-radius: 6px; overflow: hidden; background: #f3f4f6; }
                    .pdf-mapa-box iframe { width: 100%; height: 100%; border: none; pointer-events: none; }
                    
                    .pdf-footer { position: absolute; bottom: 8mm; width: 100%; text-align: center; font-size: 8pt; color: #6b7280; }
                    .no-foto { color: #9ca3af; font-size: 10pt; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="print-loader" id="loader">
                    <div class="spinner"></div>
                    <h2>Preparando Mapas y Fotografías...</h2>
                    <p>Por favor espere, el PDF se abrirá automáticamente en unos segundos.</p>
                </div>
                ${htmlContent}
                <script>
                    window.onload = () => {
                        window.scrollTo(0, document.body.scrollHeight);
                        setTimeout(() => {
                            window.scrollTo(0, 0);
                            setTimeout(() => {
                                document.getElementById('loader').style.display = 'none';
                                window.print();
                            }, 500);
                        }, 1500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    if (!isOpen) return null;

    const vistaActiva = datosIncompletos[activeTab];
    const formBloqueado = puedeGenerarReporte;
    
    const cleanLatActiva = vistaActiva?.lat ? String(vistaActiva.lat).replace(/[^0-9.-]/g, '') : '';
    const cleanLngActiva = vistaActiva?.lng ? String(vistaActiva.lng).replace(/[^0-9.-]/g, '') : '';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-sm">
            <div className="relative bg-gray-100 rounded-xl shadow-2xl w-[98%] max-w-[1600px] h-[98vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header Fijo */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shadow-sm flex-shrink-0 bg-gradient-to-r from-[#0c4a6e] to-[#082f49] text-white">
                    <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-cyan-400" />
                        Generar Reporte de Ubicación GPS
                    </h3>
                    <button onClick={handleCloseModal} className="text-white hover:text-red-400 bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-all">
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                {/* Buscador Integrado */}
                <div className="bg-white px-4 sm:px-6 py-3 border-b border-gray-200 flex justify-between items-center flex-shrink-0 shadow-sm z-10">
                    <form onSubmit={(e) => fetchSocio(e)} className="w-full">
                        <div className="flex flex-col sm:flex-row gap-4 items-center max-w-5xl">
                            <div className="flex items-center gap-2">
                                <Search className="w-5 h-5 text-gray-400" />
                                <input
                                    type="number"
                                    id="DNI"
                                    name="DNI"
                                    value={formData.DNI}
                                    onChange={handleChange}
                                    className="w-40 sm:w-48 p-2 border-b-2 border-gray-300 focus:border-[#06b6d4] bg-transparent outline-none font-bold text-gray-800 transition-colors"
                                    placeholder="Buscar DNI..."
                                />
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                                <User className="w-5 h-5 text-gray-400" />
                                <input
                                    disabled
                                    value={formData.SOCIO}
                                    type="text"
                                    className="w-full p-2 bg-transparent text-gray-700 font-extrabold text-sm sm:text-base outline-none truncate"
                                    placeholder="Nombre del socio"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSearching}
                                className="bg-[#0c4a6e] hover:bg-[#082f49] text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all active:scale-95 disabled:opacity-70 whitespace-nowrap text-sm"
                            >
                                {isSearching ? 'Buscando...' : 'Buscar'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Contenedor Principal */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {formData.SOCIO && (
                        isSocio === "false" ? (
                            <div className="m-6 bg-yellow-50 p-6 rounded-xl border border-yellow-200 text-yellow-700 flex items-center gap-3">
                                <AlertTriangle className="w-8 h-8" />
                                <p className="font-medium text-lg">No existen visitas registradas en GeoDile para este DNI.</p>
                            </div>
                        ) : (
                            isSocio === "true" && mostrarVerificacion && Array.isArray(datosIncompletos) && datosIncompletos.length > 0 && (
                                <>
                                    {/* PESTAÑAS (TABS) */}
                                    <div className="flex px-4 sm:px-6 pt-3 bg-gray-100 border-b border-gray-300 gap-2 flex-shrink-0 overflow-x-auto custom-scrollbar">
                                        {datosIncompletos.map((item, index) => {
                                            const isActive = activeTab === index;
                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => setActiveTab(index)}
                                                    className={`px-6 sm:px-8 py-2 sm:py-2.5 font-bold text-xs sm:text-sm border-b-4 transition-all flex items-center gap-2 rounded-t-lg whitespace-nowrap ${
                                                        isActive 
                                                            ? 'border-[#06b6d4] text-[#0c4a6e] bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]' 
                                                            : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {item.tipo_ubicacion === 'DOMICILIO' ? '🏠' : '🏬'} {item.tipo_ubicacion}
                                                    {formBloqueado && <CheckCircle className="w-4 h-4 text-green-500 ml-1" />}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* CONTENIDO DE LA PESTAÑA ACTIVA */}
                                    <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-gray-50/50">
                                        {vistaActiva && (
                                            <div className="flex flex-col gap-4 sm:gap-5 h-full">
                                                
                                                {/* FILA SUPERIOR: FOTOS Y MAPA VERTICALES */}
                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                                                    
                                                    {/* 1. FACHADA */}
                                                    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                                        <div className="bg-gray-50 p-2 border-b border-gray-200 text-center px-4 flex-shrink-0">
                                                            <p className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wide">Fachada del Inmueble</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => vistaActiva.fachada && setImagenAmpliada(vistaActiva.fachada)} 
                                                            disabled={!vistaActiva.fachada}
                                                            className={`relative bg-gray-100 w-full h-[35vh] lg:h-[45vh] ${vistaActiva.fachada ? 'group cursor-zoom-in' : 'cursor-default'}`}
                                                        >
                                                            {vistaActiva.fachada ? (
                                                                <>
                                                                    <img src={vistaActiva.fachada} alt="Fachada" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                                                        <span className="opacity-0 group-hover:opacity-100 text-white font-bold drop-shadow-md flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm"><ZoomIn className="w-4 h-4"/> Ampliar</span>
                                                                    </div>
                                                                </>
                                                            ) : (<span className="flex items-center justify-center h-full text-xs text-gray-400 font-medium">Sin foto en BD</span>)}
                                                        </button>
                                                    </div>

                                                    {/* 2. SELFIE */}
                                                    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                                        <div className="bg-gray-50 p-2 border-b border-gray-200 text-center px-4 flex-shrink-0">
                                                            <p className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wide">Selfie Analista In Situ</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => vistaActiva.selfie && setImagenAmpliada(vistaActiva.selfie)} 
                                                            disabled={!vistaActiva.selfie}
                                                            className={`relative bg-gray-100 w-full h-[35vh] lg:h-[45vh] ${vistaActiva.selfie ? 'group cursor-zoom-in' : 'cursor-default'}`}
                                                        >
                                                            {vistaActiva.selfie ? (
                                                                <>
                                                                    <img src={vistaActiva.selfie} alt="Selfie" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                                                        <span className="opacity-0 group-hover:opacity-100 text-white font-bold drop-shadow-md flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm"><ZoomIn className="w-4 h-4"/> Ampliar</span>
                                                                    </div>
                                                                </>
                                                            ) : (<span className="flex items-center justify-center h-full text-xs text-gray-400 font-medium">Sin foto en BD</span>)}
                                                        </button>
                                                    </div>

                                                    {/* 3. MAPA */}
                                                    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                                        <div className="bg-gray-50 p-2 border-b border-gray-200 flex justify-between items-center px-4 flex-shrink-0">
                                                            <p className="text-[11px] font-extrabold text-[#0c4a6e] flex items-center gap-1.5 uppercase tracking-wide"><Map className="w-3.5 h-3.5"/> Ubicación GPS</p>
                                                            <a href={`https://www.google.com/maps?q=${cleanLatActiva},${cleanLngActiva}`} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline font-bold bg-blue-50 px-2 py-0.5 rounded">
                                                                Google Maps ↗
                                                            </a>
                                                        </div>
                                                        <div className="relative group bg-gray-200 w-full h-[35vh] lg:h-[45vh]">
                                                            {cleanLatActiva && cleanLngActiva ? (
                                                                <>
                                                                    <iframe src={`https://maps.google.com/maps?q=${cleanLatActiva},${cleanLngActiva}&hl=es&z=17&output=embed`} width="100%" height="100%" style={{ border: 0, position: 'absolute', top: 0, left: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                                                                    <button onClick={() => setMapaAmpliado({lat: cleanLatActiva, lng: cleanLngActiva, tipo: vistaActiva.tipo_ubicacion})} className="absolute top-2 right-2 bg-white/95 hover:bg-white text-[#0c4a6e] px-2.5 py-1.5 rounded shadow-md font-bold text-xs flex items-center gap-1.5 z-10 transition-transform hover:scale-105 border border-gray-200">
                                                                        <ZoomIn className="w-3.5 h-3.5" /> Ampliar
                                                                    </button>
                                                                </>
                                                            ) : (<span className="flex items-center justify-center h-full text-xs text-gray-400">Sin coordenadas</span>)}
                                                        </div>
                                                    </div>

                                                </div>

                                                {/* FILA INFERIOR: DATOS Y ACCIONES */}
                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                                                    
                                                    {/* DATOS REFERENCIALES */}
                                                    <div className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                                                        <h4 className="text-xs font-extrabold text-[#0c4a6e] uppercase tracking-wider mb-4 flex items-center gap-2 border-b pb-2"><Edit3 className="w-4 h-4"/> Completar Información Referencial</h4>
                                                        
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                            <div className="sm:col-span-2 lg:col-span-4">
                                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Dirección Exacta</label>
                                                                <input disabled={formBloqueado} type="text" value={datosCompletos[activeTab]?.direccion || ''} onChange={(e) => handleVerificacionChange(activeTab, 'direccion', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-cyan-500 bg-gray-50 disabled:bg-gray-100 disabled:text-gray-600 text-sm font-bold" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nº Suministro Luz</label>
                                                                <input disabled={formBloqueado} type="text" value={datosCompletos[activeTab]?.suministro || ''} onChange={(e) => handleVerificacionChange(activeTab, 'suministro', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-cyan-500 bg-gray-50 disabled:bg-gray-100 disabled:text-gray-600 text-sm font-bold" />
                                                                {mensajesSuministro[activeTab] && !formBloqueado && (
                                                                    <p className={`mt-1 text-[10px] ${mensajesSuministro[activeTab]?.color.split(' ')[0]}`}>{mensajesSuministro[activeTab]?.texto}</p>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Transporte</label>
                                                                <input disabled={formBloqueado} type="text" value={datosCompletos[activeTab]?.ref_vehiculo || ''} onChange={(e) => handleVerificacionChange(activeTab, 'ref_vehiculo', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-cyan-500 bg-gray-50 disabled:bg-gray-100 disabled:text-gray-600 text-sm font-bold" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Paradero</label>
                                                                <input disabled={formBloqueado} type="text" value={datosCompletos[activeTab]?.ref_paradero || ''} onChange={(e) => handleVerificacionChange(activeTab, 'ref_paradero', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-cyan-500 bg-gray-50 disabled:bg-gray-100 disabled:text-gray-600 text-sm font-bold" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ref. Adicional</label>
                                                                <input disabled={formBloqueado} type="text" value={datosCompletos[activeTab]?.ref_adicional || ''} onChange={(e) => handleVerificacionChange(activeTab, 'ref_adicional', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-cyan-500 bg-gray-50 disabled:bg-gray-100 disabled:text-gray-600 text-sm font-bold" />
                                                            </div>
                                                        </div>

                                                        {vistaActiva.tipo_ubicacion === 'DOMICILIO' && (
                                                            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                                                <label className="block text-[10px] font-extrabold text-[#0c4a6e] uppercase flex-shrink-0">¿El negocio está aquí?</label>
                                                                <div className="flex flex-wrap gap-4">
                                                                    <label className={`flex items-center text-xs font-bold ${formBloqueado ? 'opacity-70' : 'cursor-pointer'}`}>
                                                                        <input disabled={formBloqueado} type="radio" value="SI" checked={datosCompletos[activeTab]?.condicion_negocio === 'SI'} onChange={(e) => handleCondicionNegocioChange(activeTab, e.target.value)} className="mr-1.5 accent-cyan-600" /> Sí, opera aquí
                                                                    </label>
                                                                    <label className={`flex items-center text-xs font-bold ${formBloqueado ? 'opacity-70' : 'cursor-pointer'}`}>
                                                                        <input disabled={formBloqueado} type="radio" value="NEGOCIO EN OTRO LUGAR" checked={datosCompletos[activeTab]?.condicion_negocio === 'NEGOCIO EN OTRO LUGAR'} onChange={(e) => handleCondicionNegocioChange(activeTab, e.target.value)} className="mr-1.5 accent-cyan-600" /> No, otro lugar
                                                                    </label>
                                                                    <label className={`flex items-center text-xs font-bold ${formBloqueado ? 'opacity-70' : 'cursor-pointer'}`}>
                                                                        <input disabled={formBloqueado} type="radio" value="NO TIENE NEGOCIO" checked={datosCompletos[activeTab]?.condicion_negocio === 'NO TIENE NEGOCIO'} onChange={(e) => handleCondicionNegocioChange(activeTab, e.target.value)} className="mr-1.5 accent-cyan-600" /> No tiene negocio
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {vistaActiva.tipo_ubicacion === 'NEGOCIO' && datosCompletos[activeTab]?.condicion_negocio && (
                                                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                                                                <span className="text-[10px] font-extrabold text-[#0c4a6e] uppercase">Condición:</span>
                                                                <span className="bg-[#0c4a6e] text-white text-[10px] uppercase font-bold px-3 py-1 rounded shadow-sm">
                                                                    {datosCompletos[activeTab].condicion_negocio}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* CAJA DE ACCIÓN (Derecha) */}
                                                    <div className={`p-4 sm:p-5 rounded-xl border flex flex-col justify-center transition-colors shadow-sm h-full ${formBloqueado ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200 border-l-4 border-l-[#06b6d4]'}`}>
                                                        {formBloqueado ? (
                                                            <div className="text-center">
                                                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                                                <h4 className="font-extrabold text-green-800 text-lg">Registro Listo</h4>
                                                                <p className="text-xs text-green-600 mt-1">Ya puede generar su PDF</p>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col h-full justify-between">
                                                                <div>
                                                                    <label className="block text-xs font-extrabold text-[#0c4a6e] mb-2 uppercase tracking-wider text-center">Guardar Avance de {vistaActiva.tipo_ubicacion}</label>
                                                                    <p className="text-[10px] text-gray-500 text-center mb-4">Complete todos los datos referenciales de la izquierda para habilitar la creación del reporte PDF final.</p>
                                                                </div>
                                                                <button onClick={() => actualizarRegistroIndividual(activeTab)} disabled={loadingGuardar[activeTab]} className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-all text-sm bg-[#0c4a6e] text-white hover:bg-[#082f49] hover:scale-[1.02] active:scale-95">
                                                                    {loadingGuardar[activeTab] ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Procesando...</> : <><Save className="w-4 h-4" /> Guardar Datos</>}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )
                        )
                    )}
                </div>

                {/* Footer Fijo */}
                <div className="bg-white px-4 sm:px-6 py-3 border-t border-gray-300 flex justify-between items-center flex-shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#0c4a6e] p-2 rounded-full text-white shadow-md">
                            <User className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-[9px] uppercase tracking-widest font-bold">Analista de Crédito</p>
                            <p className="font-extrabold text-[#0c4a6e] uppercase text-xs sm:text-sm line-clamp-1">
                                {user?.razon || user?.email || 'Usuario de Sistema'} 
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handlePrint}
                            disabled={!puedeGenerarReporte}
                            className={`px-8 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-md transition-all text-sm ${
                                puedeGenerarReporte ? 'bg-[#06b6d4] hover:bg-[#0891b2] text-white hover:scale-105 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                            }`}
                        >
                            <Download className="w-5 h-5" /> Imprimir Reporte
                        </button>
                    </div>
                </div>

                {/* Lightboxes */}
                {imagenAmpliada && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4 sm:p-8 backdrop-blur-md cursor-zoom-out" onClick={() => setImagenAmpliada(null)}>
                        <button className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/50 hover:text-white transition-colors bg-black/50 rounded-full p-2">
                            <X className="w-8 h-8" />
                        </button>
                        <img src={imagenAmpliada} alt="Ampliada" className="max-w-full max-h-full object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] cursor-default" onClick={(e) => e.stopPropagation()} />
                    </div>
                )}

                {mapaAmpliado && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4 sm:p-8 backdrop-blur-sm">
                        <div className="bg-white w-full max-w-6xl h-full max-h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
                            <div className="bg-[#0c4a6e] text-white px-6 py-4 flex justify-between items-center shadow-md">
                                <h3 className="font-bold flex items-center gap-2 text-lg uppercase tracking-wide">
                                    <Map className="w-5 h-5 text-[#06b6d4]"/> Ampliación GPS: {mapaAmpliado.tipo}
                                </h3>
                                <button onClick={() => setMapaAmpliado(null)} className="text-white hover:text-red-400 bg-white/10 hover:bg-white/20 rounded-full p-1 transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex-1 w-full h-full bg-gray-200">
                                <iframe src={`https://maps.google.com/maps?q=${mapaAmpliado.lat},${mapaAmpliado.lng}&hl=es&z=19&output=embed`} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}