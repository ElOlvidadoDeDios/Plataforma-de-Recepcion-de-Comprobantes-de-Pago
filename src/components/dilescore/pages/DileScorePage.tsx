import React, { useEffect, useState } from 'react';
import Layout from '../../Layout';
import { useAuth } from '../../../hooks/useAuth';
import { useCombinedPermissions } from '../../../hooks/useCombinedPermissions';
import { useDileScore } from '../hooks/useDileScore';
import { buildDileScorePayloadMock } from '../services/dileScore.Service';
import { DileScoreAutoData, DileScoreInputData, DileScorePayload } from '../types';
import { AGENCIAS } from '../../../types';
import { useComboBoxData } from '../../../api/registroDeclientesApi';
import { generarScorePdf } from './pdf_score';

const INITIAL_INPUT_DATA: DileScoreInputData = {
  DNI: '',
  MONTO_PRESTAMO: '',
  CUOTAS: '',
  CUOTA_FIJA: '',
  FINALIDAD_PRESTAMO: '',
  TIPO_DESTINO: 'Capital de Trabajo',
  SUBTIPO_PRES: 'MICRO EMPRESAS',
  TIPO_PRODUCTO: 'MAS_INCLUSIVO',
  FRECUENCIA_PAGO: '',
  AGENCIA_NOMBRE: '',
};

const PRODUCT_OPTIONS = [
  { value: 'MAS_INCLUSIVO', label: 'MAS_INCLUSIVO' },
  { value: 'MAS_INCLUSIVO_SEMANAL', label: 'MAS_INCLUSIVO_SEMANAL' },
];

const FINALIDAD_PRESTAMO_OPTIONS = [
  { value: 'Agropecuarios', label: 'Agropecuarios' },
  { value: 'Comercio', label: 'Comercio' },
  { value: 'Industria', label: 'Industria' },
  { value: 'Otros', label: 'Otros' },
  { value: 'Servicios', label: 'Servicios' },
];

const FRECUENCIA_PAGO_OPTIONS = [
  { value: 'DIAS', label: 'DIAS' },
  { value: 'SEMANAS', label: 'SEMANAS' },
];

const AUTO_FIELD_ORDER: Array<keyof DileScoreAutoData> = [
  'TIPO_SOCIO',
  'RAZON_SOCIAL',
  'MESES_ANTIGUEDAD',
  'EDAD_ANIOS',
  'LUGAR_NAC',
  'TIPO_PERSONA',
  'TIPO_VIVIENDA',
  'ESTADO_CIVIL',
  'NIVEL_INSTRUCCION',
  'PROFESION',
  'NACIONALIDAD',
  'ACTIVIDAD_ECONOMICA',
  'TIENE_AHORRO',
];

const AUTO_SELECT_FIELDS = [
  'TIPO_PERSONA',
  'TIPO_VIVIENDA',
  'ESTADO_CIVIL',
  'NIVEL_INSTRUCCION',
  'PROFESION',
  'NACIONALIDAD',
  'ACTIVIDAD_ECONOMICA',
] as const;

type AutoSelectField = typeof AUTO_SELECT_FIELDS[number];

const createEmptyAutoData = (): DileScoreAutoData => ({
  TIPO_SOCIO: '',
  RAZON_SOCIAL: '',
  MESES_ANTIGUEDAD: '',
  EDAD_ANIOS: '',
  LUGAR_NAC: '',
  TIPO_PERSONA: '',
  TIPO_VIVIENDA: '',
  ESTADO_CIVIL: '',
  NIVEL_INSTRUCCION: '',
  PROFESION: '',
  NACIONALIDAD: '',
  ACTIVIDAD_ECONOMICA: '',
  TIENE_AHORRO: '',
});

const INPUT_FIELD_ORDER: Array<keyof DileScoreInputData> = [
  'MONTO_PRESTAMO',
  'CUOTAS',
  'CUOTA_FIJA',
  'FINALIDAD_PRESTAMO',
  'TIPO_DESTINO',
  'SUBTIPO_PRES',
  'TIPO_PRODUCTO',
  'FRECUENCIA_PAGO',
  'AGENCIA_NOMBRE',
];

const FIELD_LABELS: Partial<Record<string, string>> = {
  DNI: 'DNI',
  TIPO_SOCIO: 'Tipo de socio',
  RAZON_SOCIAL: 'Razón social',
  MESES_ANTIGUEDAD: 'Meses antiguedad',
  EDAD_ANIOS: 'Edad en años',
  LUGAR_NAC: 'Lugar nacimiento',
  TIPO_PERSONA: 'Tipo persona',
  TIPO_VIVIENDA: 'Tipo vivienda',
  ESTADO_CIVIL: 'Estado civil',
  NIVEL_INSTRUCCION: 'Nivel instruccion',
  ACTIVIDAD_ECONOMICA: 'Actividad economica',
  TIENE_AHORRO: 'Tiene ahorro',
  MONTO_PRESTAMO: 'Monto prestamo',
  CUOTAS: 'Cuotas',
  CUOTA_FIJA: 'Cuota fija',
  FINALIDAD_PRESTAMO: 'Finalidad prestamo',
  TIPO_DESTINO: 'Tipo destino',
  SUBTIPO_PRES: 'Subtipo pres',
  TIPO_PRODUCTO: 'Tipo producto',
  FRECUENCIA_PAGO: 'Frecuencia pago',
  AGENCIA_NOMBRE: 'Agencia nombre',
};

const getFieldLabel = (field: string): string => {
  return FIELD_LABELS[field] ?? field;
};

const DileScorePage: React.FC = () => {
  const { user } = useAuth();
  const { canAccessDileScore } = useCombinedPermissions();
  const { comboData, error: comboError } = useComboBoxData();
  const {
    loading,
    infoLoading,
    scoreLoading,
    error,
    infoError,
    scoreResponse,
    consultarInfoDocumento,
    submitScorePayload,
    limpiar,
  } = useDileScore();
  const [inputData, setInputData] = useState<DileScoreInputData>(INITIAL_INPUT_DATA);
  const [autoData, setAutoData] = useState<DileScoreAutoData | null>(null);
  const [apiAutoData, setApiAutoData] = useState<DileScoreAutoData | null>(null);
  const [apiSupplementalData, setApiSupplementalData] = useState<Record<string, string | number | null>>({});
  const [payloadPreview, setPayloadPreview] = useState<DileScorePayload | null>(null);

  const userAgencyCode = user?.id_age || '';
  const userAgencyName = userAgencyCode
    ? Object.entries(AGENCIAS).find(([_, code]) => code === userAgencyCode)?.[0] || userAgencyCode
    : '';

  useEffect(() => {
    if (!userAgencyName) return;

    setInputData((prev) => {
      if (prev.AGENCIA_NOMBRE) return prev;
      return {
        ...prev,
        AGENCIA_NOMBRE: userAgencyName,
      };
    });
  }, [userAgencyName]);

  if (!canAccessDileScore()) {
    return (
      <Layout title="Acceso Denegado" showBackButton={true}>
        <div className="flex h-full items-center justify-center rounded-lg bg-red-50 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Acceso Denegado</h2>
            <p className="mt-2 text-red-500">No tienes permisos para acceder a DileScore.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const handleFieldChange = (field: keyof DileScoreInputData, value: string) => {
    if (field === 'DNI') {
      setInputData((prev) => ({ ...prev, DNI: value.replace(/\D/g, '').slice(0, 8) }));
      return;
    }

    setInputData((prev) => ({ ...prev, [field]: value }));
  };

  const isAutoSelectField = (field: keyof DileScoreAutoData): field is AutoSelectField => {
    return (AUTO_SELECT_FIELDS as readonly string[]).includes(field);
  };

  const getComboOptions = (field: typeof AUTO_SELECT_FIELDS[number]) => {
    if (!comboData) return [] as Array<{ value: string; label: string }>;

    switch (field) {
      case 'TIPO_PERSONA':
        return (comboData.TIPO_PERSONA ?? []).map((item) => ({ value: item.NOM_TPERSONA, label: item.NOM_TPERSONA }));
      case 'TIPO_VIVIENDA':
        return (comboData.TIPO_VIVIENDA ?? []).map((item) => ({ value: item.NOM_VIVIENDA, label: item.NOM_VIVIENDA }));
      case 'ESTADO_CIVIL':
        return (comboData.ESTADO_CIVIL ?? []).map((item) => ({ value: item.NOM_ECIVIL, label: item.NOM_ECIVIL }));
      case 'NIVEL_INSTRUCCION':
        return (comboData.NIVEL_INSTRUCCION ?? []).map((item) => ({ value: item.NOM_TINSTRUC, label: item.NOM_TINSTRUC }));
      case 'PROFESION':
        return (comboData.TIPO_PROFESION ?? []).map((item) => ({ value: item.NOM_TPROF, label: item.NOM_TPROF }));
      case 'NACIONALIDAD':
        return (comboData.NACIONALIDAD ?? []).map((item) => ({ value: item.NOM_NAC, label: item.NOM_NAC }));
      case 'ACTIVIDAD_ECONOMICA':
        return (comboData.ACTIVIDAD_ECONOMICA ?? []).map((item) => ({ value: item.NOM_ACTI, label: item.NOM_ACTI }));
      default:
        return [];
    }
  };

  const wasProvidedByApi = (field: keyof DileScoreAutoData): boolean => {
    if (field === 'TIPO_SOCIO' || field === 'RAZON_SOCIAL') return true;
    const value = apiAutoData?.[field];
    return Boolean((value || '').toString().trim());
  };

  const handleLoadAutoData = async () => {
    const dni = inputData.DNI.trim();
    if (!dni) {
      return;
    }

    const result = await consultarInfoDocumento(dni);
    const data = result.autoData;
    const normalizedData = {
      ...data,
      TIPO_SOCIO: (data.TIPO_SOCIO || '').trim() || 'SOCIO NORMAL',
      RAZON_SOCIAL: (data.RAZON_SOCIAL || '').trim(),
    };

    setApiSupplementalData(result.supplementalData || {});
    setApiAutoData(normalizedData);
    setAutoData(normalizedData);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!autoData) {
      return;
    }

    const payload = buildDileScorePayloadMock(inputData, autoData, apiSupplementalData);
    setPayloadPreview(payload);

    await submitScorePayload(payload);
  };

  const handleClear = () => {
    setInputData(INITIAL_INPUT_DATA);
    setAutoData(null);
    setApiAutoData(null);
    setApiSupplementalData({});
    setPayloadPreview(null);
    limpiar();
  };

  const handleExportPdf = () => {
    const fechaHoy = new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
    const dni = inputData.DNI.trim() || 'SIN_DNI';

    generarScorePdf({
      dni,
      inputData,
      autoData: autoData || createEmptyAutoData(),
      resultado: scoreResponse && typeof scoreResponse === 'object' ? (scoreResponse as Record<string, unknown>) : {},
      nombreArchivo: `score_${dni}_${fechaHoy.replace(/\//g, '-')}.pdf`,
    });
  };

  return (
    <Layout title="DileScore" showBackButton={true}>
      <div className="w-full space-y-6">
        <div className="rounded-xl bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 p-6 text-white shadow-lg">
          <h1 className="text-center text-2xl font-bold">Consulta de score de socio</h1>
          <p className="mt-2 text-sm text-white/90">
            Primero obtén los datos automáticos con el DNI y luego completa los campos manuales.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-1">
            <div className="mb-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              El flujo es de dos pasos: consulta el DNI para cargar los datos automáticos y luego completa los campos manuales.
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label htmlFor="DNI" className="mb-1 block text-xs font-semibold text-slate-700">
                  DNI
                </label>
                <input
                  id="DNI"
                  type="text"
                  value={inputData.DNI}
                  onChange={(e) => handleFieldChange('DNI', e.target.value)}
                  maxLength={8}
                  placeholder="Ejemplo: 12345678"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="button"
                onClick={handleLoadAutoData}
                disabled={infoLoading || inputData.DNI.trim().length !== 8}
                className="self-end rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {infoLoading ? 'Buscando...' : 'Obtener datos'}
              </button>
            </div>

            {infoError && (
              <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{infoError}</p>
            )}

            {comboError && (
              <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">No se pudieron cargar los catálogos: {comboError}</p>
            )}

            <div className="mt-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-800">Datos automáticos</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {AUTO_FIELD_ORDER.map((field) => (
                  <div key={field} className={field === 'TIPO_SOCIO' || field === 'RAZON_SOCIAL' ? 'sm:col-span-1' : ''}>
                    <label htmlFor={field} className="mb-1 block text-xs font-semibold text-slate-700">
                      {getFieldLabel(field)}
                    </label>
                    {field === 'TIPO_SOCIO' ? (
                      <input
                        id={field}
                        type="text"
                        value={autoData?.TIPO_SOCIO || 'SOCIO NORMAL'}
                        readOnly
                        className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 outline-none"
                      />
                    ) : field === 'RAZON_SOCIAL' ? (
                      <input
                        id={field}
                        type="text"
                        value={autoData?.RAZON_SOCIAL || ''}
                        readOnly
                        className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 outline-none"
                      />
                    ) : wasProvidedByApi(field) ? (
                      <input
                        id={field}
                        type="text"
                        value={autoData?.[field] ?? ''}
                        readOnly
                        className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 outline-none"
                      />
                    ) : isAutoSelectField(field) ? (
                      <select
                        id={field}
                        value={autoData?.[field] || ''}
                        onChange={(e) => {
                          setAutoData((prev) => ({
                            ...(prev || createEmptyAutoData()),
                            [field]: e.target.value,
                          }));
                        }}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                      >
                        <option value="">Seleccione una opción</option>
                        {getComboOptions(field).map((option, index) => (
                          <option key={`${field}-${option.value}-${index}`} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={field}
                        type="text"
                        value={autoData?.[field] ?? ''}
                        onChange={(e) => {
                          const nextValue = field === 'LUGAR_NAC'
                            ? e.target.value.toUpperCase()
                            : e.target.value;

                          setAutoData((prev) => ({
                            ...(prev || createEmptyAutoData()),
                            [field]: nextValue,
                          }));
                        }}
                        placeholder={field === 'LUGAR_NAC' ? 'Ingrese lugar de nacimiento en mayusculas' : 'Ingresa el dato manualmente'}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <h2 className="mb-2 text-sm font-semibold text-slate-800">Datos manuales</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {INPUT_FIELD_ORDER.map((field) => (
                  <div key={field} className={field === 'AGENCIA_NOMBRE' ? 'sm:col-span-2' : ''}>
                    <label htmlFor={field} className="mb-1 block text-xs font-semibold text-slate-700">
                      {getFieldLabel(field)}
                    </label>
                    {field === 'TIPO_DESTINO' || field === 'SUBTIPO_PRES' ? (
                      <input
                        id={field}
                        type="text"
                        value={inputData[field]}
                        readOnly
                        className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 outline-none"
                      />
                    ) : field === 'FINALIDAD_PRESTAMO' ? (
                      <select
                        id={field}
                        value={inputData[field]}
                        onChange={(e) => handleFieldChange(field, e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                      >
                        <option value="">Seleccione una opción</option>
                        {FINALIDAD_PRESTAMO_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : field === 'FRECUENCIA_PAGO' ? (
                      <select
                        id={field}
                        value={inputData[field]}
                        onChange={(e) => handleFieldChange(field, e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                      >
                        <option value="">Seleccione una opción</option>
                        {FRECUENCIA_PAGO_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : field === 'TIPO_PRODUCTO' ? (
                      <select
                        id={field}
                        value={inputData[field]}
                        onChange={(e) => handleFieldChange(field, e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                      >
                        {PRODUCT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={field}
                        type="text"
                        value={inputData[field]}
                        onChange={(e) => handleFieldChange(field, e.target.value)}
                        placeholder={`Ingrese ${getFieldLabel(field).toLowerCase()}`}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading || scoreLoading || !autoData}
                className="rounded-lg bg-sky-600 px-5 py-2 font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading || scoreLoading ? 'Consultando...' : 'Consultar score'}
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={!autoData && !scoreResponse}
                className="rounded-lg border border-emerald-600 bg-emerald-50 px-5 py-2 font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Exportar PDF
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg border border-slate-300 px-5 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Limpiar
              </button>
            </div>

            {!autoData && (
              <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Primero pulsa <span className="font-semibold">Obtener datos</span> con el DNI.
              </p>
            )}

            {error && (
              <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
            )}
          </form>

          <div className="xl:col-span-2">
            {scoreResponse !== null && typeof scoreResponse === 'object' ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Resultado real del API</h3>
                    <p className="text-sm text-slate-500">Respuesta obtenida desde /score</p>
                  </div>
                  {'decision' in scoreResponse && (
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                      {(scoreResponse as { decision?: string }).decision}
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Score</p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">
                      {'score' in scoreResponse ? (scoreResponse as { score?: number }).score : '-'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Threshold usado</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {'threshold_usado' in scoreResponse ? (scoreResponse as { threshold_usado?: number }).threshold_usado : '-'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Grado</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {'grado' in scoreResponse ? (scoreResponse as { grado?: string }).grado : '-'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Producto</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {'producto' in scoreResponse ? (scoreResponse as { producto?: string }).producto : '-'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Versión modelo</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {'version_modelo' in scoreResponse ? (scoreResponse as { version_modelo?: string }).version_modelo : '-'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Decisión</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {'decision' in scoreResponse ? (scoreResponse as { decision?: string }).decision : '-'}
                  </p>
                </div>

              </div>
            ) : (
              <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                <div>
                  <p className="text-base font-medium text-slate-700">Aun no hay resultado</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Ingresa el DNI, obtiene los datos automáticos y luego completa los campos manuales para ver el score.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DileScorePage;
