import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  Eye,
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldAlert,
  X,
  CreditCard,
  User,
  Image as ImageIcon,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Poliza } from '../types';
import ImageLightbox, { ImagenGaleria } from '../components/Imagelightbox';

interface DetallePolizaModalProps {
  poliza: Poliza;
  estadoContrato: string;
  obtenerBadgeEstado: (estado: string) => React.ReactNode;
  onClose: () => void;
}

/* ---------- Helpers de UI ---------- */
const avatarColores = [
  'bg-[#1E3A5F] text-white',
  'bg-slate-700 text-white',
  'bg-[#16304D] text-white',
  'bg-slate-600 text-white',
  'bg-[#2C4A70] text-white',
  'bg-slate-800 text-white',
];

const colorPorNombre = (texto: string) => {
  const hash = (texto || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return avatarColores[hash % avatarColores.length];
};

const nombreCompleto = (p?: {
  nombres?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
}) => {
  if (!p) return 'Sin nombre';
  return `${p.nombres || ''} ${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.trim();
};

const iniciales = (p?: { nombres?: string; apellido_paterno?: string }) => {
  if (!p) return '??';
  const n = (p.nombres || '').charAt(0);
  const a = (p.apellido_paterno || '').charAt(0);
  return (n + a).toUpperCase() || 'CP';
};

/* ---------- Componente Modal PDF Contrato Firmado ---------- */
const ModalContratoPDF: React.FC<{ url: string; titulo: string; onClose: () => void }> = ({
  url,
  titulo,
  onClose,
}) => {
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

const DetallePolizaModal: React.FC<DetallePolizaModalProps> = ({
  poliza,
  estadoContrato,
  obtenerBadgeEstado,
  onClose,
}) => {
  const [lightbox, setLightbox] = useState<{ galeria: ImagenGaleria[]; indice: number } | null>(null);
  const [pdfModal, setPdfModal] = useState<{ url: string; titulo: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !lightbox && !pdfModal) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose, lightbox, pdfModal]);

  if (!poliza) return null;

  const { titular, beneficiarios, agencia_nom, fecha_hora_local, fecha_local, hora_local, firma, voucher, estado } = poliza;

  // Galería principal solo del titular y voucher
  const galeriaPrincipal: ImagenGaleria[] = [];
  if (titular?.foto_dni_anverso_url) {
    galeriaPrincipal.push({ url: titular.foto_dni_anverso_url, label: 'DNI · Anverso (Titular)' });
  }
  if (titular?.foto_dni_reverso_url) {
    galeriaPrincipal.push({ url: titular.foto_dni_reverso_url, label: 'DNI · Reverso (Titular)' });
  }
  if (voucher?.data?.voucher?.voucher_aws) {
    galeriaPrincipal.push({ url: voucher.data.voucher.voucher_aws, label: 'Voucher de Pago' });
  } else if (poliza.voucher_url) {
    galeriaPrincipal.push({ url: poliza.voucher_url, label: 'Voucher de Pago' });
  }

  const contratoUrl =
    firma?.data?.firm_easy?.firm_aws ||
    firma?.data?.firm_easy?.signed_file ||
    poliza.contrato_url;

  const estaFirmado =
    firma?.data?.firm_easy?.status === 'signed' ||
    Boolean(firma?.data?.firm_easy?.signed_file);

  const voucherData = voucher?.data?.voucher;
  const voucherAwsUrl = voucherData?.voucher_aws || poliza.voucher_url;
  const fechaRegistro = fecha_hora_local || `${fecha_local || ''} ${hora_local || ''}`.trim();
  const fechaVence = (poliza as any).fecha_vence;

  const abrirGaleria = (galeria: ImagenGaleria[], indice: number) => {
    setLightbox({ galeria, indice });
  };

  const abrirPDF = (url: string, titulo: string) => {
    setPdfModal({ url, titulo });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !lightbox && !pdfModal) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Cabecera del Modal */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-700/50">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-md ${colorPorNombre(
                titular?.nombres || ''
              )}`}
            >
              {iniciales(titular)}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white truncate leading-tight">
                {nombreCompleto(titular)}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-300">
                <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-[11px]">
                  {titular?.tipo_documento || 'DNI'}: {titular?.nro_documento}
                </span>
                <span className="flex items-center gap-1 text-cyan-300">
                  <Building2 className="w-3.5 h-3.5" />
                  {agencia_nom || 'Sin Agencia'}
                </span>
                {estado && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded text-[10px] font-semibold">
                    {estado}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {titular?.costo !== undefined && (
              <span className="hidden sm:inline-block font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1 rounded-lg text-sm">
                S/ {titular.costo.toFixed(2)}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido con Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-700 bg-slate-50/50 flex-1">
          {/* Fila 1: Información General y Datos del Asegurado */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                Datos del Asegurado (Titular)
              </h3>
              <div>{obtenerBadgeEstado(estadoContrato)}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold block uppercase">Nombre Completo</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{nombreCompleto(titular)}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold block uppercase">Documento</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                  {titular?.tipo_documento} {titular?.nro_documento}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold block uppercase">Costo / Tarifa</span>
                <span className="font-bold text-emerald-700 text-sm mt-0.5 block">
                  S/ {titular?.costo ? titular.costo.toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Celular</span>
                  <span className="font-medium text-slate-700 truncate block">{titular?.celular || 'No registrado'}</span>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Correo Electrónico</span>
                  <span className="font-medium text-slate-700 truncate block">{titular?.correo || 'No registrado'}</span>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Fecha y Hora de Registro</span>
                  <span className="font-medium text-slate-700 truncate block">{fechaRegistro || 'N/D'}</span>
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase block">Agencia / Registrado Por</span>
                  <span className="font-medium text-slate-700 truncate block">
                    {agencia_nom || 'N/D'} {poliza.user ? `· Usuario: ${poliza.user}` : ''}
                  </span>
                </div>
              </div>
              {fechaVence && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Fecha de Vencimiento</span>
                    <span className="font-medium text-slate-700 truncate block">{fechaVence}</span>
                  </div>
                </div>
              )}
              {titular?.direccion && (
                <div className="sm:col-span-2 md:col-span-3 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Dirección Domiciliaria</span>
                    <span className="font-medium text-slate-700 block">{titular.direccion}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fila 2: Validación de Firma y Voucher */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Firma Digital */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Firma Digital (Contrato)
                  </h3>
                  {estaFirmado ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      FIRMADO
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      <Clock className="w-3.5 h-3.5" />
                      PENDIENTE
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 mt-2 space-y-1">
                  <p>
                    <span className="text-slate-400">ID Asegurado:</span>{' '}
                    <span className="font-mono font-medium">{firma?.data?.id_asegurado || 'N/D'}</span>
                  </p>
                  <p>
                    <span className="text-slate-400">Token Firma:</span>{' '}
                    <span className="font-mono text-[11px] text-slate-500">{firma?.data?.firm_easy?.token || 'N/D'}</span>
                  </p>
                  {firma?.message && (
                    <p className="text-[11px] text-slate-400 truncate">
                      <span>Mensaje:</span> {firma.message}
                    </p>
                  )}
                </div>
              </div>

              {contratoUrl ? (
                <button
                  type="button"
                  onClick={() =>
                    abrirPDF(
                      contratoUrl,
                      `Contrato - ${nombreCompleto(titular)} (${titular?.nro_documento})`
                    )
                  }
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  Visualizar Contrato en Pantalla
                </button>
              ) : (
                <div className="text-center py-2 px-3 rounded-lg bg-slate-100 text-slate-400 text-xs italic">
                  Documento PDF no generado aún
                </div>
              )}
            </div>

            {/* Voucher de Pago */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    Voucher de Pago
                  </h3>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 uppercase">
                    {voucherData?.estado || (voucherAwsUrl ? 'REGISTRADO' : 'PENDIENTE')}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-2 space-y-1">
                  <p>
                    <span className="text-slate-400">Registrado por:</span>{' '}
                    <span className="font-semibold">{voucherData?.user_registra || poliza.user || 'N/D'}</span>
                  </p>
                  <p>
                    <span className="text-slate-400">Fecha Voucher:</span>{' '}
                    <span>
                      {voucher?.data?.fecha_local
                        ? `${voucher.data.fecha_local} ${voucher.data.hora_local || ''}`
                        : 'N/D'}
                    </span>
                  </p>
                </div>
              </div>

              {voucherAwsUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    const idx = galeriaPrincipal.findIndex((g) => g.url === voucherAwsUrl);
                    abrirGaleria(galeriaPrincipal, idx >= 0 ? idx : 0);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <Eye className="w-4 h-4" />
                  Visualizar Voucher en Pantalla Completa
                </button>
              ) : (
                <div className="text-center py-2 px-3 rounded-lg bg-slate-100 text-slate-400 text-xs italic">
                  Sin comprobante de voucher adjunto
                </div>
              )}
            </div>
          </div>

          {/* Fila 3: Galería de Documentos del Titular y Voucher (En pantalla con Lightbox) */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-purple-600" />
                Documentos e Imágenes Adjuntas ({galeriaPrincipal.length})
              </h3>
              <span className="text-xs text-slate-400 italic">Haz clic para ampliar en visor interactivo</span>
            </div>

            {galeriaPrincipal.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No hay imágenes registradas para el titular
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                {galeriaPrincipal.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => abrirGaleria(galeriaPrincipal, idx)}
                    className="group cursor-pointer bg-slate-50 border border-slate-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="relative aspect-video sm:aspect-square bg-slate-100 overflow-hidden flex items-center justify-center">
                      <img
                        src={img.url}
                        alt={img.label}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <span className="bg-black/60 text-white text-xs px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> Ampliar
                        </span>
                      </div>
                    </div>
                    <div className="p-2 text-center bg-white border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-700 truncate block">
                        {img.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fila 4: Beneficiarios con sus fotos dentro de cada tarjeta */}
          {beneficiarios && beneficiarios.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-600" />
                Beneficiarios Registrados ({beneficiarios.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {beneficiarios.map((b: any, idx: number) => {
                  const fotosBeneficiario: ImagenGaleria[] = [
                    ...(b.foto_dni_anverso_url
                      ? [{ url: b.foto_dni_anverso_url, label: `DNI · Anverso (${nombreCompleto(b) || `Beneficiario ${idx + 1}`})` }]
                      : []),
                    ...(b.foto_dni_reverso_url
                      ? [{ url: b.foto_dni_reverso_url, label: `DNI · Reverso (${nombreCompleto(b) || `Beneficiario ${idx + 1}`})` }]
                      : []),
                  ];

                  return (
                    <div
                      key={idx}
                      className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3"
                    >
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800 text-sm">{nombreCompleto(b)}</p>
                        <p className="text-xs text-slate-500">
                          {b.tipo_documento} {b.nro_documento} · Celular: {b.celular || 'No registrado'}
                        </p>
                        {b.correo && <p className="text-xs text-slate-500">Correo: {b.correo}</p>}
                        {b.direccion && <p className="text-xs text-slate-500">{b.direccion}</p>}
                      </div>

                      {fotosBeneficiario.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {fotosBeneficiario.map((foto, fotoIdx) => (
                            <button
                              key={`${idx}-${fotoIdx}`}
                              type="button"
                              onClick={() => abrirGaleria(fotosBeneficiario, fotoIdx)}
                              className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white hover:border-blue-400 transition-colors"
                              title={foto.label}
                            >
                              <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center">
                                <img
                                  src={foto.url}
                                  alt={foto.label}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  loading="lazy"
                                />
                              </div>
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                                <span className="bg-black/60 text-white text-[10px] px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                  Ver foto
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic bg-white rounded-lg border border-dashed border-slate-200 p-2 text-center">
                          Sin fotos de DNI adjuntas
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="px-5 sm:px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold transition"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>

      {/* Lightbox Integrado para fotos */}
      {lightbox && (
        <ImageLightbox
          imagenes={lightbox.galeria}
          indiceInicial={lightbox.indice}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Visor PDF Integrado para contratos */}
      {pdfModal && (
        <ModalContratoPDF
          url={pdfModal.url}
          titulo={pdfModal.titulo}
          onClose={() => setPdfModal(null)}
        />
      )}
    </div>,
    document.body
  );
};

export default DetallePolizaModal;