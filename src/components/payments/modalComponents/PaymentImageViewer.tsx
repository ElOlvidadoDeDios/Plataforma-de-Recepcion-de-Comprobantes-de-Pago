import React from 'react';
import { PaymentImage } from '../../PaymentImage';

interface PaymentImageViewerProps {
  imageSource: string | string[]; // Acepta string o array de strings
  altText: string;
  isLoading: boolean;
}

export const PaymentImageViewer: React.FC<PaymentImageViewerProps> = ({
  imageSource,
  altText,
  isLoading
}) => {
  // Asegurarse de que imageSource siempre sea un array
  const images = Array.isArray(imageSource) ? imageSource : [imageSource];
  
  return (
    <div className="bg-white/90 rounded-lg h-full relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center p-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-600">Cargando imagen...</div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <PaymentImage
              imageSource={images} // Siempre pasamos un array
              alt={altText}
            />
          </div>
        )}
      </div>
    </div>
  );
};