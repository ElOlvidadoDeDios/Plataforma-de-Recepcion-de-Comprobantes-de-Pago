import React, { useState, useEffect, useMemo } from 'react';

interface WhatsAppImageProps {
  imagePath: string;
  alt: string;
  className?: string;
}

export const WhatsAppImage: React.FC<WhatsAppImageProps> = ({ imagePath, alt, className = '' }) => {
  const [s3Url, setS3Url] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL_GEODILE;
  const VITE_API_BASE_URL_GEODILE_TOKEN = import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN;

  // Función para obtener URL de S3 desde el API de MongoDB
  const fetchS3Url = async (path: string): Promise<string | null> => {
    try {
      const response = await fetch(`${VITE_API_BASE_URL}/api_mongo_firm_easy/api/get_voucher_pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': VITE_API_BASE_URL_GEODILE_TOKEN
        },
        body: JSON.stringify({ URL: path })
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data.status && data.link) {
        return data.link;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener URL de S3 para WhatsApp:', error);
      return null;
    }
  };

  // Cargar la URL de S3
  useEffect(() => {
    const loadImage = async () => {
      if (!imagePath) {
        setError(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(false);

      const url = await fetchS3Url(imagePath);
      if (url) {
        setS3Url(url);
      } else {
        setError(true);
      }
      setLoading(false);
    };

    loadImage();
  }, [imagePath]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ minHeight: '200px' }}>
        <div className="text-center">
          <svg className="w-8 h-8 mb-2 animate-spin mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xs text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !s3Url) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ minHeight: '200px' }}>
        <div className="text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs">Imagen no disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <img
        src={s3Url}
        alt={alt}
        className="block w-full h-auto max-h-[360px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => window.open(s3Url, '_blank')}
        loading="lazy"
      />
    </div>
  );
};
