import React from 'react';
//import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaymentImage } from '../../PaymentImage';

interface PaymentImageViewerProps {
  imageSource: string;
  altText: string;
  isLoading: boolean;
  showNavigation: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
}

export const PaymentImageViewer: React.FC<PaymentImageViewerProps> = ({
  imageSource,
  altText,
  isLoading,
}) => {
  return (
    <div className="bg-white/90 rounded-lg h-full relative overflow-hidden">
      <div className="bg-white/90 w-full h-full flex items-center justify-center overflow-hidden p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-600">Cargando imagen...</div>
          </div>
        ) : (
          <div className="p-4">
            <PaymentImage
              imageSource={imageSource}
              alt={altText}
            />
          </div>
        )}
      </div>
    </div>
  );
};