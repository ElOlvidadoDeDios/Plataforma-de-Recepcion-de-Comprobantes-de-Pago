export interface CuotaCronograma {
  NUMERO_CUOTA: string;
  FECHA_VENCIMIENTO: string;
  FECHA_PAGO: string;
  DIAS_MORA: number;
  CUOTA_TOTAL: string;
  PAGO_CAPITAL: string;
  PAGO_INTERES: string;
  DESGRAVAMEN: string;
  SEGURO: string;
  SALDO_PROYECTADO: string;
  ESTADO: string;
}

// Función para obtener el cronograma de pagos
export const getCronograma = async (idPrestamo: string): Promise<CuotaCronograma[]> => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const response = await fetch(`${API_BASE_URL}/api/cronograma`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pagare: idPrestamo
      })
    });

    if (!response.ok) {
      throw new Error(`Error al obtener el cronograma: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en getCronograma:', error);
    throw error;
  }
};