import React from 'react';
import { PaymentImage } from '../../PaymentImage';

interface PaymentImageViewerProps {
  imageSource: string | string[];
  altText: string;
  isLoading: boolean;
  currentIndex: number;
  onChangeIndex: (index: number) => void;
}

export const PaymentImageViewer: React.FC<PaymentImageViewerProps> = ({
  imageSource,
  altText,
  isLoading,
  currentIndex,
  onChangeIndex
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
              imageSource={images}
              alt={altText}
              currentIndex={currentIndex}
              onChangeIndex={onChangeIndex}
            />
          </div>
        )}
      </div>
    </div>
  );
};