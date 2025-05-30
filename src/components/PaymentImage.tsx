import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface PaymentImageProps {
  imageSource: string; // Puede ser URL, ruta relativa o base64
  alt: string;
}

export const PaymentImage: React.FC<PaymentImageProps> = ({ imageSource, alt }) => {
  const [showFullImage, setShowFullImage] = useState(false);
  // Obtener la URL base del env y asegurarse que no termine en slash
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');

  // Función para determinar si es una ruta de comprobante
  const isComprobantePath = (str: string): boolean => {
    return str.startsWith('/comprobantes/') || str.includes('public/comprobantes') || str.includes('public\\comprobantes');
  };

  // Función para construir el src de la imagen
  const getImageSrc = (image: string): string => {
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
      // Si es una ruta relativa, extraer el nombre del archivo y construir la URL
      const fileName = image.split(/[/\\]/).pop();
      return `${API_BASE_URL}/comprobantes/${fileName}`;
    }

    // Si no es ninguno de los anteriores, asumimos que es un string base64
    return `data:image/jpeg;base64,${image}`;
  };

  return (
    <>
      <div className="w-full h-full rounded-lg overflow-hidden shadow-lg cursor-pointer bg-gray-50" onClick={() => setShowFullImage(true)}>
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={getImageSrc(imageSource)}
            alt={alt}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
      </div>

      {showFullImage && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative w-[95vw] h-[95vh] flex items-center justify-center bg-white rounded-lg">
            <img
              src={getImageSrc(imageSource)}
              alt={alt}
              className="max-w-[95%] max-h-[95%] object-contain"
            />
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      , document.body)}
    </>
  );
};