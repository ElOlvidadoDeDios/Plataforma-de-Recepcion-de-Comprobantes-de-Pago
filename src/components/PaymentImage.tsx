import React, { useState } from 'react';
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

  // Usar el índice controlado si se proporciona onChangeIndex
  const currentImageIndex = onChangeIndex ? currentIndex : localImageIndex;
  const setCurrentImageIndex = onChangeIndex || setLocalImageIndex;
  
  // Obtener la URL base del env y asegurarse que no termine en slash
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');

  // Convertir imageSource a array siempre para unificar el manejo
  const images = Array.isArray(imageSource) ? imageSource : [imageSource];

  // Función para determinar si es una ruta de comprobante
  const isComprobantePath = (str: string): boolean => {
    return str.startsWith('/comprobantes/') || str.includes('public/comprobantes') || str.includes('public\\comprobantes');
  };

  // Función para construir el src de la imagen
  const getImageSrc = (image: string): string => {
    if (!image) return ''; // Protección contra undefined

    // Si ya comienza con data:image, es un base64 completo
    if (image.startsWith('data:image')) {
      return image;
    }
    
    // Si es una ruta de comprobante
    if (isComprobantePath(image)) {
      // Si ya es una URL completa, usarla tal cual
      if (image.startsWith('http://') || image.startsWith('https://')) {
        return image;
      }
      // Extraer solo el nombre del archivo y usar el prefijo /comprobantes
      const fileName = image.split(/[/\\]/).pop();
      console.log('Ruta original:', image);
      console.log('Nombre del archivo:', fileName);
      if (!fileName) return '';
      const finalUrl = `${API_BASE_URL}/comprobantes/${fileName}`;
      console.log('URL final:', finalUrl);
      return finalUrl;
    }

    // Si no es ninguno de los anteriores, asumimos que es un string base64
    return `data:image/jpeg;base64,${image}`;
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
          />
          {images.length > 1 && <NavigationControls />}
        </div>
      </div>

      {showFullImage && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative w-full h-full max-w-[95vw] max-h-[95vh] flex items-center justify-center bg-white rounded-lg overflow-hidden">
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
            />
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