export interface CreditRequest {
    _id: string;
    nombre: string;
    apellido: string;
    dni: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    estadoAtencion: 'ATENDIDO' | 'PENDIENTE';
    mensaje?: string;
    puntaje?: number;
    fecha: string;
    hora: string;
    mensajeRespuesta?: string;
    respondidoEn?: string;
}

export interface HistorialCredito {
    _id: string;
    email: string;
    fecha_atencion: string;
    hora_atencion: string;
    solicitud_atendida:CreditRequest; 

}


export type CreditRequestStatus = CreditRequest['status'];
export type AttentionStatus = CreditRequest['estadoAtencion'];

