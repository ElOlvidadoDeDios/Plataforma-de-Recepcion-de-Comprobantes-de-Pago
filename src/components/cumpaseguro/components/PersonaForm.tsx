import React, { ChangeEvent, useState, useEffect } from 'react';
import { PersonaData, PersonaErrors, TipoAtencion } from '../types';
import { soloNumeros } from '../utils';
import { verificarSocioReniec } from '../../../api/geodileApi';

interface PersonaFormProps {
  titulo: string;
  subtitulo?: string;
  persona: PersonaData;
  errores: PersonaErrors;
  obligatorio: boolean;
  mostrarVoucher?: boolean;
  mostrarAtencionYCosto?: boolean;
  onChange: (campo: keyof PersonaData, valor: string) => void;
  onFoto: (campo: 'fotoDniAnverso' | 'fotoDniReverso' | 'fotoVoucher', archivo: File | null) => void;
}

/* ---------- Tokens de estilo ---------- */

const NAVY = '#1E3A5F';
const NAVY_SOFT = '#1E3A5F0D'; // ~5% opacidad, fondo de énfasis
const SUCCESS = '#2F6B4F';
const ERROR = '#B3413E';

const campoBase =
  'w-full min-w-0 rounded-md border bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition focus:outline-none focus:ring-1';

const claseCampo = (tieneError: boolean, deshabilitado: boolean) => {
  if (deshabilitado) {
    return `${campoBase} border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed`;
  }
  if (tieneError) {
    return `${campoBase} border-[${ERROR}] focus:border-[${ERROR}] focus:ring-[${ERROR}]`;
  }
  return `${campoBase} border-slate-300 focus:border-[${NAVY}] focus:ring-[${NAVY}]`;
};

const claseLabel = 'block text-sm font-medium text-slate-700 mb-1';

/* ---------- Encabezado de sub-sección ---------- */

const SeccionHeader: React.FC<{ titulo: string }> = ({ titulo }) => (
  <div className="flex items-center gap-2 mb-4">
    <span className="w-1 h-4 rounded-sm" style={{ backgroundColor: NAVY }} />
    <h4 className="text-sm font-semibold text-slate-700">{titulo}</h4>
  </div>
);

/* ---------- Mensaje de error de campo ---------- */

const ErrorTexto: React.FC<{ mensaje?: string }> = ({ mensaje }) => {
  if (!mensaje) return null;
  return (
    <p className="flex items-center gap-1 text-xs mt-1" style={{ color: ERROR }}>
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      {mensaje}
    </p>
  );
};

const PersonaForm: React.FC<PersonaFormProps> = ({
  titulo,
  subtitulo,
  persona,
  errores,
  obligatorio,
  mostrarVoucher = true,
  mostrarAtencionYCosto = true,
  onChange,
  onFoto,
}) => {
  const [consultandoReniec, setConsultandoReniec] = useState(false);
  const [datosDeReniec, setDatosDeReniec] = useState(false);

  // Consultar RENIEC cuando el DNI tenga 8 dígitos y el tipo sea DNI
  useEffect(() => {
    const consultarReniec = async () => {
      // Solo consultar si es DNI, tiene 8 dígitos y no estamos ya consultando
      if (persona.tipoDoc !== 'DNI' || persona.dni.length !== 8 || consultandoReniec) {
        return;
      }

      setConsultandoReniec(true);
      try {
        const datos = await verificarSocioReniec(persona.dni);

        if (datos) {
          // Autocompletar campos con datos de RENIEC
          onChange('nombre', datos.nombres);
          onChange('apePaterno', datos.apellido_paterno);
          onChange('apeMaterno', datos.apellido_materno);
          setDatosDeReniec(true);
        }
      } catch (error) {
        console.error('Error al consultar RENIEC:', error);
        // Si hay error, permitir edición manual
        setDatosDeReniec(false);
      } finally {
        setConsultandoReniec(false);
      }
    };

    consultarReniec();
  }, [persona.dni, persona.tipoDoc]);

  // Resetear el estado cuando cambie el tipo de documento o el DNI
  useEffect(() => {
    if (persona.tipoDoc !== 'DNI' || persona.dni.length < 8) {
      setDatosDeReniec(false);
    }
  }, [persona.tipoDoc, persona.dni]);

  const manejarArchivo = (campo: 'fotoDniAnverso' | 'fotoDniReverso' | 'fotoVoucher') => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const archivo = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    onFoto(campo, archivo);
  };

  const manejarTipoAtencion = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const valor = e.target.value as TipoAtencion | '';
    onChange('tipoAtencion', valor);
    if (valor === 'Presencial' || valor === 'Virtual') {
      onChange('costo', COSTO_SUGERIDO[valor]);
    }
  };

  const camposDeshabilitados = persona.tipoDoc === 'DNI' && datosDeReniec;

  return (
    <div className="bg-white border border-slate-200 rounded-md p-6 sm:p-8 w-full min-w-0">
      <div className="mb-6 pb-4 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800">{titulo}</h3>
        {subtitulo && <p className="text-sm text-slate-500 mt-0.5">{subtitulo}</p>}
      </div>

      {/* ---------- Identificación ---------- */}
      <SeccionHeader titulo="Identificación" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Tipo de documento */}
        <div className="min-w-0">
          <label className={claseLabel}>Tipo de documento</label>
          <select
            className={claseCampo(false, false)}
            value={persona.tipoDoc}
            onChange={(e) => onChange('tipoDoc', e.target.value)}
          >
            <option value="DNI">DNI</option>
            <option value="CE">Carné de extranjería</option>
            <option value="PASAPORTE">Pasaporte</option>
          </select>
        </div>

        {/* DNI */}
        <div className="min-w-0">
          <label className={claseLabel}>
            N° de documento {obligatorio && <span style={{ color: ERROR }}>*</span>}
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              maxLength={12}
              className={claseCampo(!!errores.dni, false)}
              value={persona.dni}
              onChange={(e) => onChange('dni', soloNumeros(e.target.value))}
              placeholder="Ej. 12345678"
            />
            {consultandoReniec && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 animate-spin" style={{ color: NAVY }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
          <ErrorTexto mensaje={errores.dni} />
          {persona.tipoDoc === 'DNI' && datosDeReniec && (
            <div
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md"
              style={{ color: SUCCESS, backgroundColor: '#2F6B4F14' }}
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Datos verificados con RENIEC
            </div>
          )}
        </div>

        {/* Nombre */}
        <div className="min-w-0">
          <label className={claseLabel}>
            Nombres {obligatorio && <span style={{ color: ERROR }}>*</span>}
          </label>
          <input
            type="text"
            disabled={camposDeshabilitados}
            className={claseCampo(!!errores.nombre, camposDeshabilitados)}
            value={persona.nombre}
            onChange={(e) => onChange('nombre', e.target.value)}
            placeholder="Nombres"
          />
          <ErrorTexto mensaje={errores.nombre} />
        </div>

        {/* Apellido paterno */}
        <div className="min-w-0">
          <label className={claseLabel}>
            Apellido paterno {obligatorio && <span style={{ color: ERROR }}>*</span>}
          </label>
          <input
            type="text"
            disabled={camposDeshabilitados}
            className={claseCampo(!!errores.apePaterno, camposDeshabilitados)}
            value={persona.apePaterno}
            onChange={(e) => onChange('apePaterno', e.target.value)}
            placeholder="Apellido paterno"
          />
          <ErrorTexto mensaje={errores.apePaterno} />
        </div>

        {/* Apellido materno */}
        <div className="min-w-0">
          <label className={claseLabel}>
            Apellido materno {obligatorio && <span style={{ color: ERROR }}>*</span>}
          </label>
          <input
            type="text"
            disabled={camposDeshabilitados}
            className={claseCampo(!!errores.apeMaterno, camposDeshabilitados)}
            value={persona.apeMaterno}
            onChange={(e) => onChange('apeMaterno', e.target.value)}
            placeholder="Apellido materno"
          />
          <ErrorTexto mensaje={errores.apeMaterno} />
        </div>
      </div>

      {/* ---------- Contacto ---------- */}
      <div className="mt-8 pt-8 border-t border-slate-100">
        <SeccionHeader titulo="Contacto" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Dirección */}
          <div className="min-w-0 sm:col-span-2 lg:col-span-3">
            <label className={claseLabel}>
              Dirección {obligatorio && <span style={{ color: ERROR }}>*</span>}
            </label>
            <input
              type="text"
              className={claseCampo(!!errores.direccion, false)}
              value={persona.direccion}
              onChange={(e) => onChange('direccion', e.target.value)}
              placeholder="Dirección completa"
            />
            <ErrorTexto mensaje={errores.direccion} />
          </div>

          {/* Correo */}
          <div className="min-w-0">
            <label className={claseLabel}>
              Correo {obligatorio && <span style={{ color: ERROR }}>*</span>}
            </label>
            <input
              type="email"
              className={claseCampo(!!errores.correo, false)}
              value={persona.correo}
              onChange={(e) => onChange('correo', e.target.value)}
              placeholder="correo@ejemplo.com"
            />
            <ErrorTexto mensaje={errores.correo} />
          </div>

          {/* Celular */}
          <div className="min-w-0">
            <label className={claseLabel}>
              Celular {obligatorio && <span style={{ color: ERROR }}>*</span>}
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={9}
              className={claseCampo(!!errores.celular, false)}
              value={persona.celular}
              onChange={(e) => onChange('celular', soloNumeros(e.target.value))}
              placeholder="9XXXXXXXX"
            />
            <ErrorTexto mensaje={errores.celular} />
          </div>
        </div>
      </div>

      {/* ---------- Información del aseguramiento ---------- */}
      {mostrarAtencionYCosto && (
        <div className="mt-8 pt-8 border-t border-slate-100">
          <SeccionHeader titulo="Información del aseguramiento" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="min-w-0">
              <label className={claseLabel}>
                Tipo de atención {obligatorio && <span style={{ color: ERROR }}>*</span>}
              </label>
              <select
                className={claseCampo(!!errores.tipoAtencion, false)}
                value={persona.tipoAtencion}
                onChange={manejarTipoAtencion}
              >
                <option value="">Selecciona una opción</option>
                <option value="Presencial">Presencial</option>
                <option value="Virtual">Virtual</option>
              </select>
              <ErrorTexto mensaje={errores.tipoAtencion} />
            </div>

            <div
              className="min-w-0 rounded-md border p-3"
              style={{ borderColor: `${NAVY}33`, backgroundColor: NAVY_SOFT }}
            >
              <label className={claseLabel}>
                Costo (S/) {obligatorio && <span style={{ color: ERROR }}>*</span>}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                  S/
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={`${claseCampo(!!errores.costo, false)} pl-8 font-semibold`}
                  value={persona.costo}
                  onChange={(e) => onChange('costo', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Sugerido: S/140 presencial, S/80 virtual. Puedes editarlo.
              </p>
              <ErrorTexto mensaje={errores.costo} />
            </div>
          </div>
        </div>
      )}

      {/* ---------- Documentación ---------- */}
      <div className="mt-8 pt-8 border-t border-slate-100">
        <SeccionHeader titulo="Documentación" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(
            [
              { campo: 'fotoDniAnverso' as const, label: 'Foto DNI (anverso)' },
              { campo: 'fotoDniReverso' as const, label: 'Foto DNI (reverso)' },
            ]
          ).map(({ campo, label }) => {
            const preview =
              persona[`${campo}Preview` as 'fotoDniAnversoPreview' | 'fotoDniReversoPreview' | 'fotoVoucherPreview'];
            const tieneError = !!errores[campo];
            return (
              <div key={campo} className="min-w-0">
                <label
                  className={`group relative flex flex-col items-center justify-center w-full h-32 sm:h-36 rounded-md border cursor-pointer overflow-hidden bg-slate-50 transition ${
                    tieneError
                      ? 'border-solid'
                      : preview
                      ? 'border-solid border-slate-300 hover:border-slate-400'
                      : 'border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-100'
                  }`}
                  style={tieneError ? { borderColor: ERROR } : undefined}
                >
                  {preview ? (
                    <>
                      <img src={preview} alt={label} className="w-full h-full object-contain bg-white" />
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/55 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-white px-3 py-1.5 rounded-md border border-white/40">
                          Reemplazar imagen
                        </span>
                      </div>
                      <span
                        className="absolute top-1.5 right-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-white"
                        style={{ backgroundColor: SUCCESS }}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 px-2 text-center">
                      <svg className="w-7 h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16 7l-4-4m0 0L8 7m4-4v13"
                        />
                      </svg>
                      <span className="text-xs">Toca para subir foto</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={manejarArchivo(campo)}
                  />
                </label>
                <ErrorTexto mensaje={errores[campo]} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Montos sugeridos según el tipo de atención. El costo siempre queda editable
// para el usuario; esto solo prellena un valor de referencia.
const COSTO_SUGERIDO: Record<TipoAtencion, string> = {
  Presencial: '140',
  Virtual: '80',
};

export default PersonaForm;