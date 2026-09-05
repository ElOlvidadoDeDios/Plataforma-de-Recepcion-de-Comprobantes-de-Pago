import { useCallback, useState } from 'react';
import { consultarDileScoreReal, consultarDileScoreSimulado, consultarInfoScoreDoc } from '../services/dileScore.Service';
import { DileScoreDocQueryResult, DileScoreInputData, DileScorePayload, DileScoreResult } from '../types';

interface UseDileScoreReturn {
    loading: boolean;
    infoLoading: boolean;
    scoreLoading: boolean;
    error: string | null;
    infoError: string | null;
    result: DileScoreResult | null;
    scoreResponse: unknown;
    consultarScore: (inputData: DileScoreInputData) => Promise<void>;
    consultarInfoDocumento: (dni: string) => Promise<DileScoreDocQueryResult>;
    submitScorePayload: (payload: DileScorePayload) => Promise<unknown>;
    limpiar: () => void;
}

export const useDileScore = (): UseDileScoreReturn => {
    const [loading, setLoading] = useState(false);
    const [infoLoading, setInfoLoading] = useState(false);
    const [scoreLoading, setScoreLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [infoError, setInfoError] = useState<string | null>(null);
    const [result, setResult] = useState<DileScoreResult | null>(null);
    const [scoreResponse, setScoreResponse] = useState<unknown>(null);

    const consultarScore = useCallback(async (inputData: DileScoreInputData) => {
        try {
            setLoading(true);
            setError(null);
            const data = await consultarDileScoreSimulado({
                dni: inputData.DNI.trim(),
                inputData,
            });
            setResult(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'No se pudo consultar el score';
            setError(message);
            setResult(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const consultarInfoDocumento = useCallback(async (dni: string) => {
        try {
            setInfoLoading(true);
            setInfoError(null);
            const data = await consultarInfoScoreDoc({ tipo_doc: '01', nro_doc: dni.trim() });
            return data;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'No se pudo obtener la informacion del documento';
            setInfoError(message);
            throw err;
        } finally {
            setInfoLoading(false);
        }
    }, []);

    const submitScorePayload = useCallback(async (payload: DileScorePayload) => {
        try {
            setScoreLoading(true);
            setError(null);
            const response = await consultarDileScoreReal(payload);
            setScoreResponse(response);
            return response;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'No se pudo enviar el score';
            setError(message);
            setScoreResponse(null);
            throw err;
        } finally {
            setScoreLoading(false);
        }
    }, []);

    const limpiar = useCallback(() => {
        setError(null);
        setInfoError(null);
        setResult(null);
        setScoreResponse(null);
    }, []);

    return {
        loading,
        infoLoading,
        scoreLoading,
        error,
        infoError,
        result,
        scoreResponse,
        consultarScore,
        consultarInfoDocumento,
        submitScorePayload,
        limpiar,
    };
};
