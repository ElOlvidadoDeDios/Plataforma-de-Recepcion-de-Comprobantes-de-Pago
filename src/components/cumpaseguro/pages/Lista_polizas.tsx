import React, { useState } from 'react';
import Layout from '../../Layout';
import { PolizaPorAplicar } from '../AplicacionPolizas.types';
import { useListaPolizasGlobal } from '../hooks/useListaPolizasGlobal';
import ImageLightbox, { ImagenGaleria } from '../components/Imagelightbox';
import {
	CheckCircle2,
	Building2,
	Search,
	RotateCw,
	Download,
	Layers,
	ListFilter,
	ShieldAlert,
} from 'lucide-react';
import FilaPolizaLista from '../components/aplicacion_polizas/Filapolizalista';
import ModalDetallePoliza from '../components/aplicacion_polizas/Modaldetallepoliza';
import ModalContratoPDF from '../components/aplicacion_polizas/Modalcontratopdf';
import { exportarPolizasExcel } from '../components/polizas_excel';

interface ListaPolizasPageProps {
	onVolver: () => void;
}

const ListaPolizasPage: React.FC<ListaPolizasPageProps> = ({ onVolver }) => {
	const {
		polizas,
		cantidad,
		cargando,
		error,
		recargar,
		busqueda,
		setBusqueda,
		agenciaSeleccionada,
		setAgenciaSeleccionada,
		listaAgencias,
		polizasFiltradas,
		polizasPorAgencia,
		totalMonto,
	} = useListaPolizasGlobal();

	const [lightbox, setLightbox] = useState<{ galeria: ImagenGaleria[]; indice: number } | null>(null);
	const [pdfModal, setPdfModal] = useState<{ url: string; titulo: string } | null>(null);
	const [polizaSeleccionada, setPolizaSeleccionada] = useState<PolizaPorAplicar | null>(null);
	const [vistaModo, setVistaModo] = useState<'agencias' | 'lista'>('agencias');
	const [exportandoExcel, setExportandoExcel] = useState(false);

	const abrirGaleria = (galeria: ImagenGaleria[], indice: number) => {
		setLightbox({ galeria, indice });
	};

	const abrirContratoPDF = (url: string, titulo: string) => {
		setPdfModal({ url, titulo });
	};

	const handleExportarExcel = async () => {
		if (polizasFiltradas.length === 0) return;
		try {
			setExportandoExcel(true);
			await exportarPolizasExcel(polizasFiltradas);
		} finally {
			setExportandoExcel(false);
		}
	};

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
						<div>
							<div className="flex items-center gap-2.5">
								<div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
									<CheckCircle2 className="w-6 h-6" />
								</div>
								<div>
									<h1 className="text-xl sm:text-2xl font-bold text-slate-800">Lista Global de Asegurados</h1>
									<p className="text-xs sm:text-sm text-slate-500">Listado general de asegurados con visualizacion de detalle</p>
								</div>
							</div>
						</div>

						<div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
							<button
								onClick={handleExportarExcel}
								disabled={exportandoExcel || polizasFiltradas.length === 0}
								className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-emerald-300 text-emerald-700 text-xs sm:text-sm font-semibold hover:bg-emerald-50 transition disabled:opacity-50 shadow-sm"
							>
								<Download className="w-4 h-4" />
								{exportandoExcel ? 'Generando Excel...' : 'Generar Excel'}
							</button>

							<button
								onClick={recargar}
								disabled={cargando}
								className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 active:bg-slate-100 transition disabled:opacity-50 shadow-sm"
							>
								<RotateCw className={`w-4 h-4 ${cargando ? 'animate-spin text-blue-600' : ''}`} />
								Recargar
							</button>
						</div>
					</div>

					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-5">
						<div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
							<span className="text-[11px] font-semibold uppercase text-slate-400 block tracking-wider">Total Registros</span>
							<p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">{cantidad}</p>
						</div>
						<div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
							<span className="text-[11px] font-semibold uppercase text-slate-400 block tracking-wider">Agencias</span>
							<p className="text-xl sm:text-2xl font-bold text-blue-700 mt-1">{listaAgencias.length}</p>
						</div>
						<div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
							<span className="text-[11px] font-semibold uppercase text-slate-400 block tracking-wider">Monto Filtrado</span>
							<p className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">S/ {totalMonto}</p>
						</div>
						<div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
							<span className="text-[11px] font-semibold uppercase text-slate-400 block tracking-wider">Mostrando</span>
							<p className="text-xl sm:text-2xl font-bold text-purple-700 mt-1">{polizasFiltradas.length}</p>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
					<div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
						<div className="relative flex-1">
							<Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
							<input
								type="text"
								value={busqueda}
								onChange={(e) => setBusqueda(e.target.value)}
								placeholder="Buscar por titular, DNI, celular, correo o usuario..."
								className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
							/>
							{busqueda && (
								<button
									onClick={() => setBusqueda('')}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
								>
									✕
								</button>
							)}
						</div>

						<div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-start md:self-auto border border-slate-200">
							<button
								onClick={() => setVistaModo('agencias')}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
									vistaModo === 'agencias' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
								}`}
							>
								<Layers className="w-3.5 h-3.5" />
								Por Agencia
							</button>
							<button
								onClick={() => setVistaModo('lista')}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
									vistaModo === 'lista' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
								}`}
							>
								<ListFilter className="w-3.5 h-3.5" />
								Todas ({polizasFiltradas.length})
							</button>
						</div>
					</div>

					<div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 border-t border-slate-100 scrollbar-thin">
						<span className="text-xs font-semibold text-slate-500 shrink-0 flex items-center gap-1">
							<Building2 className="w-3.5 h-3.5" /> Agencia:
						</span>
						<button
							onClick={() => setAgenciaSeleccionada('TODAS')}
							className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition ${
								agenciaSeleccionada === 'TODAS' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
							}`}
						>
							Todas ({polizas.length})
						</button>
						{listaAgencias.map((ag) => {
							const count = polizas.filter((p) => p.agencia_nom?.trim().toUpperCase() === ag).length;
							return (
								<button
									key={ag}
									onClick={() => setAgenciaSeleccionada(ag)}
									className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition ${
										agenciaSeleccionada === ag ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
									}`}
								>
									{ag} ({count})
								</button>
							);
						})}
					</div>
				</div>

				{error && (
					<div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-4 flex items-center gap-3">
						<ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
						<div>
							<p className="font-semibold">No se pudo cargar la informacion</p>
							<p className="text-xs text-red-600 mt-0.5">{error}</p>
						</div>
					</div>
				)}

				{cargando ? (
					<div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
						<div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
						<h3 className="text-base font-bold text-slate-700">Cargando lista global...</h3>
						<p className="text-xs text-slate-500 mt-1">Conectando con el servicio de CumpaSeguro</p>
					</div>
				) : polizasFiltradas.length === 0 ? (
					<div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm space-y-3">
						<div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
							<CheckCircle2 className="w-8 h-8" />
						</div>
						<h3 className="text-lg font-bold text-slate-700">No hay asegurados para mostrar</h3>
						<p className="text-xs text-slate-500 max-w-md mx-auto">
							{busqueda
								? 'No se encontraron resultados que coincidan con la busqueda actual.'
								: 'No hay registros disponibles en la lista global.'}
						</p>
					</div>
				) : vistaModo === 'agencias' ? (
					<div className="space-y-6">
						{Object.entries(polizasPorAgencia).map(([agencia, lista]) => (
							<div key={agencia} className="space-y-2.5">
								<div className="flex items-center justify-between bg-slate-800 text-white px-4 py-2.5 rounded-xl shadow-sm">
									<div className="flex items-center gap-2">
										<Building2 className="w-4 h-4 text-cyan-400" />
										<h2 className="font-bold text-sm sm:text-base tracking-wide">{agencia}</h2>
									</div>
									<span className="bg-white/20 text-white font-semibold text-xs px-2.5 py-0.5 rounded-full">
										{lista.length} {lista.length === 1 ? 'registro' : 'registros'}
									</span>
								</div>

								<div className="space-y-2">
									{lista.map((poliza) => (
										<FilaPolizaLista key={poliza._id} poliza={poliza} onClick={() => setPolizaSeleccionada(poliza)} />
									))}
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="space-y-2">
						{polizasFiltradas.map((poliza) => (
							<FilaPolizaLista key={poliza._id} poliza={poliza} onClick={() => setPolizaSeleccionada(poliza)} />
						))}
					</div>
				)}
			</div>

			{polizaSeleccionada && (
				<ModalDetallePoliza
					poliza={polizaSeleccionada}
					onClose={() => setPolizaSeleccionada(null)}
					onVerGaleria={abrirGaleria}
					onVerContratoPDF={abrirContratoPDF}
					mostrarAccionAplicar={false}
				/>
			)}

			{lightbox && (
				<ImageLightbox
					imagenes={lightbox.galeria}
					indiceInicial={lightbox.indice}
					onClose={() => setLightbox(null)}
				/>
			)}

			{pdfModal && <ModalContratoPDF url={pdfModal.url} titulo={pdfModal.titulo} onClose={() => setPdfModal(null)} />}
		</Layout>
	);
};

export default ListaPolizasPage;
