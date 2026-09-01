import React from 'react';

interface ImageThumbnailProps {
  url: string;
  label: string;
  onClick: () => void;
}

const ImageThumbnail: React.FC<ImageThumbnailProps> = ({ url, label, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-gray-200 shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-400"
      title={label}
    >
      <img
        src={url}
        alt={label}
        className="w-full h-full object-contain bg-gray-50 transition-transform duration-200 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
        <svg
          className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 8v6M8 11h6" />
        </svg>
      </div>
      <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] leading-tight px-1 py-0.5 text-center truncate">
        {label}
      </span>
    </button>
  );
};

export default ImageThumbnail;