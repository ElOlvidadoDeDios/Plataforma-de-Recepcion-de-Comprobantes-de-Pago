import React, { useContext } from 'react';
import Layout from '../../Layout';
import PersonaForm from '../components/PersonaForm';
import { useAseguramiento } from '../hooks/useAseguramiento';
import { formatFecha } from '../utils';
import { UserRole } from '../../../types/roles';
import { AuthContext } from '../../../contexts/AuthContext';

interface AsegurarPageProps {
  onVolver: () => void;
  onVerLista?: () => void;
  onVerPolizas?: () => void;
}

/* ---------- Tokens de estilo ---------- */

const NAVY = '#1E3A5F';
const NAVY_HOVER = '#16304D';
const SUCCESS = '#2F6B4F';

const AsegurarPage: React.FC<AsegurarPageProps> = ({ onVolver, onVerLista, onVerPolizas }) => {
  const { user } = useContext(AuthContext);
  const {
    titular,
    titularErrores,
    actualizarCampoTitular,
    actualizarFotoTitular,

    incluyeBeneficiario,
    setIncluyeBeneficiario,
    beneficiario,
    beneficiarioErrores,
    actualizarCampoBeneficiario,
    actualizarFotoBeneficiario,

    guardando,
    errorGeneral,
    resultado,

    manejarSubmit,
    reiniciarFormulario,
  } = useAseguramiento();

  // Verificar si el usuario es admin o super admin
  const esAdminOSuperAdmin = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMINISTRADOR;

  /* ---------- Pantalla de éxito ---------- */
  if (resultado) {
    return (
      <Layout title="Mi CumpaSeguro" showBackButton={true}>
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-md p-6 sm:p-8 text-center">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-md mb-4"
            style={{ backgroundColor: '#2F6B4F14' }}
          >
            <svg className="w-7 h-7" style={{ color: SUCCESS }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">Registro guardado</h2>
          <p className="text-sm text-slate-500 mb-6">
            Fecha de registro: {formatFecha(resultado.fechaRegistro)}
          </p>

          <div className="inline-flex flex-col items-center gap-1 px-5 py-3 mb-7 rounded-md border border-slate-200 bg-slate-50">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Código de registro</span>
            <span className="font-mono text-lg font-semibold text-slate-800">{resultado.codigo}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reiniciarFormulario}
              className="px-4 py-2 rounded-md text-white text-sm font-medium transition"
              style={{ backgroundColor: NAVY }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = NAVY_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = NAVY)}
            >
              Registrar otro
            </button>
            <button
              onClick={() => {
                reiniciarFormulario();
                onVolver();
              }}
              className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
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
      <div className="w-full min-w-0 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
          <button
            onClick={() => {
              reiniciarFormulario();
              onVolver();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>

          <div className="flex flex-wrap items-center gap-4">
            {/* Ver Lista - Solo visible para admin y super admin */}
            {esAdminOSuperAdmin && onVerLista && (
              <button
                onClick={onVerLista}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Ver lista de aseguramientos
              </button>
            )}

            {/* Gestión de Pólizas - visible cuando tiene acceso al módulo */}
            {onVerPolizas && (
              <button
                onClick={onVerPolizas}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Gestión de pólizas
              </button>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-1">Asegurar</h2>
        <p className="text-sm text-slate-500 mb-8">
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
          />

          <div className="flex items-center justify-between gap-3 py-4 border-y border-slate-200">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={incluyeBeneficiario}
                onChange={(e) => setIncluyeBeneficiario(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 focus:ring-1"
                style={{ accentColor: NAVY }}
              />
              <span className="text-sm font-medium text-slate-700">
                Agregar beneficiario
              </span>
            </label>
            <span className="text-xs text-slate-400">Opcional</span>
          </div>

          {incluyeBeneficiario && (
            <PersonaForm
              titulo="Datos del beneficiario"
              subtitulo="Ningún campo es obligatorio"
              persona={beneficiario}
              errores={beneficiarioErrores}
              obligatorio={false}
              mostrarVoucher={false}
              mostrarAtencionYCosto={false}
              onChange={actualizarCampoBeneficiario}
              onFoto={actualizarFotoBeneficiario}
            />
          )}

          {errorGeneral && (
            <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
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
              className="px-4 py-2.5 rounded-md border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-6 py-2.5 rounded-md text-white text-sm font-semibold transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
              style={{ backgroundColor: NAVY }}
              onMouseEnter={(e) => !guardando && (e.currentTarget.style.backgroundColor = NAVY_HOVER)}
              onMouseLeave={(e) => !guardando && (e.currentTarget.style.backgroundColor = NAVY)}
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