// http://localhost:8080/desarrollo/api_app_dile_v1_1/api/editar_direccion_socio
//  {
//     "cuenta": "000000022969",
//     "tipo_dir": "01",
//     "tipo_via": "01",
//     "nom_via": "AV. LA CULTURA",
//     "tipo_zona": "01",
//     "nom_zona": "WANCHAQ",
//     "numero": "123",
//     "interior": "201",
//     "referencia": "A UNA CUADRA DEL PARQUE",
//     "dpto": "01",
//     "prov": "01",
//     "dist": "01",
//     "tipo_sector": "01",
//     "direccion": "AV. LA CULTURA 123 INT. 201"
// }

export interface datosdireccion {
    cuenta: string;
    tipo_dir: string;
    tipo_via: string;
    nom_via: string;
    tipo_zona: string;
    nom_zona: string;
    numero?: string;
    interior?: string;
    referencia: string;
    dpto: string;
    prov: string;
    dist: string;
    tipo_sector: string;
    direccion: string;
}


export interface ApiResult {
    success: boolean;
    data?: any;
    message?: string;
    error?: string;
}

export async function editarDireccion(datos: datosdireccion): Promise<ApiResult> {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL_GEODILE}/api_app_dile_v1_1/api/editar_direccion_socio`, {
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
        message: data?.message || 'Dirección actualizada correctamente',
        data,
    };
}

export const buscarDatosContacto = editarDireccion;