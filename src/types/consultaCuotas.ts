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
}
