import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DetalleSolicitud } from '../../../api/aprobacionCreditosAPI';

interface SolicitudCredito {
  AGENCIA_NOM: string;
  Nro: string;
  NRO_SOL: string;
  FECHA_SOL: string;
  CUENTA: string;
  NOMBRE: string;
  MONTO_SOL: string;
  MONEDA: string;
  NETO: string;
  COD_CARGO: string;
  TEM: string;
  TEA_INTERES: string;
  CUO_SEGURO: string;
  detalle?: DetalleSolicitud;
}
interface SolicitudCreditoModalProps {
  solicitud: SolicitudCredito | null;
  onClose: () => void;
  onAprobar?: (solicitud: SolicitudCredito, glosa: string) => void;
  onDenegar?: (solicitud: SolicitudCredito, glosa: string) => void;
  onAnular?: (solicitud: SolicitudCredito, glosa: string) => void;
  onImprimir?: (solicitud: SolicitudCredito) => void;
  canMakeAction?: boolean;
}

const SolicitudCreditoModal: React.FC<SolicitudCreditoModalProps> = ({
  solicitud,
  onClose,
  onAprobar,
  onDenegar,
  onAnular,
  onImprimir,
  canMakeAction = false,
}) => {
  const glosaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    if (solicitud) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [solicitud]);

  useEffect(() => {
    if (solicitud) {
      modalRef.current?.focus();
    }
  }, [solicitud]);

  if (!solicitud) return null;

  const glosa = () => glosaRef.current?.value ?? '';

  const formatMonto = (valor: string | number) => {
    const numValue = typeof valor === 'string' ? parseFloat(valor) : valor;
    return numValue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatFecha = (fecha: string) => {
    return fecha.split(' ')[0];
  };

  const detalle = solicitud.detalle;

  const getSituacionColor = (situacion: string) => {
    switch (situacion.toUpperCase()) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'APROBADO':
        return 'bg-green-100 text-green-800';
      case 'DENEGADO':
        return 'bg-red-100 text-red-800';
      case 'ANULADO':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Solicitud de crédito"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="
          relative w-full max-w-2xl max-h-[95vh] overflow-y-auto
          bg-white rounded-xl shadow-2xl outline-none
          focus:outline-none
        "
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 flex items-center justify-between rounded-t-xl">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium transition-colors"
            aria-label="Cerrar modal"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </button>
          <h2 className="text-white font-semibold text-sm tracking-wide uppercase">
            Solicitud de Crédito
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-5">

          {detalle ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <Field label="Cuenta" value={detalle.CUENTA} highlight />
                <Field label="Razón Social" value={detalle.RAZON_SOCIAL} />
              </div>

              {/* FIX 1: En móvil → 2 filas. Fila 1: Nro Sol + Pagare. Fila 2: Nombre producto (ancho completo) */}
              {/* En desktop → 3 columnas como antes */}
              <div className="grid grid-cols-2 sm:grid-cols-[1fr_2fr_1fr] gap-x-6 gap-y-3">
                <Field label="Nro Solicitud" value={detalle.NRO_SOL} highlight small />
                <Field label="Pagare" value={detalle.NRO_SOL} highlight small />
                {/* Nombre del producto: ocupa las 2 columnas en móvil, columna del medio en desktop */}
                <div className="col-span-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                  <Field label="" value={`${detalle.NOM_SUBTIPO_PRES} ${detalle.NOM_PROD}`} red />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                <Field label="Nro Aprob." value={detalle.ORDEN} />
                <Field label="Neto" value={detalle.MONTO_NETO} />
                <Field label="Monto Solicitado" value={detalle.MONTO_SOL} highlight />
                <Field label="Monto a Aprobar" value={detalle.MONTO_APROB} />
                <Field label="Moneda" value={detalle.MONEDA} />
                <Field label="Plazo" value={detalle.PLAZO} />
                <Field label="Fecha 1ra Cuota" value={formatFecha(detalle.FECHA_1RACUOTA)} />
                <Field label="Valor de Cuota" value={`${Number(detalle.CUOTA_FIJA) + Number(detalle.CUO_SEGURO)}`} />
                <Field label="Frecuencia" value={detalle.NOM_FRECUENCIA} />
                <Field label="T.E.A %" value={`${parseFloat(detalle.TEA_INTERES).toFixed(2)}`} />
                <Field label="T.E.M.%" value={`${parseFloat(detalle.TEM).toFixed(2)}`} />
                <Field label="Cuota Seguro" value={detalle.CUO_SEGURO ? `S/ ${formatMonto(detalle.CUO_SEGURO)}` : '-'} />
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Cargando detalle de la solicitud...
            </div>
          )}

          {/* FIX 2: Tabla de cargos → cards apiladas en móvil, tabla en desktop */}
          {detalle && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Cargos Autorizados a Aprobar
              </p>

              {/* Vista móvil: card vertical sin scroll horizontal */}
              <div className="sm:hidden rounded-lg border border-gray-200 bg-blue-50 p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500 uppercase">No.</span>
                  <span className="text-sm text-blue-700 font-medium">{detalle.ORDEN || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500 uppercase">Prioridad</span>
                  <span className="text-sm text-blue-700">{detalle.ORDEN || '-'}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-medium text-gray-500 uppercase shrink-0">Cargo</span>
                  <span className="text-sm text-blue-700 text-right">{detalle.ENCARGADO || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500 uppercase">Situación</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSituacionColor(detalle.ESTADO)}`}>
                    {detalle.ESTADO}
                  </span>
                </div>
              </div>

              {/* Vista desktop: tabla original */}
              <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['No.', 'Prioridad', 'Cargo', 'Situación'].map((col) => (
                        <th
                          key={col}
                          className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    <tr className="bg-blue-50">
                      <td className="px-3 py-2 text-blue-700 font-medium">{detalle.ORDEN || '-'}</td>
                      <td className="px-3 py-2 text-blue-700">{detalle.ORDEN || '-'}</td>
                      <td className="px-3 py-2 text-blue-700">{detalle.ENCARGADO || '-'}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSituacionColor(detalle.ESTADO)}`}>
                          {detalle.ESTADO}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Glosa */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Glosa
            </label>
            <textarea
              ref={glosaRef}
              rows={3}
              placeholder="Ingrese una observación o comentario..."
              className="
                w-full resize-y rounded-lg border border-gray-200
                px-3 py-2 text-sm text-gray-700
                placeholder:text-gray-400
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                transition-all
              "
            />
          </div>

          {/* Divisor */}
          <div className="border-t border-gray-100 pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <ActionButton
                label="Aprobar"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                colorClass="text-green-700 border-green-300 hover:bg-green-50"
                onClick={() => onAprobar?.(solicitud, glosa())}
                disabled={!canMakeAction}
              />
              <ActionButton
                label="Denegar"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6" />
                  </svg>
                }
                colorClass="text-red-700 border-red-300 hover:bg-red-50"
                onClick={() => onDenegar?.(solicitud, glosa())}
                disabled={!canMakeAction}
              />
              <ActionButton
                label="Anular"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                }
                colorClass="text-orange-700 border-orange-300 hover:bg-orange-50"
                onClick={() => onAnular?.(solicitud, glosa())}
                disabled={!canMakeAction}
              />
              <ActionButton
                label="Imprimir"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                }
                colorClass="text-blue-700 border-blue-300 hover:bg-blue-50"
                onClick={() => onImprimir?.(solicitud)}
                disabled={false}
              />
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};

/* ── Subcomponentes internos ── */

const Field: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
  green?: boolean;
  red?: boolean;
  small?: boolean;
}> = ({ label, value, highlight, green, red, small }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-medium text-gray-500">{label}</span>
    <div
      className={`
        rounded-md border px-3 py-1.5
        ${small ? 'text-xs' : 'text-xs sm:text-sm'}
        ${highlight ? 'border-blue-300 text-blue-700 font-semibold bg-blue-50' : ''}
        ${green ? 'border-green-300 text-green-700 font-semibold bg-green-50' : ''}
        ${red ? 'text-red-700 font-semibold bg-red-50' : ''}
        ${!highlight && !green && !red ? 'border-gray-200 text-gray-800 bg-gray-50' : ''}
      `}
    >
      {value}
    </div>
  </div>
);

const ActionButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  colorClass: string;
  onClick: () => void;
  disabled?: boolean;
}> = ({ label, icon, colorClass, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      flex flex-col items-center gap-1.5 py-3 px-2
      rounded-lg border font-medium text-xs
      transition-all duration-150
      ${disabled ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400' : colorClass}
      active:scale-95
    `}
  >
    {icon}
    {label}
  </button>
);

export default SolicitudCreditoModal;