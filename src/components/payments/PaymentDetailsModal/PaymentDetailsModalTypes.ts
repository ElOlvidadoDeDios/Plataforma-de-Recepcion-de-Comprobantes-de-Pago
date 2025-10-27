import { PaymentRecord } from '../../../types';

export interface PaymentDetailsModalProps {
  showImage: boolean;
  showRejectModal: boolean;
  currentPayment: PaymentRecord;
  isLoading: boolean;
  modalPosition: {
    isMobile: boolean;
    clickPosition?: { x: number; y: number };
  };
  monto: string;
  setMonto: (value: string) => void;
  agenciaCode: string;
  selectedRejectReason: string;
  setSelectedRejectReason: (value: string) => void;
  customReason: string;
  setCustomReason: (value: string) => void;
  onCloseModal: () => void;
  onReject: () => void;
  onConfirmReject: (rejectType: 'partial' | 'total') => void;
  onUpdateStatus: (estado: 'aceptado' | 'rechazado', detallesPago: {
    montoTotal: string;
    userData?: {
      agencia: string;
      cod_caja: string;
      user_caja: string;
      email: string;
      dni_usuario: string;
    };
    vouchers: {
      identificacion: {
        creditoId?: string;
        dni: string;
        fecha: string;
        hora: string;
        estadoGeneral?: string;
      };
      detalles: {
        indice: number;
        montoPago: string;
        nroOperacion: string;
        nro_banco: string;
        banco: string;
        tipoOperacion: string;
        estado?: string;
        _id?: string;
        motivo_rechazo?: string;
      }[];
    }[];
    motivo_rechazo?: string;
  }, indice: number) => void;
  isReadOnlyMode?: boolean;
}

export interface VoucherDetail {
  montoPago: string;
  nroOperacion: string;
  nro_banco: string; // Ajustar a nro_banco para el backend
  tipoOperacion: string;
  estado: 'pendiente' | 'aceptado' | 'rechazado';
  imageIndex: number;
  ruta: string;
  motivo_rechazo?: string;
  paymentIndex: number;
}