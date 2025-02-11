export interface CreditRequest {
    _id: string;
    nombre: string;
    apellido: string;
    dni: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    estadoAtencion: 'ATENDIDO' | 'PENDIENTE';
    mensaje?: string;
    fecha: string;
    hora: string;
}

export type CreditRequestStatus = CreditRequest['status'];
export type AttentionStatus = CreditRequest['estadoAtencion'];