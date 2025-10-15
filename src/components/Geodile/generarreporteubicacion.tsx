import React, { useState, useContext} from "react";
import { AuthContext } from "../../contexts/AuthContext";
import {
    generarPdfGps,
    abrirReporte,
    prepareInfoReport,
    updateReportData,
    type ReporteInfoData,
    verificarSuministro
} from "../../api/geodileApi";
import { useNotifications } from "../../hooks/useNotifications";
import { debounce } from "lodash";

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
    const [datosIncompletos, setDatosIncompletos] = useState<ReporteInfoData[]>([]);
    const [mostrarVerificacion, setMostrarVerificacion] = useState(false);
    const [datosCompletos, setDatosCompletos] = useState<{ [key: number]: ReporteInfoData }>({});
    const [puedeGenerarReporte, setPuedeGenerarReporte] = useState(false);
    const [mensajesSuministro, setMensajesSuministro] = useState<Record<number, { texto: string; color: string } | null>>({});

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
                        texto: `⚠️ Este suministro ya existe. Pertenece a: ${data.socio || 'N/A'} (${data.agencia || 'N/A'})`,
                        color: 'text-yellow-700 bg-yellow-100'
                    }
                }));
            } else {
                setMensajesSuministro(prev => ({
                    ...prev,
                    [index]: {
                        texto: '✅ Suministro nuevo (no registrado previamente)',
                        color: 'text-green-700 bg-green-100'
                    }
                }));
            }
        } catch (error) {
            setMensajesSuministro(prev => ({
                ...prev,
                [index]: {
                    texto: '❌ Error al verificar el suministro',
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

    const handleGenerarReporte = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!userData?.dni) {
            Notification.warning('Usuario no encontrado');
            return;
        }

        if (!puedeGenerarReporte) {
            Notification.warning('⚠️ No se puede generar el reporte. Complete todos los campos requeridos.');
            return;
        }

        try {
            const data = await generarPdfGps(userData.dni, formData.DNI);
            abrirReporte(data.url);
        } catch (error: any) {
            Notification.error(`Error al generar el reporte: ${error.message}`);
        }
    };

    const fetchSocio = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!userData?.dni) {
            Notification.warning('Usuario no encontrado');
            return;
        }

        try {
            const reporteInfo = await prepareInfoReport(formData.DNI);
            if (reporteInfo.status === true) {
                setIsSocio('true');
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    SOCIO: reporteInfo.socio || ''
                }));

                setPuedeGenerarReporte(reporteInfo.GENERAR || false);
                setDatosIncompletos(reporteInfo.data || []);

                const datosCompletos: { [key: number]: ReporteInfoData } = {};
                const domicilioIndex = reporteInfo.data.findIndex(d => d.tipo_ubicacion === 'DOMICILIO');
                const negocioIndex = reporteInfo.data.findIndex(d => d.tipo_ubicacion === 'NEGOCIO');
                
                reporteInfo.data.forEach((item, index) => {
                    datosCompletos[index] = { ...item };
                });

                // HERENCIA AUTOMÁTICA del domicilio al negocio
                if (domicilioIndex !== -1 && negocioIndex !== -1) {
                    const domicilio = reporteInfo.data[domicilioIndex];
                    const negocio = reporteInfo.data[negocioIndex];
                    
                    // Si el domicilio tiene condicion_negocio y el negocio NO lo tiene
                    if (domicilio.condicion_negocio && domicilio.condicion_negocio.trim() !== '' && 
                        (!negocio.condicion_negocio || negocio.condicion_negocio.trim() === '')) {
                        
                        // Si es "Sí", copiar TODO
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
                            // Si es otro valor, solo copiar condicion_negocio
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

            const datosParaEnviar = { [index]: registro };
            const result = await updateReportData(datosParaEnviar, userData.dni, formData.SOCIO, formData.DNI);

            if (result.status) {
                const reporteInfo = await prepareInfoReport(formData.DNI);
                if (reporteInfo.status === true) {
                    setPuedeGenerarReporte(reporteInfo.GENERAR || false);
                    setDatosIncompletos(reporteInfo.data || []);

                    const nuevosDatosCompletos: { [key: number]: ReporteInfoData } = {};
                    const domicilioIndex = reporteInfo.data.findIndex(d => d.tipo_ubicacion === 'DOMICILIO');
                    const negocioIndex = reporteInfo.data.findIndex(d => d.tipo_ubicacion === 'NEGOCIO');
                    
                    reporteInfo.data.forEach((item, idx) => {
                        const datosExistentes = datosCompletos[idx];
                        nuevosDatosCompletos[idx] = {
                            ...item,
                            suministro: item.suministro || datosExistentes?.suministro || '',
                            direccion: item.direccion || datosExistentes?.direccion || '',
                            ref_vehiculo: item.ref_vehiculo || datosExistentes?.ref_vehiculo || '',
                            ref_paradero: item.ref_paradero || datosExistentes?.ref_paradero || '',
                            ref_adicional: item.ref_adicional || datosExistentes?.ref_adicional || '',
                            condicion_negocio: item.condicion_negocio || datosExistentes?.condicion_negocio || ''
                        };
                    });

                    // HERENCIA AUTOMÁTICA DESPUÉS DE ACTUALIZAR
                    if (domicilioIndex !== -1 && negocioIndex !== -1) {
                        const domicilio = nuevosDatosCompletos[domicilioIndex];
                        const negocio = nuevosDatosCompletos[negocioIndex];
                        
                        // Si el domicilio tiene condicion_negocio y el negocio NO lo tiene
                        if (domicilio.condicion_negocio && domicilio.condicion_negocio.trim() !== '' && 
                            (!negocio.condicion_negocio || negocio.condicion_negocio.trim() === '')) {
                            
                            // Si es "Sí", copiar TODO
                            if (domicilio.condicion_negocio === 'SI') {
                                nuevosDatosCompletos[negocioIndex] = {
                                    ...nuevosDatosCompletos[negocioIndex],
                                    suministro: domicilio.suministro || nuevosDatosCompletos[negocioIndex].suministro,
                                    direccion: domicilio.direccion || nuevosDatosCompletos[negocioIndex].direccion,
                                    ref_vehiculo: domicilio.ref_vehiculo || nuevosDatosCompletos[negocioIndex].ref_vehiculo,
                                    ref_paradero: domicilio.ref_paradero || nuevosDatosCompletos[negocioIndex].ref_paradero,
                                    ref_adicional: domicilio.ref_adicional || nuevosDatosCompletos[negocioIndex].ref_adicional,
                                    condicion_negocio: 'Heredado del domicilio'
                                };
                            } else {
                                // Si es otro valor, solo copiar condicion_negocio
                                nuevosDatosCompletos[negocioIndex] = {
                                    ...nuevosDatosCompletos[negocioIndex],
                                    condicion_negocio: domicilio.condicion_negocio
                                };
                            }
                        }
                    }
                    
                    setDatosCompletos(nuevosDatosCompletos);

                    if (reporteInfo.GENERAR) {
                        Notification.success('🎉 Registro actualizado. ¡Ya puede generar el reporte!');
                        setMostrarVerificacion(false);
                    } else {
                        Notification.warning('✅ Registro actualizado. Complete los campos restantes.');
                    }
                }
            } else {
                Notification.error(`❌ Error al actualizar: ${result.message}`);
            }
        } catch (error: any) {
            Notification.error(`❌ Error: ${error.message}`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="relative z-[10000] bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
                <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
                    <h2 className="text-lg font-semibold uppercase">Generar Reporte de Ubicación</h2>
                    <button onClick={onClose} className="text-white hover:text-gray-200">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12zm7.707-3.707a1 1 0 00-1.414 0 1 1 0 000 1.414L10.586 12l-2.293 2.293a1 1 0 001.414 1.414L12 13.414l2.293 2.293a1 1 0 001.414-1.414L13.414 12l2.293-2.293a1 1 0 00-1.414-1.414L12 10.586 9.707 8.293z" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 md:p-6">
                    <form onSubmit={handleGenerarReporte}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div>
                                <label htmlFor="DNI" className="block mb-2 text-sm font-medium text-blue-800">DNI</label>
                                <div className="flex">
                                    <input
                                        type="number"
                                        id="DNI"
                                        name="DNI"
                                        value={formData.DNI}
                                        onChange={handleChange}
                                        className="flex-1 bg-blue-50 border border-blue-300 text-blue-900 text-sm rounded-l-lg focus:ring-2 focus:ring-blue-500 p-3"
                                        placeholder="Ingrese DNI"
                                    />
                                    <button
                                        type="button"
                                        onClick={(e: any) => fetchSocio(e)}
                                        className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-r-lg"
                                    >
                                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="SOCIO" className="block mb-2 text-sm font-medium text-blue-800">SOCIO</label>
                                <input
                                    disabled
                                    value={formData.SOCIO}
                                    onChange={handleChange}
                                    type="text"
                                    id="SOCIO"
                                    name="SOCIO"
                                    className="bg-blue-50 border border-blue-300 text-blue-900 text-sm rounded-lg w-full p-3"
                                    placeholder="Información del socio aparecerá aquí"
                                />
                            </div>
                        </div>

                        {formData.SOCIO && (
                            isSocio === "false" ? (
                                <div className="text-center py-8">
                                    <div className="bg-red-100 border border-red-300 rounded-lg p-6">
                                        <h3 className="text-red-800 font-bold text-lg">No se encontró información</h3>
                                        <p className="text-red-600 mt-2">El DNI ingresado no corresponde a ningún socio registrado</p>
                                    </div>
                                </div>
                            ) : (
                                isSocio === "true" && mostrarVerificacion && Array.isArray(datosIncompletos) && datosIncompletos.length > 0 && (
                                    <div className="mb-6">
                                        <div className="text-center mb-6">
                                            <h3 className="text-blue-800 font-bold text-xl mb-2">Reportes Disponibles</h3>
                                            <div className="w-24 h-1 bg-blue-600 mx-auto rounded" />
                                            <p className="text-sm text-blue-600 mt-2">Complete los campos vacíos y presione "Actualizar" en cada registro</p>
                                            <div className="mt-2 text-xs text-gray-600">
                                                📊 Total de registros: {datosIncompletos.length} |
                                                🎯 Puede generar reporte: {puedeGenerarReporte ? '✅ Sí' : '❌ No'}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {datosIncompletos.map((item, index) => {
                                                const tieneVacios = [
                                                    !item.suministro || item.suministro.trim() === '',
                                                    !item.direccion || item.direccion.trim() === '',
                                                    !item.ref_vehiculo || item.ref_vehiculo.trim() === '',
                                                    !item.ref_paradero || item.ref_paradero.trim() === '',
                                                    !item.ref_adicional || item.ref_adicional.trim() === '',
                                                    !item.condicion_negocio || item.condicion_negocio.trim() === ''
                                                ].some(campo => campo);

                                                return (
                                                    <div key={`reporte-${index}-${item.fecha_cap}-${item.hora_cap}`} className={`border-2 rounded-xl p-4 hover:shadow-md ${tieneVacios ? 'bg-yellow-50 border-yellow-300' : 'bg-green-50 border-green-300'}`}>
                                                        <div className={`text-white px-3 py-1 rounded-md text-sm font-bold mb-3 inline-block ${tieneVacios ? 'bg-yellow-600' : 'bg-green-600'}`}>
                                                            {item.tipo_ubicacion} - {tieneVacios ? 'INCOMPLETO' : 'COMPLETO'}
                                                        </div>

                                                        <div className="space-y-3 text-sm">
                                                            <div>
                                                                <label className="font-bold text-gray-700 block mb-1">Suministro:</label>
                                                                {!item.suministro || item.suministro.trim() === '' ? (
                                                                    <>
                                                                        <input
                                                                            type="text"
                                                                            value={datosCompletos[index]?.suministro || ''}
                                                                            onChange={(e) => handleVerificacionChange(index, 'suministro', e.target.value)}
                                                                            className="w-full p-2 border border-yellow-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                                                                            placeholder="Ingrese suministro"
                                                                        />
                                                                        {mensajesSuministro[index] && (
                                                                            <div className={`mt-1 p-2 rounded text-xs ${mensajesSuministro[index]?.color}`}>
                                                                                {mensajesSuministro[index]?.texto}
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">{item.suministro}</span>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <label className="font-bold text-gray-700 block mb-1">Dirección:</label>
                                                                {!item.direccion || item.direccion.trim() === '' ? (
                                                                    <input
                                                                        type="text"
                                                                        value={datosCompletos[index]?.direccion || ''}
                                                                        onChange={(e) => handleVerificacionChange(index, 'direccion', e.target.value)}
                                                                        className="w-full p-2 border border-yellow-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                                                                        placeholder="Ingrese dirección"
                                                                    />
                                                                ) : (
                                                                    <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">{item.direccion}</span>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <label className="font-bold text-gray-700 block mb-1">Ref. transporte:</label>
                                                                {!item.ref_vehiculo || item.ref_vehiculo.trim() === '' ? (
                                                                    <input
                                                                        type="text"
                                                                        value={datosCompletos[index]?.ref_vehiculo || ''}
                                                                        onChange={(e) => handleVerificacionChange(index, 'ref_vehiculo', e.target.value)}
                                                                        className="w-full p-2 border border-yellow-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                                                                        placeholder="¿Qué transporte urbano?"
                                                                    />
                                                                ) : (
                                                                    <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">{item.ref_vehiculo}</span>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <label className="font-bold text-gray-700 block mb-1">Ref. Paradero:</label>
                                                                {!item.ref_paradero || item.ref_paradero.trim() === '' ? (
                                                                    <input
                                                                        type="text"
                                                                        value={datosCompletos[index]?.ref_paradero || ''}
                                                                        onChange={(e) => handleVerificacionChange(index, 'ref_paradero', e.target.value)}
                                                                        className="w-full p-2 border border-yellow-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                                                                        placeholder="Referencia de paradero"
                                                                    />
                                                                ) : (
                                                                    <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">{item.ref_paradero}</span>
                                                                )}
                                                            </div>

                                                            <div>
                                                                <label className="font-bold text-gray-700 block mb-1">Ref. Adicional:</label>
                                                                {!item.ref_adicional || item.ref_adicional.trim() === '' ? (
                                                                    <input
                                                                        type="text"
                                                                        value={datosCompletos[index]?.ref_adicional || ''}
                                                                        onChange={(e) => handleVerificacionChange(index, 'ref_adicional', e.target.value)}
                                                                        className="w-full p-2 border border-yellow-400 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                                                                        placeholder="Referencia adicional"
                                                                    />
                                                                ) : (
                                                                    <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">{item.ref_adicional}</span>
                                                                )}
                                                            </div>

                                                            {item.tipo_ubicacion === 'DOMICILIO' && (
                                                                <div>
                                                                    <label className="font-bold text-gray-700 block mb-1">¿EL NEGOCIO ESTÁ EN ESTA MISMA DIRECCIÓN?</label>
                                                                    {!item.condicion_negocio || item.condicion_negocio.trim() === '' ? (
                                                                        <div className="space-y-2">
                                                                            <div className="flex flex-col space-y-2">
                                                                                <label className="flex items-center">
                                                                                    <input
                                                                                        type="radio"
                                                                                        name={`condicion_negocio_${index}`}
                                                                                        value="SI"
                                                                                        checked={datosCompletos[index]?.condicion_negocio === 'SI'}
                                                                                        onChange={(e) => handleCondicionNegocioChange(index, e.target.value)}
                                                                                        className="mr-2"
                                                                                    />
                                                                                    <span className="text-sm">Sí</span>
                                                                                </label>
                                                                                <label className="flex items-center">
                                                                                    <input
                                                                                        type="radio"
                                                                                        name={`condicion_negocio_${index}`}
                                                                                        value="NEGOCIO EN OTRO LUGAR"
                                                                                        checked={datosCompletos[index]?.condicion_negocio === 'NEGOCIO EN OTRO LUGAR'}
                                                                                        onChange={(e) => handleCondicionNegocioChange(index, e.target.value)}
                                                                                        className="mr-2"
                                                                                    />
                                                                                    <span className="text-sm">No, en otro lugar</span>
                                                                                </label>
                                                                                <label className="flex items-center">
                                                                                    <input
                                                                                        type="radio"
                                                                                        name={`condicion_negocio_${index}`}
                                                                                        value="NO TIENE NEGOCIO"
                                                                                        checked={datosCompletos[index]?.condicion_negocio === 'NO TIENE NEGOCIO'}
                                                                                        onChange={(e) => handleCondicionNegocioChange(index, e.target.value)}
                                                                                        className="mr-2"
                                                                                    />
                                                                                    <span className="text-sm">No tiene negocio</span>
                                                                                </label>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded">{item.condicion_negocio}</span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {item.tipo_ubicacion === 'NEGOCIO' && datosCompletos[index]?.condicion_negocio && (
                                                                <div>
                                                                    <label className="font-bold text-gray-700 block mb-1">Condición:</label>
                                                                    <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-sm">
                                                                        {datosCompletos[index].condicion_negocio}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <div className="pt-2 border-t border-gray-200">
                                                                <div className="flex justify-between text-xs text-gray-500">
                                                                    <span><strong>Coords:</strong> {item.lat}, {item.lng}</span>
                                                                    <span><strong>Fecha:</strong> {item.fecha_cap} {item.hora_cap}</span>
                                                                </div>
                                                            </div>

                                                            {tieneVacios && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => actualizarRegistroIndividual(index)}
                                                                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm"
                                                                >
                                                                    🔄 Actualizar este Registro
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )
                            )
                        )}

                        <div className="border-t-2 border-blue-200 pt-4 mt-6 flex flex-col sm:flex-row justify-end gap-3">
                            <button
                                type="submit"
                                disabled={!puedeGenerarReporte}
                                className={`font-medium px-6 py-3 rounded-lg border-2 order-2 sm:order-1 ${
                                    puedeGenerarReporte
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 cursor-pointer'
                                        : 'bg-gray-400 text-gray-700 border-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {puedeGenerarReporte ? '✅ Generar Reporte' : '⚠️ Complete los datos primero'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-3 rounded-lg border-2 border-red-500 order-1 sm:order-2"
                            >
                                Cerrar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}