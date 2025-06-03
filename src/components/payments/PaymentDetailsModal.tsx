import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { PaymentRecord, AGENCIAS } from '../../types';
import { fetchPendingPaymentsByPagare } from '../../api/paymentsApi';
import toast from 'react-hot-toast';

import { PaymentHeader } from './modalComponents/PaymentHeader';
import { PaymentImageViewer } from './modalComponents/PaymentImageViewer';
import { PaymentForm } from './modalComponents/PaymentForm';
import { PaymentActions } from './modalComponents/PaymentActions';

interface PaymentDetailsModalProps {
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
        tipoOperacion: string;
        estado?: string;
        _id?: string;
        motivo_rechazo?: string;
      }[];
    }[];
    motivo_rechazo?: string;
  }, indice: number) => void;
}

export const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  showImage,
  showRejectModal,
  currentPayment,
  isLoading,
  modalPosition,
  monto,
  setMonto,
  agenciaCode,
  selectedRejectReason,
  setSelectedRejectReason,
  customReason,
  setCustomReason,
  onCloseModal,
  onReject,
  onConfirmReject,
  onUpdateStatus
}) => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<'image' | 'form'>('image');
  const [relatedPayments, setRelatedPayments] = useState<PaymentRecord[]>([]);
  const [rejectType, setRejectType] = useState<'partial' | 'total'>('total');
  interface VoucherDetail {
    montoPago: string;
    nroOperacion: string;
    tipoOperacion: string;
    estado: 'pendiente' | 'aceptado' | 'rechazado';
    imageIndex: number;
    ruta: string;
    motivo_rechazo?: string;
    paymentIndex: number; // Índice del pago al que pertenece el voucher
  }

  const [paymentDetails, setPaymentDetails] = useState<VoucherDetail[]>([]);
  const [paymentIndex, setPaymentIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [totalAmount, setTotalAmount] = useState(monto);
  const [modalPayments, setModalPayments] = useState<PaymentRecord[]>([]);

  // Inicializar modalPayments con el comprobante actual
  useEffect(() => {
    setModalPayments([currentPayment]);
    setPaymentIndex(0);
    setImageIndex(0);
  }, [currentPayment]);

  useEffect(() => {
    const loadRelatedPayments = async () => {
      if (currentPayment.estadoGeneral === 'pendiente' && currentPayment.creditoId) {
        setLoadingRelated(true);
        try {
          const payments = await fetchPendingPaymentsByPagare(currentPayment.creditoId);
          const filteredPayments = payments
            .filter(p => !(p.dni === currentPayment.dni && p.fecha === currentPayment.fecha && p.hora === currentPayment.hora))
            .sort((a, b) => new Date(a.fecha + ' ' + a.hora).getTime() - new Date(b.fecha + ' ' + b.hora).getTime());
          
          setRelatedPayments(filteredPayments);
          setModalPayments([currentPayment, ...filteredPayments]);
          
          // Generar detalles para todos los pagos de manera individual
          const details: VoucherDetail[] = [];
          [currentPayment, ...filteredPayments].forEach((payment, paymentIndex) => {
            if (payment.comprobantebase_64 && payment.comprobantebase_64.length > 0) {
              payment.comprobantebase_64.forEach((comp, idx) => {
                details.push({
                  montoPago: (Number(payment.cuotasVencidasTotalAPagar) / payment.comprobantebase_64.length).toFixed(2),
                  nroOperacion: '',
                  tipoOperacion: '',
                  estado: comp.estado,
                  imageIndex: idx,
                  ruta: comp.ruta,
                  motivo_rechazo: comp.motivo_rechazo,
                  paymentIndex: paymentIndex // Agregar índice del pago para referencia
                });
              });
            }
          });
          setPaymentDetails(details);

          const total = [currentPayment, ...filteredPayments]
            .reduce((sum, payment) => sum + Number(payment.cuotasVencidasTotalAPagar), 0)
            .toFixed(2);
          setTotalAmount(total);
          setMonto(total);
        } catch (error) {
          toast.error('Error al cargar comprobantes relacionados');
        } finally {
          setLoadingRelated(false);
        }
      }
    };

    loadRelatedPayments();

    // Inicializar los detalles del pago actual
    const details: VoucherDetail[] = currentPayment.comprobantebase_64.map((comp, idx) => ({
      montoPago: (Number(currentPayment.cuotasVencidasTotalAPagar) / currentPayment.comprobantebase_64.length).toFixed(2),
      nroOperacion: '',
      tipoOperacion: '',
      estado: comp.estado,
      imageIndex: idx,
      ruta: comp.ruta,
      motivo_rechazo: comp.motivo_rechazo,
      paymentIndex: 0 // Es el primer pago siempre
    }));
    setPaymentDetails(details);
  }, [currentPayment, setMonto]);

  const removePayment = (index: number) => {
    if (index === 0) return;
    
    const newPayments = [...modalPayments];
    newPayments.splice(index, 1);
    setModalPayments(newPayments);
    
    if (paymentIndex >= newPayments.length) {
      setPaymentIndex(newPayments.length - 1);
    }

    const total = newPayments
      .reduce((sum, payment) => sum + Number(payment.cuotasVencidasTotalAPagar), 0)
      .toFixed(2);
    setTotalAmount(total);
    setMonto(total);
  };

  const allPayments = modalPayments;
  const displayedPayment = allPayments[paymentIndex];

  const changePayment = (newPaymentIndex: number) => {
    setPaymentIndex(newPaymentIndex);
    
    const newPayment = allPayments[newPaymentIndex];
    if (!newPayment) return;
    
    setImageIndex(0);
    
    // Verificar si existen detalles para este pago
    const existingDetails = paymentDetails.filter(detail =>
      newPayment.comprobantebase_64.some(comp => comp.ruta === detail.ruta)
    );

    // Si no existen detalles para este pago, crear nuevos con valores por defecto
    if (existingDetails.length === 0) {
      const paymentVouchers = newPayment.comprobantebase_64.map((comp, idx) => ({
        montoPago: (Number(newPayment.cuotasVencidasTotalAPagar) / newPayment.comprobantebase_64.length).toFixed(2),
        nroOperacion: '',
        tipoOperacion: '',
        estado: comp.estado,
        imageIndex: idx,
        ruta: comp.ruta,
        motivo_rechazo: comp.motivo_rechazo,
        paymentIndex: newPaymentIndex
      })) as VoucherDetail[];
      
      setPaymentDetails(prev => [...prev, ...paymentVouchers]);
    }
  };

  const handleNextPayment = () => {
    const nextIndex = (paymentIndex + 1) % allPayments.length;
    changePayment(nextIndex);
  };

  const handlePrevPayment = () => {
    const prevIndex = (paymentIndex - 1 + allPayments.length) % allPayments.length;
    changePayment(prevIndex);
  };

  const updateVoucherDetail = (index: number, field: keyof VoucherDetail, value: string) => {
    const currentVoucher = paymentDetails.find(detail =>
      detail.imageIndex === imageIndex &&
      displayedPayment.comprobantebase_64[imageIndex]?.ruta === detail.ruta
    );

    if (!currentVoucher) return;

    const newDetails = paymentDetails.map(detail => {
      if (detail === currentVoucher) {
        return {
          ...detail,
          [field]: value
        };
      }
      return detail;
    });

    setPaymentDetails(newDetails);

    if (field === 'montoPago') {
      const total = newDetails
        .filter(detail => detail.estado !== 'rechazado')
        .reduce((sum, detail) => sum + (Number(detail.montoPago) || 0), 0)
        .toFixed(2);
      setMonto(total);
      setTotalAmount(total);
    }
  };

  const handleRejectVoucher = () => {
    setRejectType('partial');
    onReject();
  };

  const handleUpdateStatus = async (
    estado: 'aceptado' | 'rechazado',
    detalles: {
      montoTotal: string;
      vouchers: {
        identificacion: {
          dni: string;
          fecha: string;
          hora: string;
          indice: number;
        };
        detalles: {
          montoPago: string;
          nroOperacion: string;
          tipoOperacion: string;
        };
      }[];
      motivo_rechazo?: string;
    },
    indice: number
  ) => {
    // 1. Validar estado general del comprobante
    if (!['pendiente', 'parcial'].includes(displayedPayment.estadoGeneral)) {
      toast.error('Este comprobante ya ha sido completamente procesado');
      return;
    }

    // 2. Verificar y actualizar estados según la operación
    if (estado === 'rechazado') {
      if (rejectType === 'total') {
        // Para rechazo total, afectar a todos los vouchers pendientes
        const allPendingVouchers = paymentDetails.filter(detail => detail.estado === 'pendiente');
        
        // Verificar datos completos
        const incompleteVouchers = allPendingVouchers.filter(
          voucher => !voucher.montoPago || !voucher.nroOperacion || !voucher.tipoOperacion
        );

        if (incompleteVouchers.length > 0) {
          toast.error('Debe completar los datos de todos los comprobantes pendientes');
          return;
        }

        // Actualizar todos los vouchers pendientes
        const updatedDetails = paymentDetails.map(detail => {
          if (detail.estado === 'pendiente') {
            return {
              ...detail,
              estado: 'rechazado' as const,
              motivo_rechazo: selectedRejectReason || customReason
            };
          }
          return detail;
        }) as VoucherDetail[];
        setPaymentDetails(updatedDetails);

        // Actualizar estados en todos los pagos
        modalPayments.forEach((payment, paymentIdx) => {
          payment.comprobantebase_64.forEach((comp, idx) => {
            const detail = updatedDetails.find(d =>
              d.imageIndex === idx &&
              d.paymentIndex === paymentIdx &&
              d.estado === 'pendiente'
            );
            if (detail) {
              comp.estado = 'rechazado';
              comp.motivo_rechazo = detail.motivo_rechazo;
            }
          });
          payment.estadoGeneral = 'atendido';
        });
      } else {
        // Rechazo parcial (código existente para rechazo parcial)
        const selectedVoucher = paymentDetails.find(v =>
          v.imageIndex === imageIndex &&
          displayedPayment.comprobantebase_64[imageIndex]?.ruta === v.ruta
        );

        if (!selectedVoucher) return;

        if (selectedVoucher.estado !== 'pendiente') {
          toast.error('Este comprobante ya ha sido procesado');
          return;
        }

        if (!selectedVoucher.montoPago || !selectedVoucher.nroOperacion || !selectedVoucher.tipoOperacion) {
          toast.error('Debe completar los datos del comprobante seleccionado');
          return;
        }
      }
    }

    const isPartialReject = estado === 'rechazado' && rejectType === 'partial';
    const payment = displayedPayment;
    const voucher = payment.comprobantebase_64[imageIndex];

    console.log('=== Actualizando estado ===');
    console.log('Tipo:', estado);
    console.log('Rechazo parcial:', isPartialReject);
    console.log('Imagen actual:', imageIndex);

    if (estado === 'rechazado') {
      let updatedDetails;
      if (rejectType === 'total') {
        // En rechazo total, actualizar todos los vouchers pendientes
        updatedDetails = paymentDetails.map(detail => {
          if (detail.estado === 'pendiente') {
            return {
              ...detail,
              estado: 'rechazado' as const,
              motivo_rechazo: detalles.motivo_rechazo
            };
          }
          return detail;
        });
      } else if (isPartialReject && voucher) {
        // En rechazo parcial, actualizar solo el voucher seleccionado
        updatedDetails = paymentDetails.map(detail => {
          if (detail.imageIndex === imageIndex && detail.ruta === voucher.ruta) {
            return {
              ...detail,
              estado: 'rechazado' as const,
              motivo_rechazo: detalles.motivo_rechazo
            };
          }
          return detail;
        });
      }

      if (updatedDetails) {
        setPaymentDetails(updatedDetails);
        
        // Actualizar los estados en el payment
        payment.comprobantebase_64.forEach((comp, idx) => {
          const detail = updatedDetails.find((d: VoucherDetail) => d.imageIndex === idx && d.ruta === comp.ruta);
          if (detail) {
            comp.estado = detail.estado;
            comp.motivo_rechazo = detail.motivo_rechazo;
          }
        });

        payment.estadoGeneral = 'atendido';
      }

      console.log('Estado general actualizado a:',(payment.estadoGeneral));
    }

    const requestData = prepareRequestData(estado);

    console.log('=== Datos a enviar ===');
    console.log('Estado final:', estado);
    console.log('Estado general:', payment.estadoGeneral);
    console.log('Datos completos:', JSON.stringify(requestData, null, 2));
    console.log('=====================');

    onUpdateStatus(estado, requestData, indice);
  };

  const prepareRequestData = (tipo: 'aceptado' | 'rechazado') => {
    const isPartialReject = rejectType === 'partial' && tipo === 'rechazado';

    console.log('=== Preparando datos ===');
    console.log('Operación:', tipo);
    console.log('Rechazo parcial:', isPartialReject);
    console.log('Índice de imagen:', imageIndex);
    console.log('Total de pagos:', modalPayments.length);
    console.log('=======================');

    const requestData = {
      montoTotal: Number(totalAmount).toFixed(2),
      userData: {
        agencia: agenciaCode,
        cod_caja: user?.agencias?.[0]?.cod_caja || '',
        user_caja: user?.agencias?.[0]?.user_caja || '',
        email: user?.email || '',
        dni_usuario: user?.dni || '',
      },
      vouchers: modalPayments.map((payment, paymentIdx) => {
        const finalState = tipo === 'aceptado' ? 'atendido' : 'rechazado';
        const isCurrentPayment = payment === displayedPayment;

        const voucherDetails = payment.comprobantebase_64.map((comp, idx) => {
          const detail = paymentDetails.find(
            (d) => d.imageIndex === idx && d.ruta === comp.ruta
          );

          if (!detail) return null;

          let finalState = detail.estado;
          let finalMotivo = detail.motivo_rechazo;

          // Establecer estado según el tipo de operación
          if (tipo === 'aceptado') {
            finalState = 'aceptado';
          } else if (tipo === 'rechazado') {
            if (rejectType === 'total') {
              // En rechazo total, todos los vouchers pasan a rechazado con el mismo motivo
              finalState = 'rechazado';
              finalMotivo = selectedRejectReason || customReason;
            } else if (isCurrentPayment && isPartialReject && idx === imageIndex) {
              // En rechazo parcial, solo el voucher seleccionado
              finalState = 'rechazado';
              finalMotivo = selectedRejectReason || customReason;
            }
          }

          return {
            indice: idx,
            montoPago: finalState === 'rechazado' ? '0' : detail.montoPago,
            nroOperacion: detail.nroOperacion || '',
            tipoOperacion: detail.tipoOperacion || '',
            estado: finalState as 'pendiente' | 'aceptado' | 'rechazado',
            _id: comp._id,
            motivo_rechazo: finalMotivo,
          };
        }).filter((d): d is NonNullable<typeof d> => d !== null);

        const totalVouchers = voucherDetails.length;
        const rejectedCount = voucherDetails.filter((d) => d.estado === 'rechazado').length;
        const acceptedCount = voucherDetails.filter((d) => d.estado === 'aceptado').length;
        const pendingCount = totalVouchers - rejectedCount - acceptedCount;

        // Determinar estado general
        let estadoGeneral: string;
        if (tipo === 'aceptado' || (tipo === 'rechazado' && rejectType === 'total')) {
          // Si es aceptación o rechazo total, pasa a atendido
          estadoGeneral = 'atendido';
        } else if (rejectedCount > 0 && pendingCount > 0) {
          // Si hay rechazos parciales y pendientes
          estadoGeneral = 'parcial';
        } else {
          estadoGeneral = 'pendiente';
        }

        console.log(`Estado del pago ${payment.fecha} ${payment.hora}:`, {
          total: totalVouchers,
          rechazados: rejectedCount,
          aceptados: acceptedCount,
          pendientes: pendingCount,
          estado: estadoGeneral,
        });

        return {
          identificacion: {
            creditoId: payment.creditoId || '',
            dni: payment.dni,
            fecha: payment.fecha,
            hora: payment.hora,
            estadoGeneral,
          },
          detalles: voucherDetails,
        };
      }),
    };

    console.log('=== Resumen de la operación ===');
    console.log('Estado general por pago:');
    requestData.vouchers.forEach((v) => {
      console.log(`- Pago ${v.identificacion.fecha} ${v.identificacion.hora}:`, {
        estado: v.identificacion.estadoGeneral,
        totalVouchers: v.detalles.length,
        rechazados: v.detalles.filter((d) => d.estado === 'rechazado').length,
        pendientes: v.detalles.filter((d) => d.estado === 'pendiente').length,
      });
    });
    console.log('============================');

    return requestData;
  };

  const agenciaSeleccionada = Object.entries(AGENCIAS).find(([_, code]) => code === agenciaCode)?.[0] || agenciaCode;

  if (!showImage) return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 w-screen h-screen bg-black/50 z-[9999] backdrop-blur-sm"
        onClick={onCloseModal}
        style={{
          position: 'fixed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={`bg-white shadow-2xl border border-gray-200 z-[10000] flex flex-col ${
            modalPosition.isMobile
              ? 'fixed inset-0 overflow-hidden'
              : 'relative w-[800px] rounded-lg h-[90vh] max-h-[1000px]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <PaymentHeader
            displayedPayment={displayedPayment}
            totalAmount={totalAmount}
            currentIndex={paymentIndex}
            totalPayments={allPayments.length}
            onCloseModal={onCloseModal}
            showImage={showImage}
          />
  
          <div className={`flex-1 flex ${modalPosition.isMobile ? 'flex-col' : 'flex-row'} gap-3 p-4 text-sm overflow-hidden relative`}>
            {allPayments.length > 1 && (
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 z-50 pointer-events-none">
                <button
                  onClick={handlePrevPayment}
                  className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white pointer-events-auto transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextPayment}
                  className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white pointer-events-auto transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="absolute top-2 right-2 z-30">
              {paymentIndex > 0 && (
                <button
                  onClick={() => removePayment(paymentIndex)}
                  className="text-gray-500 hover:text-red-500 transition-colors bg-white/90 rounded-full shadow-md p-1"
                  title="Quitar comprobante"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {modalPosition.isMobile && (
              <div className="flex border-b border-gray-200 mb-2">
                <button
                  className={`flex-1 py-2 px-4 text-sm font-medium ${
                    activeTab === 'image' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
                  }`}
                  onClick={() => setActiveTab('image')}
                >
                  Imagen
                </button>
                <button
                  className={`flex-1 py-2 px-4 text-sm font-medium ${
                    activeTab === 'form' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
                  }`}
                  onClick={() => setActiveTab('form')}
                >
                  Formulario
                </button>
              </div>
            )}
            <div className={`${
              modalPosition.isMobile
                ? activeTab === 'image' ? 'flex-1' : 'hidden'
                : 'w-7/12 min-h-[600px]'
            } flex-shrink-0 h-full overflow-hidden relative`}>
              <p className="mb-1 px-2 text-xs text-gray-500">
                {paymentIndex === 0 ? 'Comprobante principal' : `Comprobante adicional ${paymentIndex}`}
              </p>
              <PaymentImageViewer
                imageSource={displayedPayment.comprobantebase_64.map(c => c.ruta)}
                altText={`Comprobante de ${displayedPayment.nombreSocio}`}
                isLoading={isLoading || loadingRelated}
                currentIndex={imageIndex}
                onChangeIndex={(index) => {
                  setImageIndex(index);
                  const currentVoucher = paymentDetails.find(detail =>
                    detail.imageIndex === index
                  );
                  if (currentVoucher) {
                    setPaymentDetails(prev => prev.map(detail =>
                      detail.imageIndex === currentVoucher.imageIndex ? currentVoucher : detail
                    ));
                  }
                }}
              />
            </div>

            <div className={`${
              modalPosition.isMobile
                ? activeTab === 'form' ? 'flex-1' : 'hidden'
                : 'w-5/12'
            } overflow-auto relative z-20`}>
              <PaymentForm
                vouchers={[paymentDetails.find(detail =>
                  detail.imageIndex === imageIndex &&
                  displayedPayment.comprobantebase_64[imageIndex]?.ruta === detail.ruta
                )].filter((detail): detail is VoucherDetail => detail !== undefined)}
                onUpdateVoucher={updateVoucherDetail}
                onRejectVoucher={handleRejectVoucher}
                agenciaName={agenciaSeleccionada}
                isEditable={
                  // Solo editable si estado general es pendiente o parcial
                  ['pendiente', 'parcial'].includes(displayedPayment.estadoGeneral) &&
                  // Y si el voucher específico está pendiente
                  displayedPayment.comprobantebase_64[imageIndex]?.estado === 'pendiente'
                }
              />
            </div>
          </div>

          <div className="border-t border-gray-200 bg-white shadow-lg">
            <PaymentActions
              isPending={displayedPayment.comprobantebase_64[imageIndex]?.estado === 'pendiente'}
              isLoading={isLoading}
              isMobile={modalPosition.isMobile}
              totalPayments={allPayments.length}
              showRejectModal={showRejectModal}
              selectedRejectReason={selectedRejectReason}
              customReason={customReason}
              rejectType={rejectType}
              onUpdateStatus={(estado, data) => {
                if (estado === 'rechazado' && !data.motivo_rechazo) {
                  toast.error('Debe seleccionar un motivo de rechazo');
                  return;
                }

                const targetIndex = rejectType === 'partial' ? imageIndex : paymentIndex;

                handleUpdateStatus(estado, {
                  ...data,
                  motivo_rechazo: rejectType === 'partial'
                    ? `[Rechazo Parcial] ${data.motivo_rechazo}`
                    : `[Rechazo Total] ${data.motivo_rechazo}`
                }, targetIndex);

                console.log('=== Datos de rechazo ===');
                console.log('Tipo:', rejectType);
                console.log('Índice de imagen:', imageIndex);
                console.log('Índice de pago:', paymentIndex);
                console.log('Estado:', estado);
                console.log('=====================');
              }}
              onReject={() => {
                setRejectType('partial');
                onReject();
              }}
              onCloseModal={onCloseModal}
              onConfirmReject={(type) => {
                setRejectType(type);
                onConfirmReject(type);
              }}
              setSelectedRejectReason={setSelectedRejectReason}
              setCustomReason={setCustomReason}
              totalMonto={monto}
              onMontoTotalChange={setMonto}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};