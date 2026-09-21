import React, { useContext, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2 } from 'lucide-react';
import { nombreCompleto } from './Helpers';
import { PolizaPorAplicar } from '../../AplicacionPolizas.types';
import { aplicarpoliza } from '../../service/aplicacionPolizas.Service';
import { AuthContext } from '../../../../contexts/AuthContext';
import { AGENCIAS } from '../../../../types';

interface ModalConfirmarAplicacionProps {
  poliza: PolizaPorAplicar | null;
  onClose: () => void;
  onAplicada?: () => void;
}

const ModalConfirmarAplicacion: React.FC<ModalConfirmarAplicacionProps> = ({ poliza, onClose, onAplicada }) => {
  const { user } = useContext(AuthContext);
  const [nroVoucher, setNroVoucher] = useState('');
  const [nroBanco, setNroBanco] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorAplicacion, setErrorAplicacion] = useState('');
  const [okAplicacion, setOkAplicacion] = useState('');

  useEffect(() => {
    if (!poliza) return;
    setNroVoucher(String(poliza.voucher?.data?.voucher?.nro_operacion || '').trim());
    setNroBanco(String(poliza.voucher?.data?.voucher?.nro_banco || '').trim());
    setErrorAplicacion('');
    setOkAplicacion('');
  }, [poliza]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  if (!poliza) return null;

  const agenciaNombre = String(poliza.agencia_nom || '').trim().toUpperCase();
  const voucherUrl = poliza.voucher?.data?.voucher?.voucher_aws || '';
  const voucherActual = String(poliza.voucher?.data?.voucher?.nro_operacion || '').trim();
  const bancoActual = String(poliza.voucher?.data?.voucher?.nro_banco || '').trim();
  const agenciaMap = AGENCIAS as Record<string, string>;

  const agenciaUsuario = useMemo(() => {
    if (!user?.agencias?.length) return undefined;
    return user.agencias.find((ag) => {
      const agNombre = String(ag.agencia || '').trim().toUpperCase();
      return agNombre === agenciaNombre || agNombre === (agenciaMap[agenciaNombre] || '').toUpperCase();
    }) || user.agencias[0];
  }, [user?.agencias, agenciaNombre]);

  const codigoAgencia = String(agenciaUsuario?.agencia || '').trim();
  const codigoCaja = String(agenciaUsuario?.cod_caja || '').trim();
  const userCaja = String(agenciaUsuario?.user_caja || '').trim();
  const userPlataforma = String(user?.dni || '').trim();
  const usuarioAplica = String(userCaja || user?.user || '').trim();
  const montoPago = Number(poliza.titular?.costo || poliza.voucher?.data?.voucher?.monto_pago || 0);

  const puedeAplicar =
    nroVoucher.trim() !== '' &&
    nroBanco.trim() !== '' &&
    codigoAgencia !== '' &&
    codigoCaja !== '' &&
    usuarioAplica !== '' &&
    montoPago > 0 &&
    !guardando;

  const handleAplicar = async () => {
    if (!poliza) return;
    setErrorAplicacion('');
    setOkAplicacion('');

    if (!nroVoucher.trim() || !nroBanco.trim()) {
      setErrorAplicacion('Completa Nro. Voucher y Nro. Banco antes de aplicar la póliza.');
      return;
    }

    if (!codigoAgencia || !codigoCaja || !usuarioAplica || montoPago <= 0) {
      setErrorAplicacion('Faltan datos obligatorios para aplicar (agencia, caja, usuario o monto).');
      return;
    }

    try {
      setGuardando(true);
      await aplicarpoliza({
        ID: poliza._id,
        MONTO_PAGO: montoPago,
        NRO_VOUCHER: nroVoucher.trim(),
        NRO_BANCO: nroBanco.trim(),
        USER: usuarioAplica,
        USER_PLATAFORMA: userPlataforma,
        AGENCIA: codigoAgencia,
        COD_CAJA: codigoCaja,
      });
      setOkAplicacion('Póliza aplicada correctamente.');
      onAplicada?.();
    } catch (err: any) {
      setErrorAplicacion(err?.message || 'No se pudo aplicar la póliza.');
    } finally {
      setGuardando(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[90] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-5xl w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-slate-800">Aplicar Póliza</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {nombreCompleto(poliza.titular)} · DNI {poliza.titular?.nro_documento}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
            {voucherUrl ? (
              <button
                type="button"
                onClick={() => window.open(voucherUrl, '_blank', 'noopener,noreferrer')}
                className="w-full rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50 transition"
                title="Abrir voucher en una pestaña nueva"
              >
                <img
                  src={voucherUrl}
                  alt="Voucher adjunto"
                  className="h-[420px] w-full rounded object-contain bg-white"
                />
              </button>
            ) : (
              <div className="h-[420px] w-full rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center text-slate-400 text-sm">
                No hay voucher adjunto
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Cod. Agencia:</span>
                <span className="font-mono font-semibold">{codigoAgencia || 'N/D'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cod. Caja:</span>
                <span className="font-mono font-semibold">{codigoCaja || 'N/D'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">User Caja:</span>
                <span className="font-mono font-semibold">{usuarioAplica || 'N/D'}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nro. Voucher</label>
              <input
                type="text"
                value={nroVoucher}
                onChange={(e) => setNroVoucher(e.target.value)}
                placeholder="Ej: 014785236"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nro. Banco</label>
              <input
                type="text"
                value={nroBanco}
                onChange={(e) => setNroBanco(e.target.value)}
                placeholder="Ej: 74856"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {errorAplicacion && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 text-left">
            {errorAplicacion}
          </div>
        )}
        {okAplicacion && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 text-left">
            {okAplicacion}
          </div>
        )}

        <div className="pt-2 space-y-2">
          <button
            onClick={handleAplicar}
            disabled={!puedeAplicar}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
          >
            {guardando ? 'Aplicando póliza...' : 'Aplicar Póliza Ahora'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalConfirmarAplicacion;