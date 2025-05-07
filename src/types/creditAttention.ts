export interface CreditAttention {
    _id: string;
    email: string;
    dni_usuario: string;
    fecha_atencion: string;
    hora_atencion: string;
    solicitud_atendida: {
        dni: string;
        nombre: string;
        apellido: string;
        status: string;
        puntaje?: number;
        mensaje?: string;
        estado_anterior: string;
        estado_nuevo: string;
        fecha: string;
        hora: string;
    };
}

export interface CreditAttentionResponse {
    message: string;
    data: CreditAttention[];
}