import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PaymentImageProps {
  imageSource: string | string[];
  alt: string;
  currentIndex?: number;
  onChangeIndex?: (index: number) => void;
}

export const PaymentImage: React.FC<PaymentImageProps> = ({
  imageSource,
  alt,
  currentIndex = 0,
  onChangeIndex
}) => {
  const [showFullImage, setShowFullImage] = useState(false);
  const [localImageIndex, setLocalImageIndex] = useState(currentIndex);
  const [s3Urls, setS3Urls] = useState<Record<string, string>>({});
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [loadingS3, setLoadingS3] = useState<Record<number, boolean>>({});

  // Usar el índice controlado si se proporciona onChangeIndex
  const currentImageIndex = onChangeIndex ? currentIndex : localImageIndex;
  const setCurrentImageIndex = onChangeIndex || setLocalImageIndex;

  // Obtener la URL base del env y asegurarse que no termine en slash
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE;
  const VITE_API_BASE_URL_GEODILE_TOKEN = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;

  // Convertir imageSource a array siempre para unificar el manejo
  const images = Array.isArray(imageSource) ? imageSource : [imageSource];

  // Función para determinar si es una ruta de comprobante
  const isComprobantePath = (str: string): boolean => {
    return str.startsWith('/comprobantes/') || str.includes('public/comprobantes') || str.includes('public\\comprobantes');
  };

  // Función para determinar si es una ruta de VOUCHER_PAGOS (S3)
  const isVoucherPagosPath = (str: string): boolean => {
    return str.startsWith('VOUCHER_PAGOS/');
  };

  // Función para obtener URL de S3 desde el API de MongoDB
  const fetchS3Url = async (imagePath: string): Promise<string | null> => {
    try {
      const response = await fetch(`${VITE_API_BASE_URL}/api_mongo_firm_easy/api/get_voucher_pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': VITE_API_BASE_URL_GEODILE_TOKEN
        },
        body: JSON.stringify({ URL: imagePath })
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data.status && data.link) {
        return data.link;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener URL de S3:', error);
      return null;
    }
  };

  // Limpiar errores cuando cambie el índice de imagen
  useEffect(() => {
    // Resetear el error de la imagen actual cuando cambie
    setImageErrors(prev => ({ ...prev, [currentImageIndex]: false }));
  }, [currentImageIndex]);

  // Cargar proactivamente las URLs de S3 para rutas VOUCHER_PAGOS
  useEffect(() => {
    const loadS3Urls = async () => {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        // Si es una ruta VOUCHER_PAGOS y no está cacheada, obtenerla
        if (isVoucherPagosPath(image) && !s3Urls[image]) {
          setLoadingS3(prev => ({ ...prev, [i]: true }));
          const s3Url = await fetchS3Url(image);
          if (s3Url) {
            setS3Urls(prev => ({ ...prev, [image]: s3Url }));
          } else {
            setImageErrors(prev => ({ ...prev, [i]: true }));
          }
          setLoadingS3(prev => ({ ...prev, [i]: false }));
        }
      }
    };
    loadS3Urls();
  }, [images]); // eslint-disable-line react-hooks/exhaustive-deps

  // Función para construir el src de la imagen
  const getImageSrc = (image: string): string => {
    if (!image) return ''; // Protección contra undefined

    // Si hay una URL de S3 cacheada para esta imagen, usarla
    if (s3Urls[image]) {
      return s3Urls[image];
    }

    // Si ya comienza con data:image, es un base64 completo
    if (image.startsWith('data:image')) {
      return image;
    }

    // Si es una ruta de VOUCHER_PAGOS, necesita obtener URL de S3
    if (isVoucherPagosPath(image)) {
      // Por ahora retornar vacío, se manejará en el onError
      return '';
    }
    
    // Si es una ruta de comprobante
    if (isComprobantePath(image)) {
      // Si ya es una URL completa, usarla tal cual
      if (image.startsWith('http://') || image.startsWith('https://')) {
        return image;
      }
      // Extraer solo el nombre del archivo y usar el prefijo /comprobantes
      const fileName = image.split(/[/\\]/).pop();
      if (!fileName) return '';
      const finalUrl = `${API_BASE_URL}/comprobantes/${fileName}`;
      return finalUrl;
    }

    // Si no es ninguno de los anteriores, asumimos que es un string base64
    return `data:image/jpeg;base64,${image}`;
  };

  // Manejar errores de carga de imagen
  const handleImageError = async (index: number) => {
    const image = images[index];
    
    // Si ya marcamos este índice como error, no reintentar
    if (imageErrors[index]) return;
    
    // Marcar como error temporalmente
    setImageErrors(prev => ({ ...prev, [index]: true }));

    // Construir la ruta para el API
    let s3Path = image;

    // Si es una ruta VOUCHER_PAGOS directa, usarla tal cual
    if (isVoucherPagosPath(image)) {
      s3Path = image;
    }
    // Si es una ruta de comprobante y falló, intentar obtener desde S3
    else if (isComprobantePath(image) && !s3Urls[image]) {
      // Si la imagen tiene el formato local, extraer la ruta relativa
      if (image.includes('public/comprobantes/') || image.includes('public\\comprobantes\\')) {
        const parts = image.split(/[/\\]/);
        const comprobanteIndex = parts.indexOf('comprobantes');
        if (comprobanteIndex >= 0) {
          const relativePath = parts.slice(comprobanteIndex + 1).join('/');
          s3Path = `VOUCHER_PAGOS/${relativePath}`;
        }
      } else if (image.startsWith('/comprobantes/')) {
        s3Path = `VOUCHER_PAGOS${image.substring(13)}`;
      } else {
        // No podemos construir la ruta, mantener el error
        return;
      }
    } else {
      // No es un caso que podamos manejar, mantener el error
      return;
    }

    // Intentar obtener la URL de S3
    const s3Url = await fetchS3Url(s3Path);
    if (s3Url) {
      setS3Urls(prev => ({ ...prev, [image]: s3Url }));
      setImageErrors(prev => ({ ...prev, [index]: false }));
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1;
    setCurrentImageIndex(newIndex);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(newIndex);
  };

  // Componente de navegación reutilizable
  const NavigationControls = () => (
    <>
      <button
        onClick={handlePrevImage}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-1 sm:p-2 hover:bg-black/70 z-10 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={handleNextImage}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 rounded-full p-1 sm:p-2 hover:bg-black/70 z-10 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-black/50 text-white px-1 py-0.5 sm:px-2 sm:py-1 rounded-md text-xs sm:text-sm z-10">
        {currentImageIndex + 1}/{images.length}
      </div>
    </>
  );

  return (
    <>
      <div className="w-full h-full rounded-lg overflow-hidden shadow-lg cursor-pointer bg-gray-50" onClick={() => setShowFullImage(true)}>
        <div className="relative w-full h-full flex items-center justify-center p-1">
          {loadingS3[currentImageIndex] ? (
            <div className="flex flex-col items-center justify-center text-gray-400 p-4">
              <svg className="w-12 h-12 mb-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm">Cargando imagen...</p>
            </div>
          ) : imageErrors[currentImageIndex] && !s3Urls[images[currentImageIndex]] ? (
            <div className="flex flex-col items-center justify-center text-gray-400 p-4">
              <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Imagen no disponible</p>
            </div>
          ) : (
            <img
              src={getImageSrc(images[currentImageIndex])}
              alt={`${alt} ${currentImageIndex + 1}/${images.length}`}
              className="w-full h-full object-contain"
              style={{
                minWidth: '0',
                minHeight: '0',
                maxWidth: '100%',
                maxHeight: '100%'
              }}
              loading="lazy"
              onError={() => handleImageError(currentImageIndex)}
            />
          )}
          {images.length > 1 && <NavigationControls />}
        </div>
      </div>

      {showFullImage && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative w-full h-full max-w-[95vw] max-h-[90vh] sm:max-w-[90vw] sm:max-h-[85vh] md:max-w-[80vw] md:max-h-[85vh] lg:max-w-[70vw] lg:max-h-[85vh] flex items-center justify-center bg-white rounded-lg overflow-hidden">
            {loadingS3[currentImageIndex] ? (
              <div className="flex flex-col items-center justify-center text-gray-400 p-8">
                <svg className="w-16 h-16 mb-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg">Cargando imagen...</p>
              </div>
            ) : imageErrors[currentImageIndex] && !s3Urls[images[currentImageIndex]] ? (
              <div className="flex flex-col items-center justify-center text-gray-400 p-8">
                <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg">Imagen no disponible</p>
              </div>
            ) : (
              <img
                src={getImageSrc(images[currentImageIndex])}
                alt={`${alt} ${currentImageIndex + 1}/${images.length}`}
                className="max-w-full max-h-full w-auto h-auto object-contain"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto'
                }}
                onError={() => handleImageError(currentImageIndex)}
              />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFullImage(false);
              }}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-600 bg-white/90 rounded-full p-1 sm:p-2 hover:bg-white shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {images.length > 1 && <NavigationControls />}
          </div>
        </div>
      , document.body)}
    </>
  );
};