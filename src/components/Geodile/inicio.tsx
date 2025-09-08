import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { Button } from '@headlessui/react';
import ModalVerificarUbicacion from './verificacionUbicacion';
import ModalGenerarReportUbicacion from './generarreporteubicacion';
import ModalVerificarSuministro from './verificarsuministro';
import { cargarCoordenadas, type Coordenada } from '../../api/geodileApi';
import { createMarkerSvg } from './iconos';
import { AGENCIAS } from '../../types';

//librerias  OpenLayers imports  para mostrar el mapa
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Circle from 'ol/geom/Circle';
import { Style, Icon, Fill, Stroke } from 'ol/style';
import { fromLonLat} from 'ol/proj';
import Overlay from 'ol/Overlay';
// REMOVIDO: import { Geolocation } from 'ol'; // CAUSA INTERFERENCIA
import 'ol/ol.css';

// Coordenadas de todas las agencias
const COORDENADAS_AGENCIAS: Record<string, [number, number]> = {
    "OFICINA PRINCIPAL": [-71.969723, -13.522657],
    "AGENCIA SAN JERÓNIMO": [-71.8897073, -13.5452269],
    "AGENCIA QUILLABAMBA": [-72.6920038, -12.8644368],
    "AGENCIA SICUANI": [-71.2266959, -14.2715888],
    "AGENCIA SANTIAGO": [-71.9618889, -13.5359722],
    "AGENCIA LIMA": [-77.042793, -12.046374],
    "AGENCIA JULIACA": [-70.1355, -15.4964],
    "AGENCIA TICA TICA": [-71.996139, -13.506889],
} as const;

// CORRECCIÓN 1: Función mejorada para manejar permisos
const checkGeolocationPermission = async (): Promise<boolean> => {
    if (!navigator.geolocation) {
        return false;
    }

    try {
        if (navigator.permissions) {
            const permission = await navigator.permissions.query({name: 'geolocation'});
            if (permission.state === 'denied') {
                alert('Los permisos de ubicación están denegados. Por favor, habilítalos en la configuración de tu navegador.');
                return false;
            }
        }
        return true;
    } catch (error) {
        return true;
    }
};

// CORRECCIÓN 2: Función mejorada para watchPosition con mejor manejo
const startWatchingLocation = (
    onSuccess: (position: GeolocationPosition) => void,
    onError: (error: string) => void
): Promise<number> => {
    return new Promise((resolve, reject) => {
        // Verificar que tenemos geolocalización disponible
        if (!navigator.geolocation) {
            reject(new Error('Geolocalización no soportada'));
            return;
        }

        const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        const options: PositionOptions = {
            enableHighAccuracy: true,
            timeout: isMobile ? 30000 : 20000,
            maximumAge: 5000
        };

        let lastSuccessTime = Date.now();
        
        // Usar watchPosition solo después de verificaciones
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                lastSuccessTime = Date.now();
                onSuccess(position);
                resolve(watchId); // Resolver con el ID en el primer éxito
            },
            (error) => {
                if (Date.now() - lastSuccessTime > 30000) {
                    let message = 'Error desconocido';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            message = 'Permisos denegados';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message = 'GPS no disponible';
                            break;
                        case error.TIMEOUT:
                            message = 'Tiempo agotado - intenta nuevamente';
                            break;
                    }
                    onError(message);
                    reject(new Error(message));
                }
            },
            options
        );
    });
};

// Función para verificar si la ubicación ha expirado (máximo 5 minutos)
const isLocationExpired = (timestamp: number | null): boolean => {
    if (!timestamp) return true;
    const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutos en milisegundos
    return (Date.now() - timestamp) > FIVE_MINUTES;
};

// Función para obtener el tiempo restante de la ubicación
const getLocationTimeRemaining = (timestamp: number | null): string => {
    if (!timestamp) return '0:00';
    const FIVE_MINUTES = 5 * 60 * 1000;
    const elapsed = Date.now() - timestamp;
    const remaining = Math.max(0, FIVE_MINUTES - elapsed);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function Inicio() {
    const { user } = useContext(AuthContext);
    const userData = user;
    
    const [layoutHidden, setLayoutHidden] = useState(false);
    const [position, setPosition] = useState<{lat: number, lng: number} | null>(null);
    const [positionTimestamp, setPositionTimestamp] = useState<number | null>(null); // Timestamp de cuando se obtuvo la ubicación
    const [locate, setLocate] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalReportOpen, setIsModalReportOpen] = useState(false);
    const [mostrarModalVerificar, setMostrarModalVerificar] = useState(false);
    const [formData] = useState({DNI: ''});

    // OpenLayers refs
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<Map | null>(null);
    const vectorSourceRef = useRef<VectorSource>(new VectorSource());
    // REMOVIDO: const geolocationRef = useRef<Geolocation | null>(null); // CAUSA INTERFERENCIA
    const activePopupRef = useRef<Overlay | null>(null);
    const watchIdRef = useRef<number | null>(null);

    // Estado para forzar re-render del contador cada segundo
    const [, forceUpdate] = useState(0);

    // Effect para actualizar el contador cada segundo
    useEffect(() => {
        if (positionTimestamp && !locate) {
            const interval = setInterval(() => {
                forceUpdate(prev => prev + 1); // Forzar re-render para actualizar el contador
                
                // Si la ubicación ha expirado, limpiarla automáticamente
                if (isLocationExpired(positionTimestamp)) {
                    setPosition(null);
                    setPositionTimestamp(null);
                    clearInterval(interval);
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [positionTimestamp, locate]);

    // Suprimir warnings de Canvas2D
    const suppressCanvas2DWarnings = () => {
        const originalWarn = console.warn;
        console.warn = (...args: any[]) => {
            const message = args[0];
            if (typeof message === 'string' && 
                (message.includes('willReadFrequently') || 
                 message.includes('getImageData') || 
                 message.includes('Canvas2D'))) {
                return;
            }
            originalWarn.apply(console, args);
        };
        return originalWarn;
    };

    // Función optimizada para crear popup
    const createPopupAtCoordinate = (coords: number[], content: string) => {
        if (activePopupRef.current && mapInstanceRef.current) {
            mapInstanceRef.current.removeOverlay(activePopupRef.current);
            activePopupRef.current = null;
        }

        if (!mapInstanceRef.current) return;

        const popupElement = document.createElement('div');
        popupElement.innerHTML = content;
        
        popupElement.style.cssText = `
            position: absolute;
            background: white;
            padding: 10px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border: 1px solid #e5e7eb;
            font-size: 14px;
            max-width: 200px;
            z-index: 1000;
            pointer-events: auto;
        `;
        
        const popup = new Overlay({
            element: popupElement,
            positioning: 'bottom-center',
            stopEvent: false,
            offset: [0, -10],
            autoPan: {
                animation: {
                    duration: 250,
                },
            },
        });
        
        mapInstanceRef.current.addOverlay(popup);
        popup.setPosition(coords);
        activePopupRef.current = popup;

        setTimeout(() => {
            if (activePopupRef.current === popup && mapInstanceRef.current) {
                mapInstanceRef.current.removeOverlay(popup);
                activePopupRef.current = null;
            }
        }, 3000);
    };

    // Escuchar cambios en el estado del layout
    useEffect(() => {
        const handleLayoutToggle = (event: CustomEvent) => {
            setLayoutHidden(event.detail.hidden);
        };
        
        window.addEventListener('geodileLayoutToggle', handleLayoutToggle as EventListener);
        
        return () => {
            window.removeEventListener('geodileLayoutToggle', handleLayoutToggle as EventListener);
        };
    }, []);

    // Inicializar el mapa
    useEffect(() => {
        if (!mapRef.current) return;

        const originalWarn = suppressCanvas2DWarnings();

        mapInstanceRef.current = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({
                    source: new OSM(),
                }),
                new VectorLayer({
                    source: vectorSourceRef.current,
                }),
            ],
            view: new View({
                center: fromLonLat(COORDENADAS_AGENCIAS["OFICINA PRINCIPAL"]),
                zoom: 10,
            }),
            pixelRatio: 1,
        });

        setTimeout(() => {
            const canvases = mapRef.current?.querySelectorAll('canvas');
            canvases?.forEach((canvas: HTMLCanvasElement) => {
                try {
                    canvas.setAttribute('data-will-read-frequently', 'true');
                    canvas.getContext('2d', { willReadFrequently: true });
                } catch (e) {
                    // Silencioso
                }
            });
        }, 500);

        mapInstanceRef.current.on('click', (event) => {
            const clickCoord = event.coordinate;
            const view = mapInstanceRef.current!.getView();
            const resolution = view.getResolution() ?? 1;
            const tolerance = resolution * 15;
            
            if (activePopupRef.current) {
                mapInstanceRef.current!.removeOverlay(activePopupRef.current);
                activePopupRef.current = null;
            }
            
            const features = vectorSourceRef.current.getFeatures();
            let clickedFeature = null;
            let minDistance = Infinity;
            
            for (const feature of features) {
                const geometry = feature.getGeometry();
                if (geometry instanceof Point) {
                    const featureCoord = geometry.getCoordinates();
                    const distance = Math.sqrt(
                        Math.pow(clickCoord[0] - featureCoord[0], 2) +
                        Math.pow(clickCoord[1] - featureCoord[1], 2)
                    );
                    
                    if (distance < tolerance && distance < minDistance) {
                        clickedFeature = feature;
                        minDistance = distance;
                    }
                }
            }
            
            if (clickedFeature && clickedFeature.get('clickHandler')) {
                clickedFeature.get('clickHandler')();
            }
        });

        // REMOVIDO: Configuración de geolocation de OpenLayers que causaba interferencia

        addAllAgenciesMarkers();

        return () => {
            console.warn = originalWarn;
            
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            
            if (activePopupRef.current && mapInstanceRef.current) {
                mapInstanceRef.current.removeOverlay(activePopupRef.current);
                activePopupRef.current = null;
            }
            
            if (mapInstanceRef.current) {
                mapInstanceRef.current.setTarget(undefined);
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Función para actualizar marcador de usuario
    const updateUserLocationMarker = (coordinates: number[], accuracy?: number) => {
        const features = vectorSourceRef.current.getFeatures();
        const userFeatures = features.filter(f => f.get('type') === 'user' || f.get('type') === 'accuracy');
        userFeatures.forEach(f => vectorSourceRef.current.removeFeature(f));

        if (accuracy && accuracy > 0) {
            // ✅ AJUSTAR RADIO DEL CÍRCULO: máximo 500 metros como Google Maps
            const maxRadius = 500; // 500 metros máximo
            const minRadius = 50;   // 50 metros mínimo
            
            // Calcular radio ajustado: usar accuracy pero limitado entre 50m y 500m
            const adjustedRadius = Math.max(minRadius, Math.min(accuracy, maxRadius));
            
            const circleGeometry = new Circle(coordinates, adjustedRadius);
            const accuracyFeature = new Feature({
                geometry: circleGeometry,
                type: 'accuracy',
            });
            accuracyFeature.setStyle(new Style({
                stroke: new Stroke({
                    color: 'rgba(0, 123, 255, 0.6)',
                    width: 2,
                }),
                fill: new Fill({
                    color: 'rgba(0, 123, 255, 0.15)',
                }),
            }));
            vectorSourceRef.current.addFeature(accuracyFeature);
        }

        const userFeature = new Feature({
            geometry: new Point(coordinates),
            type: 'user',
        });

        userFeature.setStyle(new Style({
            image: new Icon({
                src: createMarkerSvg('usuarios'),
                scale: 1,
                anchor: [0.5, 1],
            }),
        }));

        const isDesktopBrowser = !/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        const deviceType = isDesktopBrowser ? '(PC/Desarrollo)' : '(Dispositivo móvil)';
        const accuracyText = accuracy && accuracy > 0 ?
            (accuracy > 1000 ? `${(accuracy/1000).toFixed(1)} km` : `${accuracy.toFixed(1)} m`) :
            'Desconocida';
        
        userFeature.set('clickHandler', () => {
            const popupContent = `
                <div>
                    <strong style="color: #10b981;">Tu estás aquí ${deviceType}</strong><br>
                    <span style="color: #6b7280; font-size: 12px;">Precisión: ${accuracyText}</span>
                    ${isDesktopBrowser && accuracy && accuracy > 10000 ?
                        '<br><span style="color: #f59e0b; font-size: 11px;">Precisión baja es normal en PC</span>' : ''}
                </div>
            `;
            createPopupAtCoordinate(coordinates, popupContent);
        });

        vectorSourceRef.current.addFeature(userFeature);
    };

    // Función para obtener el nombre de la agencia del usuario actual
    const obtenerNombreAgenciaUsuario = (): string => {
        if (!userData?.id_age) return 'OFICINA PRINCIPAL';
        
        const agenciasEntries = Object.entries(AGENCIAS);
        const agenciaEncontrada = agenciasEntries.find(([_, id]) => id === userData.id_age);
        
        return agenciaEncontrada ? agenciaEncontrada[0] : 'OFICINA PRINCIPAL';
    };

    // Agregar marcadores de todas las agencias
    const addAllAgenciesMarkers = () => {
        const nombreAgenciaUsuario = obtenerNombreAgenciaUsuario();
        
        Object.entries(COORDENADAS_AGENCIAS).forEach(([nombreAgencia, coordenadas]) => {
            const agencyCoords = fromLonLat(coordenadas);
            
            const agencyFeature = new Feature({
                geometry: new Point(agencyCoords),
                type: 'agency',
                name: nombreAgencia,
                isUserAgency: nombreAgencia === nombreAgenciaUsuario
            });

            const isUserAgency = nombreAgencia === nombreAgenciaUsuario;
            const scale = isUserAgency ? 1.3 : 0.8;

            agencyFeature.setStyle(new Style({
                image: new Icon({
                    src: createMarkerSvg('agencia'),
                    scale: scale,
                    anchor: [0.5, 1],
                }),
            }));

            agencyFeature.set('clickHandler', () => {
                const esAgenciaUsuario = isUserAgency;
                const colorStyle = esAgenciaUsuario ? '#10b981' : '#3b82f6';
                const textoAdicional = esAgenciaUsuario ? '<br><span style="color: #059669; font-size: 12px;">📍 Tu agencia</span>' : '';
                
                const popupContent = `
                    <div>
                        <strong style="color: ${colorStyle};">${nombreAgencia}</strong>
                        ${textoAdicional}
                    </div>
                `;
                createPopupAtCoordinate(agencyCoords, popupContent);
            });

            vectorSourceRef.current.addFeature(agencyFeature);
        });
    };

    // Cargar coordenadas del mapa
    const cargarCoordenadasMapa = async () => {
        try {
            if (userData) {
                const coordenadas = await cargarCoordenadas(userData);
                
                const features = vectorSourceRef.current.getFeatures();
                const coordinateFeatures = features.filter(f => f.get('type') === 'coordinate');
                coordinateFeatures.forEach(f => vectorSourceRef.current.removeFeature(f));

                coordenadas.forEach((coordenada: Coordenada) => {
                    const coords = fromLonLat([coordenada.lng, coordenada.lat]);
                    
                    const feature = new Feature({
                        geometry: new Point(coords),
                        type: 'coordinate',
                        coordenada: coordenada,
                    });

                    const iconType = coordenada.tipo_ubicacion === 'DOMICILIO' ? 'domicilio' : 'negocio';
                    
                    feature.setStyle(new Style({
                        image: new Icon({
                            src: createMarkerSvg(iconType),
                            scale: 1,
                            anchor: [0.5, 1],
                        }),
                    }));

                    const tipoTexto = coordenada.tipo_ubicacion === 'DOMICILIO' ? 'Domicilio' : 'Negocio';
                    const nombreSocio = coordenada.nom_socio || 'Sin nombre';
                    const color = coordenada.tipo_ubicacion === 'DOMICILIO' ? '#dc2626' : '#ea580c';
                    
                    feature.set('clickHandler', () => {
                        const popupContent = `
                            <div>
                                <strong style="color: ${color};">${tipoTexto}:</strong><br>
                                <span style="color: #374151;">${nombreSocio}</span>
                            </div>
                        `;
                        createPopupAtCoordinate(coords, popupContent);
                    });

                    vectorSourceRef.current.addFeature(feature);
                });
            }
        } catch (error: any) {
            // Error silencioso
        }
    };

    // Cargar coordenadas cuando cambia el DNI
    useEffect(() => {
        cargarCoordenadasMapa();
    }, [userData?.dni]);

    // CORRECCIÓN 4: Manejar localización con watchPosition optimizado
    useEffect(() => {
        if (locate) {
            // Limpiar watch anterior si existe
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }

            // Iniciar watch con Promise
            startWatchingLocation(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    const coordinates = fromLonLat([longitude, latitude]);
                    const currentTimestamp = Date.now(); // Guardar el timestamp actual
                    
                    setPosition({ lng: longitude, lat: latitude });
                    setPositionTimestamp(currentTimestamp); // Guardar cuando se obtuvo la ubicación
                    
                    // Guardar el timestamp en sessionStorage para que el modal pueda accederlo
                    sessionStorage.setItem('gps_timestamp', currentTimestamp.toString());
                    
                    updateUserLocationMarker(coordinates, accuracy);
                    mapInstanceRef.current!.getView().setCenter(coordinates);
                },
                (errorMessage) => {
                    // Mostrar solo mensaje al usuario, sin console.error
                    alert(`Error de ubicación: ${errorMessage}`);
                    setLocate(false);
                    setPositionTimestamp(null); // Limpiar timestamp en caso de error
                }
            ).then((watchId) => {
                watchIdRef.current = watchId;
            }).catch(() => {
                // Mostrar solo mensaje amigable, sin console.error
                alert('Error al iniciar seguimiento de ubicación. Intenta nuevamente.');
                setLocate(false);
            });

            // Auto-detener después de 2 minutos
            const timeout = setTimeout(() => {
                if (watchIdRef.current) {
                    navigator.geolocation.clearWatch(watchIdRef.current);
                    watchIdRef.current = null;
                }
                setLocate(false);
            }, 120000);

            return () => {
                if (watchIdRef.current) {
                    navigator.geolocation.clearWatch(watchIdRef.current);
                    watchIdRef.current = null;
                }
                clearTimeout(timeout);
            };
        }
    }, [locate]);

    // Handlers simplificados
    const handleCloseModal = () => setIsModalOpen(false);
    const handleVerificarSuministro = () => {
        setMostrarModalVerificar(true);
    };
    const handleCloseModalVerificar = () => setMostrarModalVerificar(false);
    const handleSubmitSearch = () => {};
    const handleCreateReporteUbicación = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setIsModalReportOpen(true);
    };
    const handleCloseReportModal = () => setIsModalReportOpen(false);

    // CORRECCIÓN 5: Handler mejorado para verificar vivienda con validación de ubicación y expiración
    const handleVerificarVivienda = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        
        // VALIDACIÓN 1: Verificar que se tenga ubicación primero
        if (!position || !position.lat || !position.lng) {
            alert("⚠️ UBICACIÓN REQUERIDA\n\nPrimero debes activar el botón de ubicación (🎯) y esperar a que se obtenga tu posición GPS antes de poder verificar un socio.\n\n📍 Haz clic en el botón de ubicación y espera hasta que aparezca tu marcador en el mapa.");
            return;
        }

        // VALIDACIÓN 2: Verificar que la ubicación no haya expirado (máximo 5 minutos)
        if (isLocationExpired(positionTimestamp)) {
            alert("⏰ UBICACIÓN EXPIRADA\n\nTu ubicación GPS ha expirado (máximo 5 minutos). Para mantener la precisión de las verificaciones, debes obtener una nueva ubicación.\n\n🔄 Haz clic nuevamente en el botón de ubicación (🎯) para actualizar tu posición.");
            
            // Limpiar la ubicación expirada
            setPosition(null);
            setPositionTimestamp(null);
            
            // Limpiar también del sessionStorage
            sessionStorage.removeItem('gps_timestamp');
            return;
        }

        // VALIDACIÓN 3: Verificar que la ubicación sea reciente y válida
        if (position.lat === 0 && position.lng === 0) {
            alert("❌ UBICACIÓN INVÁLIDA\n\nTu ubicación actual no es válida. Activa el GPS y vuelve a obtener tu ubicación.");
            return;
        }
        
        const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        
        if (!isMobile) {
            alert("Esta función está disponible solo en dispositivos móviles.");
            return;
        }

        // Si ya tenemos ubicación válida y reciente, abrir directamente el modal
        setIsModalOpen(true);
    };

    // CORRECCIÓN 6: Handler mejorado para localizar usuario
    const handleLocateUser = async () => {
        // Si ya está localizando, detener
        if (locate) {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            setLocate(false);
            return;
        }

        try {
            // Verificar permisos
            const hasPermission = await checkGeolocationPermission();
            if (!hasPermission) {
                return;
            }

            setLocate(true);

        } catch (error: any) {
            // Solo mostrar mensaje amigable al usuario
            alert('Error al iniciar localización. Verifica permisos de ubicación.');
            setLocate(false);
        }
    };

    return (
        <div className={`w-full h-full relative overflow-hidden ${layoutHidden ? 'fixed inset-0 z-[55]' : ''}`}
             style={layoutHidden ? { height: '100dvh' } : {}}>
            
            {/* Barra de búsqueda */}
            <div className="z-50 group fixed top-4 left-4 p-2 flex items-start justify-start w-24 h-24">
                <div className="mx-auto max-w-md rounded-full bg-primary-50">
                    <form action="" className="relative mx-auto w-max">
                        <input
                            value={formData.DNI}
                            onChange={() => {}}
                            onBlur={handleSubmitSearch}
                            type="search"
                            className="text-primary-800 peer cursor-pointer relative z-10 h-12 w-12 rounded-full border-2 bg-primary-50 border-primary-800 bg-transparent pl-12 outline-none focus:w-full focus:cursor-text focus:border-primary-800 focus:pl-16 focus:pr-4"
                            readOnly
                        />
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="absolute inset-y-0 my-auto h-8 w-12 border-r border-transparent stroke-primary-800 px-3.5 peer-focus:border-primary-800 peer-focus:stroke-primary-800" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor" 
                            strokeWidth="2"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </form>
                </div>
            </div>

            {/* Contenedor del mapa */}
            <div
                ref={mapRef}
                style={{
                    height: layoutHidden ? '100dvh' : '100%',
                    width: '100%',
                    zIndex: 0
                }}
                suppressHydrationWarning={true}
            />

            {/* Botones flotantes con animaciones mejoradas */}
            <div className="z-50 group fixed top-32 left-1 p-2 flex items-start justify-start w-24 h-24">
                <Button className="text-white shadow-xl flex items-center justify-center p-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-300 hover:to-blue-500 z-50 absolute transition-all duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </Button>

                {/* Sub botones mejorados */}
                <Button 
                    onClick={handleVerificarVivienda}
                    className="absolute rounded-full transition-all duration-300 ease-out scale-0 group-hover:scale-100 group-hover:translate-y-16 flex p-2 hover:p-3 bg-green-600 hover:bg-green-800 text-white shadow-lg"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" stroke="currentColor" fill='currentColor'>
                        <path fillRule="evenodd" d="M22.5 15.5h3v-2h-3v2zM39 37.985l-7.5-2.251V18.367l7.5 2.25v17.368zM29.55 14.1L28 12.938V18.5h-8v-5.562L18.45 14.1l-.9-1.2L24 8.064l2.5 1.875V9H28v2.063l2.45 1.838-.9 1.199zM30 35.569L18.5 37.78V20.506C20.847 24.829 24 29 24 29s3.63-4.803 6-9.444v16.013zm-13 2.3l-8-1.598V18.016l8 2.4V37.87zm14.728-22.566c.171-.656.272-1.267.272-1.808C32 8.57 29.054 6 23.973 6 18.892 6 16 8.57 16 13.495c0 1.05.367 2.362.94 3.77L6 13.986V38.73l11.494 2.299 12.928-2.486L42 42.016V18.384l-10.272-3.081z"/>
                    </svg>
                </Button>
                <Button  
                    onClick={handleVerificarSuministro}
                    className="absolute rounded-full transition-all duration-300 ease-out scale-0 group-hover:scale-100 group-hover:translate-x-16 flex p-2 hover:p-3 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"  fill="none" stroke="currentColor"  strokeWidth="2"  strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"
                    >
                        <rect x="4" y="3" width="16" height="18" rx="2" ry="2" className="stroke-current"/>
                        <line x1="8" y1="7" x2="16" y2="7" />
                        <line x1="8" y1="11" x2="16" y2="11" />
                        <path d="M9 15l2 2l4-4" stroke="limegreen" strokeWidth="2.5"/>
                    </svg>
                </Button>

                <Button 
                    onClick={handleCreateReporteUbicación}
                    className="absolute rounded-full transition-all duration-300 ease-out scale-0 group-hover:scale-100 group-hover:translate-x-12 group-hover:translate-y-12 flex p-2 hover:p-3 bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M9 2.22117V7H4.22117C4.31517 6.81709 4.43766 6.64812 4.58579 6.5L8.5 2.58579C8.64812 2.43766 8.81709 2.31517 9 2.22117ZM11 2V7C11 8.10457 10.1046 9 9 9H4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V4C20 2.89543 19.1046 2 18 2H11ZM11.3944 11.5528C11.2195 11.2029 10.8566 10.9871 10.4656 11.0006C10.0746 11.0141 9.72739 11.2543 9.57693 11.6154L7.07693 17.6154C6.94833 17.924 6.98249 18.2765 7.16795 18.5547C7.35342 18.8329 7.66565 19 8 19H16C16.3466 19 16.6684 18.8205 16.8507 18.5257C17.0329 18.2309 17.0494 17.8628 16.8944 17.5528L14.8944 13.5528C14.7394 13.2428 14.435 13.0352 14.0898 13.004C13.7446 12.9729 13.408 13.1227 13.2 13.4L12.6708 14.1056L11.3944 11.5528ZM13 9.5C13 8.67157 13.6716 8 14.5 8C15.3284 8 16 8.67157 16 9.5C16 10.3284 15.3284 11 14.5 11C13.6716 11 13 10.3284 13 9.5Z"/>
                    </svg>
                </Button>
            </div>

            {/* Botón de localizar ubicación optimizado */}
            <button
                onClick={handleLocateUser}
                className={`z-50 fixed bottom-4 right-4 p-3 rounded-full shadow-xl transition-all duration-300 ${
                    locate 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white animate-pulse' 
                        : 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-800 border-2 border-primary-800'
                }`}
                title={locate ? 'Detener ubicación' : 'Obtener mi ubicación'}
            >
                <svg
                    version="1.1"
                    className={`w-6 h-6 transition-transform duration-500 ${locate ? 'rotate-180' : 'hover:rotate-90'}`}
                    viewBox="0 0 561 561"
                    stroke="currentColor"
                    fill="currentColor"
                >
                    <path d="M280.5,178.5c-56.1,0-102,45.9-102,102c0,56.1,45.9,102,102,102c56.1,0,102-45.9,102-102C382.5,224.4,336.6,178.5,280.5,178.5z M507.45,255C494.7,147.9,410.55,63.75,306,53.55V0h-51v53.55C147.9,63.75,63.75,147.9,53.55,255H0v51h53.55C66.3,413.1,150.45,497.25,255,507.45V561h51v-53.55C413.1,494.7,497.25,410.55,507.45,306H561v-51H507.45z M280.5,459C181.05,459,102,379.95,102,280.5S181.05,102,280.5,102S459,181.05,459,280.5S379.95,459,280.5,459z"/>
                </svg>
            </button>
            
            {/* Indicador de estado de ubicación */}
            {locate && (
                <div className="z-50 fixed bottom-20 right-4 bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200 text-sm text-gray-600 animate-fadeIn">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Obteniendo ubicación...</span>
                    </div>
                </div>
            )}
            
            {/* Indicador de tiempo restante de ubicación */}
            {position && positionTimestamp && !locate && (
                <div className="z-50 fixed bottom-20 right-4 bg-green-50 px-3 py-2 rounded-lg shadow-lg border border-green-200 text-sm animate-fadeIn">
                    <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${isLocationExpired(positionTimestamp) ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <span className={isLocationExpired(positionTimestamp) ? 'text-red-600' : 'text-green-600'}>
                            {isLocationExpired(positionTimestamp) ? '⏰ Ubicación expirada' : `📍 Ubicación válida: ${getLocationTimeRemaining(positionTimestamp)}`}
                        </span>
                    </div>
                </div>
            )}
            
            {/* Modales */}
            <ModalVerificarUbicacion
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                coord={position || { lat: 0, lng: 0 }}
            />
            <ModalGenerarReportUbicacion
                isOpen={isModalReportOpen}
                onClose={handleCloseReportModal}
            />
            <ModalVerificarSuministro
                isOpen={mostrarModalVerificar}
                onClose={handleCloseModalVerificar}
            />
        </div>
    );
}