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

export type CreditRequestStatus = CreditRequest['status'];
export type AttentionStatus = CreditRequest['estadoAtencion'];