// src/components/auditoria_geodile/AuditoriaModal.tsx

import React, { useState, useEffect } from 'react';
import { User, CheckCircle, AlertTriangle, Map, X, ZoomIn, Save, Info } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth'; 
import { procesarAuditoriaGeodile } from '../../api/auditoriaGeodileApi';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';

interface AuditoriaModalProps {
  socio: any;
  onClose: () => void;
  onRefresh: () => void;
}

interface EvaluacionUbicacion {
  estado: 'Validado' | 'Observado' | '';
  observacion: string;
}

export default function AuditoriaModal({ socio, onClose, onRefresh }: AuditoriaModalProps) {
  const { user } = useAuth(); 
  const [geoData, setGeoData] = useState<any[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<Record<string, EvaluacionUbicacion>>({});
  
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loadingGuardar, setLoadingGuardar] = useState<Record<string, boolean>>({});
  const [ubicacionesGuardadas, setUbicacionesGuardadas] = useState<Record<string, boolean>>({});

  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);
  const [mapaAmpliado, setMapaAmpliado] = useState<{lat: string, lng: string, tipo: string} | null>(null);

  useEffect(() => {
    if (socio?.visitas && Array.isArray(socio.visitas)) {
      setGeoData(socio.visitas);
      const evalInicial: Record<string, EvaluacionUbicacion> = {};
      socio.visitas.forEach((visita: any) => {
        evalInicial[visita.tipo_ubicacion] = { estado: '', observacion: '' };
      });
      setEvaluaciones(evalInicial);
    }
  }, [socio]);

  const handleEstadoChange = (tipoUbicacion: string, nuevoEstado: 'Validado' | 'Observado' | '') => {
    setEvaluaciones(prev => ({
      ...prev,
      [tipoUbicacion]: {
        ...prev[tipoUbicacion],
        estado: nuevoEstado,
        observacion: nuevoEstado === 'Validado' ? '' : prev[tipoUbicacion].observacion 
      }
    }));
  };

  const handleObservacionChange = (tipoUbicacion: string, texto: string) => {
    setEvaluaciones(prev => ({
      ...prev,
      [tipoUbicacion]: {
        ...prev[tipoUbicacion],
        observacion: texto
      }
    }));
  };

  // ⬇️ CONSTRUCCIÓN DEL PAYLOAD SEGÚN EL NUEVO JSON
  const handleGuardarUbicacion = async (visita: any) => {
    const tipo_ubicacion = visita.tipo_ubicacion;
    const evaluacion = evaluaciones[tipo_ubicacion];
    
    if (!evaluacion?.estado) {
      toast.error(`Seleccione una resolución para el ${tipo_ubicacion}`);
      return;
    }
    if (evaluacion.estado === 'Observado' && !evaluacion.observacion.trim()) {
      toast.error(`Ingrese el detalle de la observación obligatoria`);
      return;
    }

    setLoadingGuardar(prev => ({ ...prev, [tipo_ubicacion]: true }));
    
    try {
      await procesarAuditoriaGeodile({
        id: visita.id, // ID único provisto por la nueva API de mongo
        user: user?.user || user?.dni || '',
        nombre_verificador: user?.razon || '',
        estado: evaluacion.estado, // 'Validado' u 'Observado'
        observacion: evaluacion.observacion // Texto de justificación
      });
      
      toast.success(`Evaluación de ${tipo_ubicacion} guardada con éxito`);
      setUbicacionesGuardadas(prev => ({ ...prev, [tipo_ubicacion]: true }));
      onRefresh(); 
      
      // Auto-avanzar a la siguiente pestaña si existe
      const nextTab = activeTab + 1;
      if (nextTab < geoData.length && !ubicacionesGuardadas[geoData[nextTab].tipo_ubicacion]) {
        setTimeout(() => setActiveTab(nextTab), 500);
      }
    } catch (error) {
      toast.error(`Error al procesar la auditoría de ${tipo_ubicacion}`);
    } finally {
      setLoadingGuardar(prev => ({ ...prev, [tipo_ubicacion]: false }));
    }
  };

  const visitaActiva = geoData[activeTab];
  const isGuardadoActivo = visitaActiva ? ubicacionesGuardadas[visitaActiva.tipo_ubicacion] : false;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-sm">
      <div className="bg-gray-100 rounded-xl shadow-2xl w-[98%] max-w-[1600px] h-[98vh] flex flex-col overflow-hidden">
        
        {/* Header Fijo */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shadow-sm flex-shrink-0 bg-gradient-to-r from-[#0c4a6e] to-[#082f49] text-white">
          <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-cyan-400" />
            Auditoría de Desembolso GeoDile
          </h3>
          <button onClick={onClose} className="text-white hover:text-red-400 bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-all">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Resumen del Cliente */}
        <div className="bg-white px-4 sm:px-6 py-3 border-b border-gray-200 flex justify-between items-center flex-shrink-0 shadow-sm z-10">
          <div>
            <h4 className="font-extrabold text-base sm:text-lg text-gray-900 leading-tight line-clamp-1">{socio?.nombres}</h4>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">DNI: {socio?.dni} <span className="mx-2 text-gray-300">|</span> {socio?.agencia}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
             <span className="bg-cyan-50 text-[#0c4a6e] px-4 py-1.5 rounded-full border border-cyan-100 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm">
                <Info className="w-4 h-4"/> Evaluando Evidencias
             </span>
          </div>
        </div>
        
        {/* Contenedor Principal */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {geoData.length === 0 ? (
            <div className="m-6 bg-yellow-50 p-6 rounded-xl border border-yellow-200 text-yellow-700 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8" />
              <p className="font-medium text-lg">No existen visitas registradas en GeoDile para este DNI.</p>
            </div>
          ) : (
            <>
              {/* PESTAÑAS (TABS) */}
              <div className="flex px-4 sm:px-6 pt-3 bg-gray-100 border-b border-gray-300 gap-2 flex-shrink-0 overflow-x-auto custom-scrollbar">
                {geoData.map((visita, index) => {
                  const guardado = ubicacionesGuardadas[visita.tipo_ubicacion];
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
                      {visita.tipo_ubicacion === 'DOMICILIO' ? '🏠' : '🏬'} {visita.tipo_ubicacion}
                      {guardado && <CheckCircle className="w-4 h-4 text-green-500 ml-1" />}
                    </button>
                  );
                })}
              </div>

              {/* CONTENIDO DE LA PESTAÑA ACTIVA */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-gray-50/50">
                {visitaActiva && (
                  <div className="flex flex-col gap-4 sm:gap-5 h-full">
                    
                    {/* FILA SUPERIOR: FOTOS Y MAPA */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                      
                      {/* 1. FACHADA */}
                      <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                        <div className="bg-gray-50 p-2 border-b border-gray-200 text-center px-4 flex-shrink-0">
                           <p className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wide">Fachada del Inmueble</p>
                        </div>
                        <button onClick={() => setImagenAmpliada(visitaActiva.fachada)} className="relative bg-gray-100 group w-full h-56 sm:h-64 lg:h-[35vh]">
                          <img src={visitaActiva.fachada} alt="Fachada" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 text-white font-bold drop-shadow-md flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm"><ZoomIn className="w-4 h-4"/> Ampliar</span>
                          </div>
                        </button>
                      </div>

                      {/* 2. SELFIE */}
                      <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                        <div className="bg-gray-50 p-2 border-b border-gray-200 text-center px-4 flex-shrink-0">
                           <p className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wide">Selfie Analista In Situ</p>
                        </div>
                        <button onClick={() => setImagenAmpliada(visitaActiva.selfie)} className="relative bg-gray-100 group w-full h-56 sm:h-64 lg:h-[35vh]">
                          <img src={visitaActiva.selfie} alt="Selfie" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 text-white font-bold drop-shadow-md flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm"><ZoomIn className="w-4 h-4"/> Ampliar</span>
                          </div>
                        </button>
                      </div>

                      {/* 3. MAPA */}
                      <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                        <div className="bg-gray-50 p-2 border-b border-gray-200 flex justify-between items-center px-4 flex-shrink-0">
                          <p className="text-[11px] font-extrabold text-[#0c4a6e] flex items-center gap-1.5 uppercase tracking-wide"><Map className="w-3.5 h-3.5"/> Ubicación GPS</p>
                          <a href={`https://www.google.com/maps?q=${visitaActiva.lat},${visitaActiva.lng}`} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline font-bold bg-blue-50 px-2 py-0.5 rounded">
                            Google Maps ↗
                          </a>
                        </div>
                        <div className="relative group bg-gray-200 w-full h-56 sm:h-64 lg:h-[35vh]">
                          <iframe src={`https://maps.google.com/maps?q=${visitaActiva.lat},${visitaActiva.lng}&hl=es&z=17&output=embed`} width="100%" height="100%" style={{ border: 0, position: 'absolute', top: 0, left: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                          <button onClick={() => setMapaAmpliado({lat: visitaActiva.lat, lng: visitaActiva.lng, tipo: visitaActiva.tipo_ubicacion})} className="absolute top-2 right-2 bg-white/95 hover:bg-white text-[#0c4a6e] px-2.5 py-1.5 rounded shadow-md font-bold text-xs flex items-center gap-1.5 z-10 transition-transform hover:scale-105 border border-gray-200">
                            <ZoomIn className="w-3.5 h-3.5" /> Ampliar
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* FILA INFERIOR: DATOS Y VALIDACIÓN */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                      
                      {/* DATOS DEL PREDIO */}
                      <div className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                           <div>
                              <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest mb-1">Dirección Registrada</p>
                              <p className="text-sm sm:text-base font-bold text-gray-900 leading-snug">{visitaActiva.direccion}</p>
                           </div>
                           <span className="bg-[#0c4a6e] text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded shadow-sm whitespace-nowrap flex-shrink-0">
                              {visitaActiva.condicion_negocio}
                           </span>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100 bg-gray-50/50 p-3 rounded-lg">
                          <div>
                             <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Suministro</p>
                             <p className="text-xs sm:text-sm font-bold text-gray-800 break-all">{visitaActiva.suministro || '-'}</p>
                          </div>
                          <div>
                             <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Línea de Transporte</p>
                             <p className="text-xs sm:text-sm font-bold text-gray-800">{visitaActiva.ref_vehiculo || '-'}</p>
                          </div>
                          <div>
                             <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Paradero</p>
                             <p className="text-xs sm:text-sm font-bold text-gray-800">{visitaActiva.ref_paradero || '-'}</p>
                          </div>
                          <div>
                             <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Ref. Adicional</p>
                             <p className="text-xs sm:text-sm font-bold text-gray-800 line-clamp-2" title={visitaActiva.ref_adicional}>{visitaActiva.ref_adicional || '-'}</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-3 text-right font-mono font-bold tracking-wide">CAPTURA: {visitaActiva.fecha_cap} {visitaActiva.hora_cap}</p>
                      </div>

                      {/* CAJA DE VALIDACIÓN */}
                      <div className={`p-4 sm:p-5 rounded-xl border flex flex-col justify-between transition-colors shadow-sm h-full ${isGuardadoActivo ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200 border-l-4 border-l-[#06b6d4]'}`}>
                        <div>
                          <label className="block text-xs font-extrabold text-[#0c4a6e] mb-2.5 uppercase tracking-wider">
                            Resolución de {visitaActiva.tipo_ubicacion}
                          </label>
                          <select
                            disabled={isGuardadoActivo || loadingGuardar[visitaActiva.tipo_ubicacion]}
                            className={`w-full p-2.5 sm:p-3 border rounded-lg text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#06b6d4] shadow-inner transition-colors cursor-pointer ${
                              evaluaciones[visitaActiva.tipo_ubicacion]?.estado === 'Validado' ? 'bg-green-100 border-green-400 text-green-900' : 
                              evaluaciones[visitaActiva.tipo_ubicacion]?.estado === 'Observado' ? 'bg-red-50 border-red-400 text-red-900' : 
                              'bg-gray-50 border-gray-300 text-gray-700'
                            } disabled:opacity-70 disabled:cursor-not-allowed`}
                            value={evaluaciones[visitaActiva.tipo_ubicacion]?.estado || ''}
                            onChange={(e) => handleEstadoChange(visitaActiva.tipo_ubicacion, e.target.value as any)}
                          >
                            <option value="" disabled>-- Seleccione resolución --</option>
                            <option value="Validado">✅ Validado</option>
                            <option value="Observado">❌ Observado</option>
                          </select>

                          {evaluaciones[visitaActiva.tipo_ubicacion]?.estado === 'Observado' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 mt-3">
                              <textarea
                                disabled={isGuardadoActivo || loadingGuardar[visitaActiva.tipo_ubicacion]}
                                className="w-full p-2.5 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 text-xs shadow-inner bg-red-50/50 disabled:opacity-70 disabled:cursor-not-allowed"
                                rows={2}
                                placeholder="Motivo de la observación..."
                                value={evaluaciones[visitaActiva.tipo_ubicacion]?.observacion || ''}
                                onChange={(e) => handleObservacionChange(visitaActiva.tipo_ubicacion, e.target.value)}
                              />
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100/50">
                          <button
                            onClick={() => handleGuardarUbicacion(visitaActiva)}
                            disabled={isGuardadoActivo || loadingGuardar[visitaActiva.tipo_ubicacion]}
                            className={`w-full py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-all text-xs sm:text-sm ${
                              isGuardadoActivo 
                                ? 'bg-green-600 text-white cursor-not-allowed border border-green-700 opacity-90 shadow-none'
                                : 'bg-[#0c4a6e] text-white hover:bg-[#082f49] hover:scale-[1.02] active:scale-95'
                            }`}
                          >
                            {loadingGuardar[visitaActiva.tipo_ubicacion] ? (
                              <><div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div> Guardando...</>
                            ) : isGuardadoActivo ? (
                              <><CheckCircle className="w-4 h-4" /> Ubicación Evaluada</>
                            ) : (
                              <><Save className="w-4 h-4" /> Guardar {visitaActiva.tipo_ubicacion}</>
                            )}
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Fijo */}
        <div className="bg-white px-4 sm:px-6 py-3 border-t border-gray-300 flex justify-between items-center flex-shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-10">
          <div className="flex items-center gap-3">
            <div className="bg-[#0c4a6e] p-2 rounded-full text-white shadow-md">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-gray-500 text-[9px] uppercase tracking-widest font-bold">Auditor</p>
              <p className="font-extrabold text-[#0c4a6e] uppercase text-xs sm:text-sm line-clamp-1">
                {user?.razon || user?.email || 'Usuario de Sistema'} 
                {user?.role && <span className="text-gray-400 font-medium ml-1">({user.role})</span>}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="px-6 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200 hover:text-gray-900 font-bold transition-all text-xs sm:text-sm shadow-sm active:scale-95">
            Cerrar Ventana
          </button>
        </div>

        {/* Lightboxes */}
        {imagenAmpliada && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8 backdrop-blur-md cursor-zoom-out" onClick={() => setImagenAmpliada(null)}>
            <button className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/50 hover:text-white transition-colors bg-black/50 rounded-full p-2">
              <X className="w-8 h-8" />
            </button>
            <img src={imagenAmpliada} alt="Ampliada" className="max-w-full max-h-full object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] cursor-default" onClick={(e) => e.stopPropagation()} />
          </div>
        )}

        {mapaAmpliado && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 sm:p-8 backdrop-blur-sm">
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

  return createPortal(modalContent, document.body);
}