import React from 'react';
import Layout from '../../Layout';
import PersonaForm from '../components/PersonaForm';
import { useAseguramiento } from '../hooks/useAseguramiento';
import { formatFecha } from '../utils';

interface AsegurarPageProps {
  onVolver: () => void;
}

const AsegurarPage: React.FC<AsegurarPageProps> = ({ onVolver }) => {
  const {
    titular,
    titularErrores,
    actualizarCampoTitular,
    actualizarFotoTitular,
    actualizarSinDocumentoTitular,

    incluyeBeneficiario,
    setIncluyeBeneficiario,
    beneficiario,
    beneficiarioErrores,
    actualizarCampoBeneficiario,
    actualizarFotoBeneficiario,
    actualizarSinDocumentoBeneficiario,

    guardando,
    errorGeneral,
    resultado,

    manejarSubmit,
    reiniciarFormulario,
  } = useAseguramiento();

  /* ---------- Pantalla de éxito ---------- */
  if (resultado) {
    return (
      <Layout title="Mi CumpaSeguro" showBackButton={true}>
        <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6 sm:p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Registro guardado</h2>
          <p className="text-sm text-gray-500 mb-4">
            Código: <span className="font-mono font-semibold">{resultado.codigo}</span>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Fecha de registro: {formatFecha(resultado.fechaRegistro)}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reiniciarFormulario}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition"
            >
              Registrar otro
            </button>
            <button
              onClick={() => {
                reiniciarFormulario();
                onVolver();
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  /* ---------- Formulario ---------- */
  return (
    <Layout title="Mi CumpaSeguro" showBackButton={true}>
      <div className="w-full min-w-0">
        <button
          onClick={() => {
            reiniciarFormulario();
            onVolver();
          }}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-1">Asegurar</h2>
        <p className="text-sm text-gray-500 mb-8">
          Completa los datos del titular. El beneficiario es opcional.
        </p>

        <form onSubmit={manejarSubmit} className="space-y-8">
          <PersonaForm
            titulo="Datos del titular"
            subtitulo="Todos los campos son obligatorios"
            persona={titular}
            errores={titularErrores}
            obligatorio={true}
            onChange={actualizarCampoTitular}
            onFoto={actualizarFotoTitular}
            onSinDocumento={actualizarSinDocumentoTitular}
          />

          <div className="bg-white rounded-lg shadow p-5 sm:p-6">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={incluyeBeneficiario}
                onChange={(e) => setIncluyeBeneficiario(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-400"
              />
              <span className="text-sm font-medium text-gray-700">
                Agregar beneficiario (opcional)
              </span>
            </label>
          </div>

          {incluyeBeneficiario && (
            <PersonaForm
              titulo="Datos del beneficiario"
              subtitulo="Ningún campo es obligatorio"
              persona={beneficiario}
              errores={beneficiarioErrores}
              obligatorio={false}
              mostrarVoucher={false}
              onChange={actualizarCampoBeneficiario}
              onFoto={actualizarFotoBeneficiario}
              onSinDocumento={actualizarSinDocumentoBeneficiario}
            />
          )}

          {errorGeneral && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3">
              {errorGeneral}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pb-8">
            <button
              type="button"
              onClick={() => {
                reiniciarFormulario();
                onVolver();
              }}
              disabled={guardando}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-6 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {guardando && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AsegurarPage;