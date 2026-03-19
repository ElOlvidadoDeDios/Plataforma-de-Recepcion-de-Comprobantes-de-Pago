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

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    MOTIVO: '',
    COMPROMISO: '',
    FECHA_COMPROMISO: today,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null); // Limpiar errores al cambiar valores
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const gestionData = {
        PAGARE: CREDITO_MORA.PAGARE,
        CUENTA: CREDITO_MORA.CUENTA,
        OTORGA: CREDITO_MORA.OTORGA,
        MOTIVO: form.MOTIVO,
        COMPROMISO: form.COMPROMISO,
        FECHA_COMPROMISO: form.FECHA_COMPROMISO,
        REGISTRADOR: user?.dni || '', // Enviar DNI del responsable
        NOMBRE_A: user?.razon || '',
        AGENCIA: Object.keys(AGENCIAS).find((key) => AGENCIAS[key as keyof typeof AGENCIAS] === user?.id_age) || user?.id_age || '',
      };

      console.log('Enviando datos de gestión:', gestionData);
      const response = await saveGestionMora(gestionData);
      
      if (response.status) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500); // Cerrar después de mostrar éxito
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
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-800">Registrar gestión</h2>
            <p className="text-xs text-gray-400 mt-0.5">{CREDITO_MORA.SOCIO} · {CREDITO_MORA.PAGARE}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Mensaje de error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Mensaje de éxito */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">✅ Gestión guardada exitosamente</p>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Motivo de retraso *</label>
            <textarea
              name="MOTIVO"
              value={form.MOTIVO}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Describe el motivo del retraso..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={isSaving || success}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Compromiso *</label>
            <textarea
              name="COMPROMISO"
              value={form.COMPROMISO}
              onChange={handleChange}
              required
              rows={3}
              placeholder="¿Qué compromiso asume el socio?..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={isSaving || success}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Fecha de compromiso *</label>
            <input
              type="date"
              name="FECHA_COMPROMISO"
              value={form.FECHA_COMPROMISO}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSaving || success}
            />
          </div>

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