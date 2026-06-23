import React, { useState, useEffect, useRef } from "react";

interface InputImageCameraProps {
    id: string;
    title: string;
    handleImageChangeIn: (id: string, file: File) => void;
}

export default function InputImageCamera({ id, title, handleImageChangeIn }: InputImageCameraProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Limpiar URLs de objetos cuando el componente se desmonte o cambien
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const compressImage = async (file: File, maxWidth = 800, maxHeight = 600, quality = 0.7): Promise<File> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const tempUrl = URL.createObjectURL(file);
            
            img.onload = () => {
                // Limpiar URL temporal inmediatamente
                URL.revokeObjectURL(tempUrl);
                
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d', { 
                        alpha: false,
                        willReadFrequently: false 
                    });
                    
                    if (!ctx) {
                        reject(new Error('No se pudo obtener el contexto del canvas'));
                        return;
                    }

                    // Calcular nuevas dimensiones manteniendo la proporción
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth || height > maxHeight) {
                        const aspectRatio = width / height;
                        
                        if (width > height) {
                            width = maxWidth;
                            height = width / aspectRatio;
                        } else {
                            height = maxHeight;
                            width = height * aspectRatio;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Fondo blanco para mejor compresión
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);
                    
                    // Dibujar imagen redimensionada con suavizado
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convertir a Blob con compresión WebP (mejor que JPEG)
                    canvas.toBlob(
                        (blob) => {
                            // Limpiar canvas inmediatamente para liberar memoria
                            canvas.width = 0;
                            canvas.height = 0;
                            
                            if (!blob) {
                                reject(new Error('Error al comprimir la imagen'));
                                return;
                            }
                            
                            // Validar tamaño final (máximo 400KB para dispositivos de gama baja)
                            if (blob.size > 400 * 1024) {
                                // Si es muy grande, rechazar y pedir menor calidad
                                reject(new Error('IMAGEN_MUY_GRANDE'));
                                return;
                            }
                            
                            // Crear nuevo archivo con el blob comprimido en WebP
                            const compressedFile = new File(
                                [blob], 
                                file.name.replace(/\.[^/.]+$/, '.webp'),
                                { type: 'image/webp' }
                            );
                            
                            resolve(compressedFile);
                        },
                        'image/webp',  // ✅ Cambio de JPEG a WebP
                        quality
                    );
                } catch (err) {
                    reject(err);
                }
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(tempUrl);
                reject(new Error('Error al cargar la imagen'));
            };
            
            img.src = tempUrl;
        });
    };

    const handleCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        
        if (!file) return;
        
        // Validar que sea una imagen
        if (!file.type.startsWith('image/')) {
            setError('Por favor selecciona un archivo de imagen válido');
            return;
        }
        
        // Validar tamaño inicial (rechazar si es mayor a 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('La imagen es demasiado grande (máx. 10MB). Por favor, usa una imagen más pequeña.');
            return;
        }
        
        setLoading(true);
        setError(null);
        
        // Limpiar preview anterior
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        
        try {
            let compressedFile: File;
            
            // Intentar comprimir con calidad estándar (WebP permite mayor calidad con menor tamaño)
            try {
                compressedFile = await compressImage(file, 800, 600, 0.75);
            } catch (err: any) {
                // Si la imagen es muy grande, reintentar con menor calidad
                if (err.message === 'IMAGEN_MUY_GRANDE') {
                    console.log('Imagen muy grande, reintentando con menor calidad...');
                    try {
                        compressedFile = await compressImage(file, 640, 480, 0.65);
                    } catch (err2: any) {
                        if (err2.message === 'IMAGEN_MUY_GRANDE') {
                            // Último intento con calidad muy baja
                            compressedFile = await compressImage(file, 480, 360, 0.55);
                        } else {
                            throw err2;
                        }
                    }
                } else {
                    throw err;
                }
            }
            
            // Crear URL para preview (sin usar base64)
            const newPreviewUrl = URL.createObjectURL(compressedFile);
            setPreviewUrl(newPreviewUrl);
            
            // Enviar archivo comprimido al padre
            handleImageChangeIn(id, compressedFile);
            
        } catch (err: any) {
            console.error('Error al procesar imagen:', err);
            
            if (err.message === 'IMAGEN_MUY_GRANDE') {
                setError('La imagen es muy pesada incluso después de comprimirla. Intenta con una foto de menor resolución.');
            } else {
                setError('Error al procesar la imagen. Por favor, intenta de nuevo con una foto más pequeña.');
            }
        } finally {
            setLoading(false);
            // Limpiar el input para permitir seleccionar la misma imagen
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRetry = () => {
        // Limpiar preview anterior y liberar memoria
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setError(null);
        
        // Forzar garbage collection limpiando referencias
        handleImageChangeIn(id, null as any);
        
        // Pequeño delay para asegurar que la memoria se libere
        setTimeout(() => {
            // Activar el input de archivo
            fileInputRef.current?.click();
        }, 100);
    };

    return (
        <div className="mt-2">
            {!previewUrl ? (
                <>
                    <label className="block mb-0 text-sm font-medium text-primary-800">
                        {title}
                    </label>
                    <div className="w-full py-4 bg-primary-50 rounded-2xl border border-primary-800 gap-3 grid border-dashed">
                        <div className="grid gap-2">
                            <div className="flex items-center justify-center">
                                <label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        capture="environment"
                                        hidden
                                        onChange={handleCapture}
                                        disabled={loading}
                                    />
                                    <div
                                        className={`flex w-24 h-10 px-2 flex-col rounded-xl shadow text-white text-xs font-semibold leading-4 items-center justify-center cursor-pointer focus:outline-none transition-colors ${
                                            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-100 hover:bg-primary-200'
                                        }`}
                                    >
                                        {loading ? (
                                            <span className="text-primary-800">Procesando...</span>
                                        ) : (
                                            <svg
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    fill="#02518c"
                                                    fillRule="evenodd"
                                                    clipRule="evenodd"
                                                    d="M7.5 4.58579C7.87507 4.21071 8.38378 4 8.91421 4H15.0858C15.6162 4 16.1249 4.21071 16.5 4.58579L17.9142 6H19C20.1046 6 21 6.89543 21 8V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V8C3 6.89543 3.89543 6 5 6H6.08579L7.5 4.58579ZM10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12ZM12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8Z"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                    {error && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs text-red-600">{error}</p>
                        </div>
                    )}
                </>
            ) : (
                <div className="w-full">
                    <label className="block mb-2 text-sm font-medium text-primary-900">
                        {title}
                    </label>
                    <div className="w-full flex flex-col items-center gap-3">
                        <div className="w-full max-w-[300px] overflow-hidden">
                            <img
                                src={previewUrl}
                                alt="Vista previa"
                                className="w-full h-auto rounded-lg shadow-md object-contain"
                            />
                        </div>
                        <button
                            onClick={handleRetry}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                            type="button"
                        >
                            Cambiar foto
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/*
import React, { useState } from "react";

interface InputImageCameraProps {
    id: string;
    title: string;
    handleImageChangeIn: (id: string, file: File) => void;
}

export default function InputImageCamera({ id, title, handleImageChangeIn }: InputImageCameraProps) {
    const [image, setImage] = useState<string | null>(null);

    const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setImage(imageUrl);
            handleImageChangeIn(id, file);
        }
    };

    return (
        <div className="mt-2">
            {image?'':<>
            <label className="block mb-0 text-sm font-medium text-primary-800">{title}</label>
            <div className="w-full py-4 bg-primary-50 rounded-2xl border border-primary-800 gap-3 grid border-dashed">
                <div className="grid gap-2">
                    <div className="flex items-center justify-center">
                        <label>
                            <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment" 
                                hidden
                                onChange={handleCapture} 
                            />
                            <div className={`flex w-24 h-10 px-2 flex-col rounded-xl shadow text-white text-xs font-semibold leading-4 items-center justify-center cursor-pointer focus:outline-none ${image ? 'bg-green-500' : 'bg-primary-100'}`}>
                                {image ? 'Listo' : (
                                    <div>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fill="#02518c" fillRule="evenodd" clipRule="evenodd" d="M7.5 4.58579C7.87507 4.21071 8.38378 4 8.91421 4H15.0858C15.6162 4 16.1249 4.21071 16.5 4.58579L17.9142 6H19C20.1046 6 21 6.89543 21 8V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V8C3 6.89543 3.89543 6 5 6H6.08579L7.5 4.58579ZM10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12ZM12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8Z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </label>
                    </div>
                </div>
            </div></>}    
            <div className="w-full m-2">
                {image && (<>
                    <label className="block mb-0 text-sm font-medium text-primary-900">{title}</label>
                    <div className="w-full mt-2 inline-flex justify-center">
                        <img src={image} alt="Foto Capturada" className="rounded-lg" style={{ width: '250px', height: 'auto' }} />
                    </div>
                    </>
                )}
            </div>
        </div>
    );
}
*/