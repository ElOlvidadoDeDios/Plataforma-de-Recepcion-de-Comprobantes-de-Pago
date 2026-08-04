import React, { ChangeEvent } from 'react';
import { PersonaData, PersonaErrors, TipoAtencion } from '../types';
import { soloNumeros } from '../utils';

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

const campoBase =
  'w-full min-w-0 rounded-lg border px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition';

// Montos sugeridos según el tipo de atención. El costo siempre queda editable
// para el usuario; esto solo prellena un valor de referencia.
const COSTO_SUGERIDO: Record<TipoAtencion, string> = {
  Presencial: '140',
  Virtual: '80',
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

  return (
    <div className="bg-white rounded-lg shadow p-5 sm:p-7 w-full min-w-0">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-gray-800">{titulo}</h3>
        {subtitulo && <p className="text-sm text-gray-500">{subtitulo}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Tipo de documento */}
        <div className="min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de documento</label>
          <select
            className={campoBase}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            N° de documento {obligatorio && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={12}
            className={`${campoBase} ${errores.dni ? 'border-red-400' : 'border-gray-300'}`}
            value={persona.dni}
            onChange={(e) => onChange('dni', soloNumeros(e.target.value))}
            placeholder="Ej. 12345678"
          />
          {errores.dni && <p className="text-xs text-red-500 mt-1">{errores.dni}</p>}
        </div>

        {/* Nombre */}
        <div className="min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombres {obligatorio && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            className={`${campoBase} ${errores.nombre ? 'border-red-400' : 'border-gray-300'}`}
            value={persona.nombre}
            onChange={(e) => onChange('nombre', e.target.value)}
            placeholder="Nombres"
          />
          {errores.nombre && <p className="text-xs text-red-500 mt-1">{errores.nombre}</p>}
        </div>

        {/* Apellido paterno */}
        <div className="min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apellido paterno {obligatorio && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            className={`${campoBase} ${errores.apePaterno ? 'border-red-400' : 'border-gray-300'}`}
            value={persona.apePaterno}
            onChange={(e) => onChange('apePaterno', e.target.value)}
            placeholder="Apellido paterno"
          />
          {errores.apePaterno && <p className="text-xs text-red-500 mt-1">{errores.apePaterno}</p>}
        </div>

        {/* Apellido materno */}
        <div className="min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apellido materno {obligatorio && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            className={`${campoBase} ${errores.apeMaterno ? 'border-red-400' : 'border-gray-300'}`}
            value={persona.apeMaterno}
            onChange={(e) => onChange('apeMaterno', e.target.value)}
            placeholder="Apellido materno"
          />
          {errores.apeMaterno && <p className="text-xs text-red-500 mt-1">{errores.apeMaterno}</p>}
        </div>

        {/* Tipo de atención + Costo: solo para quien corresponda (titular) */}
        {mostrarAtencionYCosto && (
          <>
            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de atención {obligatorio && <span className="text-red-500">*</span>}
              </label>
              <select
                className={`${campoBase} ${errores.tipoAtencion ? 'border-red-400' : 'border-gray-300'}`}
                value={persona.tipoAtencion}
                onChange={manejarTipoAtencion}
              >
                <option value="">Selecciona una opción</option>
                <option value="Presencial">Presencial</option>
                <option value="Virtual">Virtual</option>
              </select>
              {errores.tipoAtencion && <p className="text-xs text-red-500 mt-1">{errores.tipoAtencion}</p>}
            </div>

            <div className="min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo (S/) {obligatorio && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                className={`${campoBase} ${errores.costo ? 'border-red-400' : 'border-gray-300'}`}
                value={persona.costo}
                onChange={(e) => onChange('costo', e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-400 mt-1">
                Sugerido: S/140 presencial, S/80 virtual. Puedes editarlo.
              </p>
              {errores.costo && <p className="text-xs text-red-500 mt-1">{errores.costo}</p>}
            </div>
          </>
        )}

        {/* Dirección */}
        <div className="min-w-0 sm:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección {obligatorio && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            className={`${campoBase} ${errores.direccion ? 'border-red-400' : 'border-gray-300'}`}
            value={persona.direccion}
            onChange={(e) => onChange('direccion', e.target.value)}
            placeholder="Dirección completa"
          />
          {errores.direccion && <p className="text-xs text-red-500 mt-1">{errores.direccion}</p>}
        </div>

        {/* Correo */}
        <div className="min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correo {obligatorio && <span className="text-red-500">*</span>}
          </label>
          <input
            type="email"
            className={`${campoBase} ${errores.correo ? 'border-red-400' : 'border-gray-300'}`}
            value={persona.correo}
            onChange={(e) => onChange('correo', e.target.value)}
            placeholder="correo@ejemplo.com"
          />
          {errores.correo && <p className="text-xs text-red-500 mt-1">{errores.correo}</p>}
        </div>

        {/* Celular */}
        <div className="min-w-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Celular {obligatorio && <span className="text-red-500">*</span>}
          </label>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={9}
            className={`${campoBase} ${errores.celular ? 'border-red-400' : 'border-gray-300'}`}
            value={persona.celular}
            onChange={(e) => onChange('celular', soloNumeros(e.target.value))}
            placeholder="9XXXXXXXX"
          />
          {errores.celular && <p className="text-xs text-red-500 mt-1">{errores.celular}</p>}
        </div>
      </div>

      {/* Fotos del DNI y comprobante de pago */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
        {(
          [
            { campo: 'fotoDniAnverso' as const, label: 'Foto DNI (anverso)' },
            { campo: 'fotoDniReverso' as const, label: 'Foto DNI (reverso)' },
            ...(mostrarVoucher
              ? [{ campo: 'fotoVoucher' as const, label: 'Comprobante de pago (voucher)' }]
              : []),
          ]
        ).map(({ campo, label }) => (
          <div key={campo} className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label} {obligatorio && <span className="text-red-500">*</span>}
            </label>
            <label
              className={`flex flex-col items-center justify-center w-full h-32 sm:h-36 rounded-lg border-2 border-dashed cursor-pointer overflow-hidden bg-gray-50 hover:bg-gray-100 transition ${
                errores[campo] ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              {persona[`${campo}Preview` as 'fotoDniAnversoPreview' | 'fotoDniReversoPreview' | 'fotoVoucherPreview'] ? (
                <img
                  src={persona[`${campo}Preview` as 'fotoDniAnversoPreview' | 'fotoDniReversoPreview' | 'fotoVoucherPreview']}
                  alt={label}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-400 px-2 text-center">
                  <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            {errores[campo] && <p className="text-xs text-red-500 mt-1">{errores[campo]}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonaForm;