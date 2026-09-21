import { PolizaPorAplicar } from "../../AplicacionPolizas.types";
import { ImagenGaleria } from "../Imagelightbox";

/* ---------- Tokens de estilo ---------- */
export const SUCCESS = '#2F6B4F';
export const SUCCESS_HOVER = '#255A40';

/* ---------- Helpers de UI ---------- */
const avatarColores = [
  'bg-[#1E3A5F] text-white',
  'bg-slate-700 text-white',
  'bg-[#16304D] text-white',
  'bg-slate-600 text-white',
  'bg-[#2C4A70] text-white',
  'bg-slate-800 text-white',
];

export const colorPorNombre = (texto: string) => {
  const hash = (texto || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return avatarColores[hash % avatarColores.length];
};

export const nombreCompleto = (p?: {
  nombres?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
}) => {
  if (!p) return 'Sin nombre';
  return `${p.nombres || ''} ${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.trim();
};

export const iniciales = (p?: { nombres?: string; apellido_paterno?: string }) => {
  if (!p) return '??';
  const n = (p.nombres || '').charAt(0);
  const a = (p.apellido_paterno || '').charAt(0);
  return (n + a).toUpperCase() || 'CP';
};

/* ---------- Galería de imágenes de una póliza ---------- */
export const obtenerGaleriaPoliza = (p: PolizaPorAplicar): ImagenGaleria[] => {
  const imgs: ImagenGaleria[] = [];
  const titular = p.titular;

  if (titular?.foto_dni_anverso_url) {
    imgs.push({ url: titular.foto_dni_anverso_url, label: 'DNI · Anverso (Titular)' });
  }
  if (titular?.foto_dni_reverso_url) {
    imgs.push({ url: titular.foto_dni_reverso_url, label: 'DNI · Reverso (Titular)' });
  }
  if (p.voucher?.data?.voucher?.voucher_aws) {
    imgs.push({ url: p.voucher.data.voucher.voucher_aws, label: 'Voucher de Pago' });
  }

  return imgs;
};