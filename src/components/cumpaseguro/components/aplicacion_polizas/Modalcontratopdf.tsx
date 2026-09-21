import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, ExternalLink, X } from 'lucide-react';

interface ModalContratoPDFProps {
  url: string;
  titulo: string;
  onClose: () => void;
}

const ModalContratoPDF: React.FC<ModalContratoPDFProps> = ({ url, titulo, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-700">
        <div className="px-5 py-3.5 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-700">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-5 h-5 text-blue-400 shrink-0" />
            <h3 className="font-bold text-sm sm:text-base truncate">{titulo}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors text-xs font-semibold flex items-center gap-1.5"
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Pestaña nueva</span>
            </a>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-xs font-bold flex items-center gap-1 shadow-sm"
              title="Cerrar documento (Esc)"
            >
              <X className="w-4 h-4" />
              <span>Cerrar</span>
            </button>
          </div>
        </div>
        <div className="flex-1 bg-slate-100 p-1 sm:p-2 relative">
          <iframe
            src={url}
            title={titulo}
            className="w-full h-full rounded-xl border border-slate-300 bg-white shadow-inner"
          />
        </div>
        <div className="px-4 py-2.5 bg-slate-900 text-white flex justify-between items-center text-xs shrink-0 border-t border-slate-800">
          <span className="text-slate-400 text-[11px]">
            Presiona <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-white font-mono">Esc</kbd> o el botón para salir
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition"
          >
            Cerrar Visor
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalContratoPDF;