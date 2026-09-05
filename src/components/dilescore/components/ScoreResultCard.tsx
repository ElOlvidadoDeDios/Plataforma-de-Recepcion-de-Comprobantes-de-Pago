import React from 'react';
import { DileScoreResult } from '../types';

interface ScoreResultCardProps {
  result: DileScoreResult;
}

const getNivelClasses = (nivel: DileScoreResult['nivel']) => {
  if (nivel === 'ALTO') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (nivel === 'MEDIO') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-rose-100 text-rose-800 border-rose-200';
};

const ScoreResultCard: React.FC<ScoreResultCardProps> = ({ result }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Resultado simulado de DileScore</h3>
          <p className="text-sm text-slate-500">DNI consultado: {result.dni}</p>
        </div>
        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getNivelClasses(result.nivel)}`}>
          Nivel {result.nivel}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Score</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{result.score}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Nivel</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{result.nivel}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Fecha</p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {new Date(result.fechaConsulta).toLocaleString('es-PE')}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Recomendacion</p>
        <p className="mt-1 text-sm text-slate-700">{result.recomendacion}</p>
      </div>
    </div>
  );
};

export default ScoreResultCard;
