import React, { useState } from "react";
import { verificarSuministro as verificarSuministroAPI } from "../../api/geodileApi";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue?: () => void; // Callback para continuar el proceso
}

export default function ModalVerificarSuministro({ isOpen, onClose, onContinue }: ModalProps) {
    const [suministro, setSuministro] = useState<string>('');
    const [verificando, setVerificando] = useState<boolean>(false);
    const [resultado, setResultado] = useState<{
        existe: boolean;
        mensaje: string;
        socio?: string;
        responsable?: string;
        agencia?: string;
        fecha_re?: string;
        hora_re?: string;
        suministro_num?: string;
    } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSuministro(e.target.value);
        // Limpiar resultado anterior cuando cambie el suministro
        setResultado(null);
    };

    const handleVerificarSuministro = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!suministro.trim()) {
            alert('Por favor ingrese un número de suministro');
            return;
        }

        setVerificando(true);

        try {
            const response = await verificarSuministroAPI(suministro);

            if (response && response.status === true) {
                // Formatear fecha si viene en formato especial
                let fechaFormateada = '';
                if (response.fecha_re) {
                    try {
                        // Si viene como objeto con $date
                        const fechaObj: any = response.fecha_re;
                        if (typeof fechaObj === 'object' && fechaObj.$date) {
                            const timestamp = typeof fechaObj.$date === 'object' && fechaObj.$date.$numberLong
                                ? parseInt(fechaObj.$date.$numberLong)
                                : fechaObj.$date;
                            fechaFormateada = new Date(timestamp).toLocaleDateString('es-PE');
                        } else {
                            // Si viene como string o timestamp normal
                            fechaFormateada = new Date(fechaObj).toLocaleDateString('es-PE');
                        }
                    } catch (error) {
                        fechaFormateada = 'Fecha inválida';
                    }
                }

                setResultado({
                    existe: true,
                    mensaje: "Este suministro ya está registrado en nuestra base de datos. No puede continuar.",
                    socio: response.socio,
                    responsable: response.responsable,
                    agencia: response.agencia,
                    fecha_re: fechaFormateada,
                    hora_re: response.hora_re,
                    suministro_num: response.suministro
                });
            } else {
                setResultado({
                    existe: false,
                    mensaje: "El suministro no existe en nuestra base de datos. Puede continuar con el registro."
                });
            }
        } catch (error) {
            setResultado({
                existe: false,
                mensaje: "Error al verificar el suministro. Intente nuevamente"
            });
        } finally {
            setVerificando(false);
        }
    };

    const handleContinuar = () => {
        if (onContinue) {
            onContinue();
        }
        handleCerrar();
    };

    const handleCerrar = () => {
        setSuministro('');
        setResultado(null);
        setVerificando(false);
        onClose();
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
                    <h2 className="text-lg font-semibold uppercase">Verificar Suministro</h2>
                    <button onClick={handleCerrar} className="text-white hover:text-gray-200">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M2 12c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12zm7.707-3.707a1 1 0 00-1.414 0 1 1 0 000 1.414L10.586 12l-2.293 2.293a1 1 0 001.414 1.414L12 13.414l2.293 2.293a1 1 0 001.414-1.414L13.414 12l2.293-2.293a1 1 0 00-1.414-1.414L12 10.586 9.707 8.293z"
                            />
                        </svg>
                    </button>
                </div>

                <div className="p-4">
                    <form onSubmit={handleVerificarSuministro} className="w-full">
                        <div className="mb-4">
                            <label htmlFor="suministro" className="block mb-2 text-sm font-medium text-blue-800">
                                Número de Suministro
                            </label>
                            <div className="flex">
                                <input
                                    type="text"
                                    id="suministro"
                                    name="suministro"
                                    value={suministro}
                                    onChange={handleChange}
                                    className="flex-1 bg-blue-50 border border-blue-300 text-blue-900 text-sm rounded-l-lg focus:ring-2 focus:ring-blue-500 p-2.5"
                                    placeholder="Ingrese número de suministro"
                                    disabled={verificando}
                                />
                                <button
                                    type="submit"
                                    disabled={verificando || !suministro.trim()}
                                    className="bg-blue-600 text-white px-4 py-2.5 rounded-r-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                                >
                                    {verificando ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Verificando...
                                        </div>
                                    ) : (
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {resultado && (
                            <div
                                className={`p-4 rounded-lg mb-4 ${
                                    resultado.existe ? 'bg-red-100 border border-red-300' : 'bg-green-100 border border-green-300'
                                }`}
                            >
                                <div className="flex items-center">
                                    {resultado.existe ? (
                                        <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )}
                                    <div className="flex-1">
                                        <p className={`font-semibold ${resultado.existe ? 'text-red-800' : 'text-green-800'}`}>
                                            {resultado.mensaje}
                                        </p>
                                        {resultado.existe && (
                                            <div className="text-red-700 text-sm mt-2 space-y-1">
                                                {resultado.suministro_num && (
                                                    <p><span className="font-medium">Suministro:</span> {resultado.suministro_num}</p>
                                                )}
                                                {resultado.socio && (
                                                    <p><span className="font-medium">Socio:</span> {resultado.socio}</p>
                                                )}
                                                {resultado.responsable && (
                                                    <p><span className="font-medium">Responsable:</span> {resultado.responsable}</p>
                                                )}
                                                {resultado.agencia && (
                                                    <p><span className="font-medium">Agencia:</span> {resultado.agencia}</p>
                                                )}
                                                {resultado.fecha_re && (
                                                    <p><span className="font-medium">Fecha de Registro:</span> {resultado.fecha_re}</p>
                                                )}
                                                {resultado.hora_re && (
                                                    <p><span className="font-medium">Hora de Registro:</span> {resultado.hora_re}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>

                    <div className="flex justify-end gap-3 pt-4 border-t-2 border-blue-200">
                        {resultado && !resultado.existe && onContinue && (
                            <button
                                onClick={handleContinuar}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg border-2 border-blue-600 hover:bg-blue-700"
                            >
                                Continuar Proceso
                            </button>
                        )}
                        <button
                            onClick={handleCerrar}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg border-2 border-red-500 hover:bg-red-600"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}