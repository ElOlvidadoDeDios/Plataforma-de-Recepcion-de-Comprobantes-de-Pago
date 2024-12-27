import React from 'react';

interface PaymentImageProps {
  base64Image: string;
  alt: string;
}

export const PaymentImage: React.FC<PaymentImageProps> = ({ base64Image, alt }) => {
  return (
    <div className="rounded-lg overflow-hidden shadow-lg">
      <img
        src={`data:image/jpeg;base64,${base64Image}`}
        alt={alt}
        className="w-full h-auto max-h-96 object-contain"
      />
    </div>
  );
};