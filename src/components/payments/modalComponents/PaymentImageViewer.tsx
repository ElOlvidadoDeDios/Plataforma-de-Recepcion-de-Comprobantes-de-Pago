import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  showNavigation,
  onPrevious,
  onNext
}) => {
  return (
    <div className="bg-gray-50 rounded-lg h-full relative">
      <div className="absolute inset-0 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-600">Cargando imagen...</div>
          </div>
        ) : (
          <>
            {showNavigation && (
              <>
                <button
                  onClick={onPrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={onNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
            <div className="p-4">
              <PaymentImage
                imageSource={imageSource}
                alt={altText}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};