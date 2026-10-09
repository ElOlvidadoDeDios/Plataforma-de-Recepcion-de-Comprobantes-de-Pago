export interface VoucherComprobante {
    _id: string;
    ruta: string;
    estado: string;
    banco?: string;
    fecha_voucher?: string;
    fechamodificacion?: string;
    horamodificacion?: string;
    monto_pago?: number;
    motivo_rechazo?: string | null;
    nroOperacion?: string;
    nro_banco?: string;
    origen?: string;
    tipoOperacion?: string;
    user_caja?: string;
}

export interface ConsultaCuota {
    _id: string;
    dni: string;
    pagare: string;
    numeroCuotas: string;
    totalPagar: string;
    estado: string;
    nombreSocio: string;
    celular: string;
    ip_origen: string;
    fecha: string;
    hora: string;
    cuotas_detalle: any[];
    creditosDisponibles: any;
    telefonos: string[];
    comprobantebase_64?: VoucherComprobante[];
}
