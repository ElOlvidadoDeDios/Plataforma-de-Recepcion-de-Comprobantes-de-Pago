import React, { useMemo, useState } from 'react';
import Layout from '../../Layout';
import { RegistroAseguramiento, PersonaRegistro } from '../Aseguramiento.types';
import { useListadoAseguramientos } from '../hooks/Uselistadoaseguramientos';
import ImageThumbnail from './Imagethumbnail';
import ImageLightbox, { ImagenGaleria } from './Imagelightbox';

interface AseguramientosListPageProps {
  onVolver: () => void;
}

/* ---------- Helpers ---------- */

const estadoStyles: Record<string, string> = {
  INGRESADO: 'bg-blue-50 text-blue-600 border-blue-200',
  APROBADO: 'bg-green-50 text-green-600 border-green-200',
  RECHAZADO: 'bg-red-50 text-red-600 border-red-200',
};

const avatarColores = [
  'bg-blue-100 text-blue-600',
  'bg-purple-100 text-purple-600',
  'bg-teal-100 text-teal-600',
  'bg-amber-100 text-amber-600',
  'bg-pink-100 text-pink-600',
  'bg-indigo-100 text-indigo-600',
];

const colorPorNombre = (texto: string) => {
  const hash = texto.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return avatarColores[hash % avatarColores.length];
};

const nombreCompleto = (p: { nombres: string; apellido_paterno: string; apellido_materno: string }) =>
  `${p.nombres} ${p.apellido_paterno} ${p.apellido_materno}`;

const iniciales = (p: { nombres: string; apellido_paterno: string }) =>
  `${p.nombres.charAt(0)}${p.apellido_paterno.charAt(0)}`.toUpperCase();

/** Arma la galería de imágenes disponibles de una persona (titular o beneficiario) */
const galeriaDe = (p: PersonaRegistro): ImagenGaleria[] => {
  const imgs: ImagenGaleria[] = [];
  if (p.foto_dni_anverso_url) imgs.push({ url: p.foto_dni_anverso_url, label: 'DNI · Anverso' });
  if (p.foto_dni_reverso_url) imgs.push({ url: p.foto_dni_reverso_url, label: 'DNI · Reverso' });
  if (p.voucher_url) imgs.push({ url: p.voucher_url, label: 'Voucher de pago' });
  return imgs;
};

const EstadoBadge: React.FC<{ estado: string }> = ({ estado }) => {
  const estilo = estadoStyles[estado] ?? 'bg-gray-50 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${estilo}`}>
      {estado}
    </span>
  );
};

/* ---------- Fila de miniaturas ---------- */

const FilaImagenes: React.FC<{
  galeria: ImagenGaleria[];
  onAbrir: (galeria: ImagenGaleria[], indice: number) => void;
}> = ({ galeria, onAbrir }) => {
  if (galeria.length === 0) {
    return <p className="text-xs text-gray-400 italic">Sin documentos cargados</p>;
  }
  return (
    <div className="flex gap-2 flex-wrap">
      {galeria.map((img, i) => (
        <ImageThumbnail key={img.url} url={img.url} label={img.label} onClick={() => onAbrir(galeria, i)} />
      ))}
    </div>
  );
};

/* ---------- Mini card de beneficiario ---------- */

const BeneficiarioItem: React.FC<{
  beneficiario: PersonaRegistro;
  onAbrirImagen: (galeria: ImagenGaleria[], indice: number) => void;
}> = ({ beneficiario, onAbrirImagen }) => {
  const galeria = galeriaDe(beneficiario);
  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${colorPorNombre(
            beneficiario.nombres
          )}`}
        >
          {iniciales(beneficiario)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{nombreCompleto(beneficiario)}</p>
          <p className="text-xs text-gray-500">
            {beneficiario.tipo_documento} {beneficiario.nro_documento} · {beneficiario.celular}
          </p>
        </div>
      </div>
      <FilaImagenes galeria={galeria} onAbrir={onAbrirImagen} />
    </div>
  );
};

/* ---------- Card de un registro ---------- */

const RegistroCard: React.FC<{ registro: RegistroAseguramiento }> = ({ registro }) => {
  const [expandido, setExpandido] = useState(false);
  const [lightbox, setLightbox] = useState<{ galeria: ImagenGaleria[]; indice: number } | null>(null);
  const { titular, beneficiarios, estado, fecha_hora_local } = registro;

  const galeriaTitular = galeriaDe(titular);
  const totalFotos = galeriaTitular.length + beneficiarios.reduce((acc, b) => acc + galeriaDe(b).length, 0);

  const abrirImagen = (galeria: ImagenGaleria[], indice: number) => setLightbox({ galeria, indice });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${colorPorNombre(
              titular.nombres
            )}`}
          >
            {iniciales(titular)}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-800 truncate">{nombreCompleto(titular)}</h3>
            <p className="text-sm text-gray-500">
              {titular.tipo_documento} {titular.nro_documento}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <EstadoBadge estado={estado} />
          {titular.costo !== undefined && (
            <span className="text-sm font-semibold text-gray-700">S/ {titular.costo}</span>
          )}
        </div>
      </div>

      {/* Info rápida */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {titular.correo}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {titular.celular}
        </span>
        {titular.tipo_atencion && (
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {titular.tipo_atencion}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          {beneficiarios.length} beneficiario{beneficiarios.length === 1 ? '' : 's'}
        </span>
        <span className="text-xs text-gray-400 ml-auto">{fecha_hora_local}</span>
      </div>

      {/* Toggle detalle */}
      <button
        onClick={() => setExpandido((v) => !v)}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600 transition"
      >
        <svg
          className={`w-4 h-4 transition-transform ${expandido ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {expandido ? 'Ocultar detalle' : `Ver detalle y fotos (${totalFotos})`}
      </button>

      {/* Detalle */}
      {expandido && (
        <div className="mt-4 border-t border-gray-100 pt-5 space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Dirección</p>
            <p className="text-sm text-gray-700">{titular.direccion}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Documentos del titular
            </p>
            <FilaImagenes galeria={galeriaTitular} onAbrir={abrirImagen} />
          </div>

          {beneficiarios.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Beneficiarios</p>
              <div className="space-y-3">
                {beneficiarios.map((b, i) => (
                  <BeneficiarioItem key={i} beneficiario={b} onAbrirImagen={abrirImagen} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {lightbox && (
        <ImageLightbox
          imagenes={lightbox.galeria}
          indiceInicial={lightbox.indice}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
};

/* ---------- Página principal ---------- */

const AseguramientosListPage: React.FC<AseguramientosListPageProps> = ({ onVolver }) => {
  const { registros, cantidad, cargando, errorGeneral, recargar } = useListadoAseguramientos();
  const [busqueda, setBusqueda] = useState('');

  const registrosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return registros;
    const q = busqueda.trim().toLowerCase();
    return registros.filter((r) => {
      const nombre = nombreCompleto(r.titular).toLowerCase();
      return nombre.includes(q) || r.titular.nro_documento.includes(q);
    });
  }, [registros, busqueda]);

  return (
    <Layout title="Mi CumpaSeguro" showBackButton={true}>
      <div className="w-full min-w-0 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onVolver}
          className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Registros de aseguramiento</h2>
            <p className="text-sm text-gray-500">
              {cantidad} registro{cantidad === 1 ? '' : 's'} en total
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative w-full sm:w-64">
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o DNI..."
                className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
              />
            </div>
            <button
              onClick={recargar}
              disabled={cargando}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50 whitespace-nowrap"
            >
              Recargar
            </button>
          </div>
        </div>

        {errorGeneral && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 mb-6">
            {errorGeneral}
          </div>
        )}

        {cargando ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No se encontraron registros.</div>
        ) : (
          <div className="space-y-4 pb-8">
            {registrosFiltrados.map((registro) => (
              <RegistroCard key={registro._id} registro={registro} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AseguramientosListPage;