

// http://localhost:8080/desarrollo/api_app_dile_v1_1/api/editar_datos_contacto_socio

// {
//     "cuenta": "000000022969",
//     "tlf_cel1": "987654321",
//     "tlf_cel2": "",
//     "tlf_fijo1": "",
//     "tlf_fijo2": "",
//     "email": "correo@gmail.com"
// }
export interface datoscontacto { 
    cuenta: string;
    tlf_cel1: string;
    tlf_cel2?: string;
    tlf_fijo1?: string;
    tlf_fijo2?: string;
    email: string;
}

export interface ApiResult {
    success: boolean;
    data?: any;
    message?: string;
    error?: string;
}

export async function editarDatosContacto(datos: datoscontacto): Promise<ApiResult> {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL_GEODILE}/api_app_dile_v1_1/api/editar_datos_contacto_socio`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${import.meta.env.VITE_API_BASE_URL_GEODILE_TOKEN}`
        },
        body: JSON.stringify(datos)
    });
    const data = await response.json();

    if (!response.ok) {
        return {
            success: false,
            error: data?.message || `Error: ${response.status}`,
            data,
        };
    }

    return {
        success: true,
        message: data?.message || 'Datos de contacto actualizados correctamente',
        data,
    };
}