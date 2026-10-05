import { ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useNotifications } from '../../../hooks/useNotifications';
import {
  createComprobantePago,
  uploadVoucherFilesToCloud,
} from '../../../api/cuotasMoraApi';
import { CuotaDto, fetchCuotasPorDNI } from '../../../api/pagos_recaudadoresApi';
import { getCuotasMoraPayloadMetadata } from '../services/cuotasMoraMetadata.service';

interface VoucherFileItem {
  id: string;
  file: File;
  previewUrl: string;
}

interface ModalSubirVouchersProps {
  isOpen: boolean;
  onClose: () => void;
  dni: string;
  nombreSocio: string;
  pagare: string;
  cuotasVencidasCantidad: number;
  cuotasVencidasTotalAPagar: number;
  onSaved?: () => void;
}

const formatLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return {
    fecha: `${year}-${month}-${day}`,
    hora: `${hours}:${minutes}:${seconds}`,
  };
};

const getCuotasUnicasPorPagare = (
  rawPagares: { [key: string]: CuotaDto[] },
  pagareObjetivo: string,
): CuotaDto[] => {
  const pagareNormalizado = pagareObjetivo.trim();
  const cuotasCrudas = Object.values(rawPagares)
    .flat()
    .filter((cuota) => cuota.Pagare?.trim() === pagareNormalizado);

  const seen = new Set<string>();
  return cuotasCrudas.filter((cuota) => {
    if (cuota.NumeroCuota == null || cuota.TotalCuota == null) return false;
    const key = `${cuota.Pagare?.trim()}-${cuota.NumeroCuota}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function ModalSubirVouchers({
  isOpen,
  onClose,
  dni,
  nombreSocio,
  pagare,
  cuotasVencidasCantidad,
  cuotasVencidasTotalAPagar,
  onSaved,
}: ModalSubirVouchersProps): ReactElement | null {
  const Notification = useNotifications();
  const [files, setFiles] = useState<VoucherFileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const filesRef = useRef<VoucherFileItem[]>([]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    if (!isOpen) {
      files.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    return () => {
      filesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  const totalEstimado = useMemo(
    () => cuotasVencidasTotalAPagar || 0,
    [cuotasVencidasTotalAPagar],
  );

  if (!isOpen) return null;

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length === 0) return;

    const nextItems = selected.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setFiles((current) => [...current, ...nextItems]);
    event.target.value = '';
  };

  const handleRemoveFile = (id: string) => {
    setFiles((current) => {
      const item = current.find((entry) => entry.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return current.filter((entry) => entry.id !== id);
    });
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      Notification.info('Selecciona al menos un voucher');
      return;
    }

    setIsUploading(true);

    try {
      const cuotasActualesRaw = await fetchCuotasPorDNI(dni);
      const cuotasDelPagareActual = getCuotasUnicasPorPagare(cuotasActualesRaw, pagare);

      if (cuotasDelPagareActual.length === 0) {
        Notification.error('El pagare seleccionado ya no coincide con el socio actual. Refresca la busqueda antes de subir vouchers.');
        return;
      }

      const cantidadActual = cuotasDelPagareActual.length;
      if (cantidadActual !== cuotasVencidasCantidad) {
        Notification.warning('La cantidad de cuotas del credito cambió. Vuelve a buscar y abre nuevamente el modal para evitar enviar datos cruzados.');
        return;
      }

      const totalActual = cuotasDelPagareActual.reduce(
        (sum, cuota) => sum + (cuota.TotalCuota || 0),
        0,
      );

      const diferenciaTotal = Math.abs(totalActual - totalEstimado);
      if (diferenciaTotal > 0.05) {
        Notification.warning('La informacion de cuotas cambio mientras estabas en el modal. Vuelve a buscar y abre de nuevo el voucher para evitar mezcla de datos.');
        return;
      }

      const urls = await uploadVoucherFilesToCloud(
        files.map((item) => item.file),
        dni,
        pagare,
      );

      const { fecha, hora } = formatLocalDate();
      const metadata = await getCuotasMoraPayloadMetadata(dni, pagare);
      const comprobantebase_64 = urls.map((ruta, index) => ({
        ruta,
        _id: `${pagare}-${Date.now()}-${index}`,
        estado: 'pendiente' as const,
        origen: '',
      }));

      const result = await createComprobantePago({
        dni,
        creditoId: pagare,
        cuotaSeleccionada: 'Todas las cuotas',
        cuotasVencidasCantidad: String(cuotasVencidasCantidad),
        cuotasVencidasTotalAPagar: String(totalEstimado.toFixed(2)),
        IDAnalistaActual: metadata.IDAnalistaActual,
        agencia: metadata.agencia,
        numero_cel: metadata.numero_cel,
        canalPago: 'canal3',
        comprobantebase_64,
        nombreSocio,
        estadoGeneral: 'pendiente',
        fecha,
        hora,
      });

      Notification.success(result?.message || 'Voucher guardado correctamente');
      onSaved?.();
      onClose();
    } catch (error) {
      Notification.error(
        `Error al subir vouchers: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    } finally {
      setIsUploading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-4 text-white flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold">Subir vouchers</h2>
            <p className="text-sm text-white/90">
              {nombreSocio} · Crédito {pagare} · Resumen de cuotas
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/25 transition-colors"
          >
            Cerrar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-gray-500">DNI</p>
                <p className="font-semibold text-gray-800">{dni}</p>
              </div>
              <div>
                <p className="text-gray-500">Total a pagar</p>
                <p className="font-semibold text-gray-800">S/ {totalEstimado.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">Cuotas vencidas</p>
                <p className="font-semibold text-gray-800">{cuotasVencidasCantidad}</p>
              </div>
            </div>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-300 bg-cyan-50 px-6 py-8 text-center hover:bg-cyan-100 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFilesChange}
            />
            <span className="text-base font-semibold text-cyan-800">Seleccionar vouchers</span>
            <span className="mt-1 text-sm text-cyan-700">Puedes subir varios archivos a la vez</span>
          </label>

          {files.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Archivos seleccionados</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {files.map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <div className="mb-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="h-40 w-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">{item.file.name}</p>
                        <p className="text-xs text-gray-500">{Math.round(item.file.size / 1024)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(item.id)}
                        className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200 transition-colors"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 bg-white px-5 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isUploading}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
          >
            {isUploading ? 'Subiendo...' : 'Subir vouchers'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
