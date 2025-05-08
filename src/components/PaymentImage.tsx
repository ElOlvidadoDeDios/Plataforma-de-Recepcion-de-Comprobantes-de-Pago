import React from 'react';

interface PaymentImageProps {
  imageSource: string; // Puede ser URL, ruta relativa o base64
  alt: string;
}

export const PaymentImage: React.FC<PaymentImageProps> = ({ imageSource, alt }) => {
  // Obtener la URL base del env
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
      // Si es una ruta relativa, añadir la URL base
      if (image.startsWith('/comprobantes/')) {
        return `${API_BASE_URL}${image}`;
      }
      // Si es una ruta con public, extraer solo el nombre del archivo
      const fileName = image.split(/[/\\]/).pop();
      return `${API_BASE_URL}/comprobantes/${fileName}`;
    }

    // Si no es ninguno de los anteriores, asumimos que es un string base64
    return `data:image/jpeg;base64,${image}`;
  };

  return (
    <div className="rounded-lg overflow-hidden shadow-lg">
      <img
        src={getImageSrc(imageSource)}
        alt={alt}
        className="w-full h-auto max-h-50 object-contain"
      />
    </div>
  );
};