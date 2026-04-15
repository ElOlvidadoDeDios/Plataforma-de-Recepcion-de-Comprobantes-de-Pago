import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import type { SocioMora } from '../services/gestios_recuperadores.service';
import { saveGestionMora } from '../services/gestios_recuperadores.service';
import { AGENCIAS } from '../../../types';

interface Props {
  socio: SocioMora;
  onClose: () => void;
}

const GestionarSocioModal = ({ socio, onClose }: Props) => {
  const { user } = useAuth();
  const { CREDITO_MORA } = socio;
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  //const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    MOTIVO: '',
    COMPROMISO: '',
    FECHA_COMPROMISO: '',
    SITUACION_SOCIO: 'HABIDO',
    INTENCION_PAGO: 'SI',
    OBSERVACION: '',
  });

  const isHabido = form.SITUACION_SOCIO === 'HABIDO';
  const intencionPagoSI = form.INTENCION_PAGO === 'SI';

  // Mostrar campos de motivo/compromiso/fecha solo si: HABIDO + intención SI
  const showCamposGestion = isHabido && intencionPagoSI;

  // Mostrar observación si: HABIDO + intención NO, o cualquier otro estado
  const showObservacion = (isHabido && !intencionPagoSI) || !isHabido;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (showCamposGestion) {
      if (!form.MOTIVO.trim()) {
        setError('El motivo de retraso es obligatorio.');
        return;
      }
      if (!form.COMPROMISO.trim()) {
        setError('El compromiso es obligatorio.');
        return;
      }
      if (!form.FECHA_COMPROMISO) {
        setError('La fecha de compromiso es obligatoria.');
        return;
      }
    }

    if (showObservacion && !form.OBSERVACION.trim()) {
      setError('La observación es obligatoria.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const gestionData = {
        PAGARE: CREDITO_MORA.PAGARE,
        CUENTA: CREDITO_MORA.CUENTA,
        OTORGA: CREDITO_MORA.OTORGA,
        MOTIVO: form.MOTIVO || '',
        COMPROMISO: form.COMPROMISO || ' ',
        FECHA_COMPROMISO: form.FECHA_COMPROMISO || '',
        SITUACION_SOCIO: form.SITUACION_SOCIO,
        INTENCION_PAGO: isHabido ? form.INTENCION_PAGO : '',
        OBSERVACION: showObservacion ? form.OBSERVACION : '',
        REGISTRADOR: user?.dni || '',
        NOMBRE_A: (user?.razon || '').replace(/,/g, ''),
        AGENCIA:
          Object.keys(AGENCIAS).find(
            (key) => AGENCIAS[key as keyof typeof AGENCIAS] === user?.id_age
          ) ||
          user?.id_age ||
          '',
      };

      const response = await saveGestionMora(gestionData);

      if (response.status) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(response.message || 'Error al guardar la gestión');
      }
    } catch (err: any) {
      console.error('Error al guardar gestión:', err);
      setError(err.response?.data?.message || err.message || 'Error al guardar la gestión');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-2xl w-full max-w-full md:max-w-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <h2 className="font-bold text-gray-800">Registrar gestión</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">Situación del socio:</span>
                <select
                  name="SITUACION_SOCIO"
                  value={form.SITUACION_SOCIO}
                  onChange={handleChange}
                  className="px-3 py-1 text-xs font-medium rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSaving || success}
                >
                  <option value="HABIDO">✅ HABIDO</option>
                  <option value="NO HABIDO">❌ NO HABIDO</option>
                  <option value="NO UBICADO">⚠️ NO UBICADO</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              {CREDITO_MORA.SOCIO} · {CREDITO_MORA.PAGARE}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Éxito */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">✅ Gestión guardada exitosamente</p>
            </div>
          )}

          {/* Radio: Intención de pago — solo si HABIDO */}
          {isHabido && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-2">
                Intención de pago <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-6">
                {(['SI', 'NO'] as const).map((opcion) => (
                  <label
                    key={opcion}
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <input
                      type="radio"
                      name="INTENCION_PAGO"
                      value={opcion}
                      checked={form.INTENCION_PAGO === opcion}
                      onChange={handleChange}
                      disabled={isSaving || success}
                      className="accent-[#0f2d5e] w-4 h-4"
                    />
                    <span
                      className={`text-sm font-medium ${
                        opcion === 'SI' ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {opcion === 'SI' ? '✅ SÍ' : '❌ NO'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Campos gestión: HABIDO + intención SI */}
          {showCamposGestion && (
            <>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Motivo de retraso <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="MOTIVO"
                  value={form.MOTIVO}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe el motivo del retraso..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  disabled={isSaving || success}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Compromiso <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="COMPROMISO"
                  value={form.COMPROMISO}
                  onChange={handleChange}
                  rows={3}
                  placeholder="¿Qué compromiso asume el socio?..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  disabled={isSaving || success}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Fecha de compromiso <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="FECHA_COMPROMISO"
                  value={form.FECHA_COMPROMISO}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSaving || success}
                />
              </div>
            </>
          )}

          {/* Observación: HABIDO + intención NO, o NO HABIDO / NO UBICADO */}
          {showObservacion && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                Observación <span className="text-red-500">*</span>
              </label>
              <textarea
                name="OBSERVACION"
                value={form.OBSERVACION}
                onChange={handleChange}
                rows={3}
                placeholder="Ingresa una observación..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                disabled={isSaving || success}
              />
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
              disabled={isSaving}
            >
              {success ? 'Cerrar' : 'Cancelar'}
            </button>
            <button
              type="submit"
              disabled={isSaving || success}
              className="flex-1 px-4 py-2 bg-[#0f2d5e] text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : success ? 'Completado' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default GestionarSocioModal;