import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../../Layout';
import * as AplicacionPolizasService from '../service/aplicacionPolizas.Service';
import { AlertTriangle, CalendarClock, RotateCw, Search, ShieldAlert, Timer } from 'lucide-react';

interface AseguradoPorVencer {
	dni: string;
	id_asegurado: string;
	fecha_vence: string;
	dias_para_vencer: number;
	titular?: {
		nombres?: string;
		ape_pat?: string;
		ape_mat?: string;
		tipo_doc?: string;
		num_doc?: string;
		direccion?: string;
		correo?: string;
		celular?: string;
	};
	firma?: string;
}

interface PolizasPorVencerPageProps {
	onVolver: () => void;
}

const nombreCompleto = (titular?: AseguradoPorVencer['titular']) =>
	`${titular?.nombres || ''} ${titular?.ape_pat || ''} ${titular?.ape_mat || ''}`.trim();

const categoriaPorDias = (dias: number) => {
	if (dias <= 3) return 'critico';
	if (dias <= 7) return 'alerta';
	return 'normal';
};

const badgeDias = (dias: number) => {
	if (dias <= 0) return 'bg-rose-100 text-rose-700 border-rose-300';
	if (dias <= 3) return 'bg-rose-50 text-rose-700 border-rose-200';
	if (dias <= 7) return 'bg-amber-50 text-amber-700 border-amber-200';
	return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

const obtenerAseguradosGlobalPorVencerFn =
	(AplicacionPolizasService as { obtenerAseguradosGlobalPorVencer?: () => Promise<any[]> }).obtenerAseguradosGlobalPorVencer;

const PolizasPorVencerPage: React.FC<PolizasPorVencerPageProps> = ({ onVolver }) => {
	const [registros, setRegistros] = useState<AseguradoPorVencer[]>([]);
	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [busqueda, setBusqueda] = useState('');
	const [filtroUrgencia, setFiltroUrgencia] = useState<'TODAS' | 'CRITICO' | 'ALERTA' | 'NORMAL'>('TODAS');

	const cargar = async () => {
		try {
			if (typeof obtenerAseguradosGlobalPorVencerFn !== 'function') {
				throw new Error('Servicio de renovaciones no disponible en este momento.');
			}
			setCargando(true);
			setError(null);
			const data = await obtenerAseguradosGlobalPorVencerFn();
			const ordenado = [...(data || [])].sort((a, b) => Number(a.dias_para_vencer) - Number(b.dias_para_vencer));
			setRegistros(ordenado);
		} catch (e: any) {
			setError(e?.message || 'No se pudo cargar la lista de pólizas por vencer.');
			setRegistros([]);
		} finally {
			setCargando(false);
		}
	};

	useEffect(() => {
		void cargar();
	}, []);

	const filtrados = useMemo(() => {
		const q = busqueda.trim().toLowerCase();
		return registros.filter((r) => {
			const cat = categoriaPorDias(Number(r.dias_para_vencer || 0));
			if (filtroUrgencia === 'CRITICO' && cat !== 'critico') return false;
			if (filtroUrgencia === 'ALERTA' && cat !== 'alerta') return false;
			if (filtroUrgencia === 'NORMAL' && cat !== 'normal') return false;

			if (!q) return true;

			return (
				String(r.dni || '').toLowerCase().includes(q) ||
				String(r.id_asegurado || '').toLowerCase().includes(q) ||
				String(r.fecha_vence || '').toLowerCase().includes(q) ||
				String(r.titular?.correo || '').toLowerCase().includes(q) ||
				String(r.titular?.celular || '').toLowerCase().includes(q) ||
				nombreCompleto(r.titular).toLowerCase().includes(q)
			);
		});
	}, [registros, busqueda, filtroUrgencia]);

	const totalCritico = useMemo(
		() => registros.filter((r) => categoriaPorDias(Number(r.dias_para_vencer || 0)) === 'critico').length,
		[registros]
	);
	const totalAlerta = useMemo(
		() => registros.filter((r) => categoriaPorDias(Number(r.dias_para_vencer || 0)) === 'alerta').length,
		[registros]
	);

	return (
		<Layout title="Mi CumpaSeguro" showBackButton={true}>
			<div className="w-full min-w-0 px-3 sm:px-6 lg:px-8 py-4 space-y-5">
				<button
					onClick={onVolver}
					className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
				>
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
					Volver al Inicio
				</button>

				<div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm">
					<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-100">
						<div className="flex items-center gap-2.5">
							<div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
								<CalendarClock className="w-6 h-6" />
							</div>
							<div>
								<h1 className="text-xl sm:text-2xl font-bold text-slate-800">Renovaciones · Pólizas por Vencer</h1>
								<p className="text-xs sm:text-sm text-slate-500">Seguimiento preventivo para renovación de asegurados</p>
							</div>
						</div>

						<button
							onClick={cargar}
							disabled={cargando}
							className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 active:bg-slate-100 transition disabled:opacity-50 self-start lg:self-auto shadow-sm"
						>
							<RotateCw className={`w-4 h-4 ${cargando ? 'animate-spin text-blue-600' : ''}`} />
							Recargar
						</button>
					</div>

					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-5">
						<div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
							<span className="text-[11px] font-semibold uppercase text-slate-400 block tracking-wider">Total</span>
							<p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">{registros.length}</p>
						</div>
						<div className="bg-rose-50 border border-rose-200 rounded-lg p-3.5">
							<span className="text-[11px] font-semibold uppercase text-rose-500 block tracking-wider">Crítico (0-3 días)</span>
							<p className="text-xl sm:text-2xl font-bold text-rose-700 mt-1">{totalCritico}</p>
						</div>
						<div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5">
							<span className="text-[11px] font-semibold uppercase text-amber-500 block tracking-wider">Alerta (4-7 días)</span>
							<p className="text-xl sm:text-2xl font-bold text-amber-700 mt-1">{totalAlerta}</p>
						</div>
						<div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
							<span className="text-[11px] font-semibold uppercase text-slate-400 block tracking-wider">Mostrando</span>
							<p className="text-xl sm:text-2xl font-bold text-purple-700 mt-1">{filtrados.length}</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
					<div className="relative">
						<Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
						<input
							type="text"
							value={busqueda}
							onChange={(e) => setBusqueda(e.target.value)}
							placeholder="Buscar por titular, DNI, correo, celular o fecha..."
							className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
						/>
					</div>

					<div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 border-t border-slate-100 scrollbar-thin">
						<span className="text-xs font-semibold text-slate-500 shrink-0 flex items-center gap-1">
							<Timer className="w-3.5 h-3.5" /> Urgencia:
						</span>
						<button
							onClick={() => setFiltroUrgencia('TODAS')}
							className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition ${
								filtroUrgencia === 'TODAS' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
							}`}
						>
							Todas
						</button>
						<button
							onClick={() => setFiltroUrgencia('CRITICO')}
							className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition ${
								filtroUrgencia === 'CRITICO' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
							}`}
						>
							Crítico
						</button>
						<button
							onClick={() => setFiltroUrgencia('ALERTA')}
							className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition ${
								filtroUrgencia === 'ALERTA' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
							}`}
						>
							Alerta
						</button>
						<button
							onClick={() => setFiltroUrgencia('NORMAL')}
							className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition ${
								filtroUrgencia === 'NORMAL' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
							}`}
						>
							Normal
						</button>
					</div>
				</div>

				{error && (
					<div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-4 flex items-center gap-3">
						<ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
						<div>
							<p className="font-semibold">No se pudo cargar la información</p>
							<p className="text-xs text-red-600 mt-0.5">{error}</p>
						</div>
					</div>
				)}

				{cargando ? (
					<div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
						<div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
						<h3 className="text-base font-bold text-slate-700">Cargando pólizas por vencer...</h3>
						<p className="text-xs text-slate-500 mt-1">Conectando con el servicio de CumpaSeguro</p>
					</div>
				) : filtrados.length === 0 ? (
					<div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm space-y-3">
						<div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
							<AlertTriangle className="w-8 h-8" />
						</div>
						<h3 className="text-lg font-bold text-slate-700">Sin resultados</h3>
						<p className="text-xs text-slate-500 max-w-md mx-auto">
							No hay pólizas por vencer que coincidan con los filtros actuales.
						</p>
					</div>
				) : (
					<div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
						<div className="overflow-x-auto">
							<table className="min-w-[1100px] w-full text-sm">
								<thead className="bg-slate-50 border-b border-slate-200">
									<tr>
										<th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Titular</th>
										<th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">DNI</th>
										<th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">ID Asegurado</th>
										<th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Celular</th>
										<th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Correo</th>
										<th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Firma</th>
										<th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Fecha Vence</th>
										<th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">Días</th>
									</tr>
								</thead>
								<tbody>
									{filtrados.map((item, index) => {
										const dias = Number(item.dias_para_vencer || 0);
										const cat = categoriaPorDias(dias);
										const nombre = nombreCompleto(item.titular);

										return (
											<tr
												key={item.id_asegurado}
												className={`border-b border-slate-100 hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
											>
												<td className="px-3 py-2.5 text-slate-800 font-medium whitespace-nowrap">{nombre || 'Sin nombre'}</td>
												<td className="px-3 py-2.5 text-slate-700 font-mono whitespace-nowrap">{item.titular?.num_doc || item.dni || '-'}</td>
												<td className="px-3 py-2.5 text-slate-600 font-mono whitespace-nowrap">{item.id_asegurado}</td>
												<td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{item.titular?.celular || '-'}</td>
												<td className="px-3 py-2.5 text-slate-600 max-w-[260px] truncate">{item.titular?.correo || '-'}</td>
												<td className="px-3 py-2.5 whitespace-nowrap">
													<span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs uppercase">
														{String(item.firma || 'N/D')}
													</span>
												</td>
												<td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">{item.fecha_vence}</td>
												<td className="px-3 py-2.5 whitespace-nowrap">
													<span
														className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${badgeDias(dias)}`}
														title={
															cat === 'critico' ? 'Urgencia crítica' : cat === 'alerta' ? 'Urgencia media' : 'Urgencia normal'
														}
													>
														{dias <= 0 ? 'Vencido' : `${dias} día${dias === 1 ? '' : 's'}`}
													</span>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</div>
		</Layout>
	);
};

export default PolizasPorVencerPage;
