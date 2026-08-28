import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface ImagenGaleria {
  url: string;
  label: string;
}

interface ImageLightboxProps {
  imagenes: ImagenGaleria[];
  indiceInicial: number;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ imagenes, indiceInicial, onClose }) => {
  const [indice, setIndice] = React.useState(indiceInicial);
  const tieneVarias = imagenes.length > 1;

  const anterior = useCallback(() => {
    setIndice((i) => (i - 1 + imagenes.length) % imagenes.length);
  }, [imagenes.length]);

  const siguiente = useCallback(() => {
    setIndice((i) => (i + 1) % imagenes.length);
  }, [imagenes.length]);

  useEffect(() => {
    const manejarTeclado = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && tieneVarias) anterior();
      if (e.key === 'ArrowRight' && tieneVarias) siguiente();
    };
    document.addEventListener('keydown', manejarTeclado);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', manejarTeclado);
      document.body.style.overflow = '';
    };
  }, [onClose, anterior, siguiente, tieneVarias]);

  const actual = imagenes[indice];
  if (!actual) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.15s_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={actual.label}
    >
      {/* Cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
        aria-label="Cerrar"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Anterior */}
      {tieneVarias && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            anterior();
          }}
          className="absolute left-2 sm:left-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          aria-label="Imagen anterior"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Imagen */}
      <div className="flex flex-col items-center gap-3 max-w-3xl w-full">
        <img
          src={actual.url}
          alt={actual.label}
          className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl bg-white/5"
        />
        <div className="flex items-center gap-3 text-white/80 text-sm">
          <span className="font-medium">{actual.label}</span>
          {tieneVarias && (
            <span className="text-white/50">
              {indice + 1} / {imagenes.length}
            </span>
          )}
        </div>
      </div>

      {/* Siguiente */}
      {tieneVarias && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            siguiente();
          }}
          className="absolute right-2 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          aria-label="Imagen siguiente"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>,
    document.body
  );
};

export default ImageLightbox;