import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../Layout';
import { SessionManager } from '../../../utils/sessionManager';
import {
  DetalleCuentaAhorroData,
  getDetalleCuentaAhorroSocio,
} from '../services/consultaahorro.service';

const ClienteAhorro: React.FC = () => {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [cuentaConsultada, setCuentaConsultada] = useState('');
	const [detalle, setDetalle] = useState<DetalleCuentaAhorroData | null>(null);

	useEffect(() => {
		const loadDetalleAhorro = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const rawCliente = SessionManager.getItem('clienteAhorroSeleccionado');
				if (!rawCliente) {
					setError('No se encontró una cuenta seleccionada. Regrese y seleccione un socio.');
					return;
				}

				const cliente = JSON.parse(rawCliente) as { CUENTA?: string };
				if (!cliente?.CUENTA) {
					setError('El socio seleccionado no tiene cuenta de ahorro disponible.');
					return;
				}

				setCuentaConsultada(cliente.CUENTA);
				const data = await getDetalleCuentaAhorroSocio(cliente.CUENTA);
				setDetalle(data);
			} catch (loadError) {
				setError(
					loadError instanceof Error
						? loadError.message
						: 'No se pudo cargar el detalle de cuenta de ahorro.',
				);
			} finally {
				setIsLoading(false);
			}
		};

		loadDetalleAhorro();
	}, []);

	return (
		<Layout title="Cuentas de Ahorro" showBackButton={true}>
			<div className="h-full w-full bg-gradient-to-r from-cyan-50 to-teal-50 p-4">
				<div className="mb-4 bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:shadow-xl p-4 md:p-6">
					<div className="flex flex-col mb-3">
						<div className="flex items-start justify-between gap-3 mb-2">
							<div className="flex items-center gap-3">
								<div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center">
									<svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a5 5 0 00-10 0v2m-2 0h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2z" />
									</svg>
								</div>
								<div>
									<h2 className="text-lg md:text-xl font-bold text-gray-800">Cuentas de Ahorro</h2>
									{cuentaConsultada && (
										<p className="text-xs md:text-sm text-gray-500">
											Cuenta consultada: <span className="font-medium text-cyan-600">{cuentaConsultada}</span>
										</p>
									)}
								</div>
							</div>
							<button
								type="button"
								onClick={() => navigate('/consulta-clientes')}
								className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-4 py-2 rounded-md transition-colors whitespace-nowrap"
							>
								Volver a Consulta de Socios
							</button>
						</div>
						<div className="h-1 bg-gradient-to-r from-cyan-500 to-teal-500 rounded" />
					</div>

					{isLoading && (
						<div className="mb-6 flex items-center gap-3 rounded-lg border border-cyan-100 bg-cyan-50 p-4 text-cyan-800">
							<div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
							<span>Cargando detalle de cuenta de ahorro...</span>
						</div>
					)}

					{!isLoading && error && (
						<div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
							<p className="font-semibold">No se pudo cargar la información</p>
							<p className="text-sm mt-1">{error}</p>
						</div>
					)}

					{!isLoading && !error && detalle && (
						<div className="space-y-6 mb-6">
							<div>
								<h3 className="text-md md:text-lg font-semibold text-cyan-500 pb-2 mb-4 border-b-4 border-cyan-500 flex items-center">
									<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
									DATOS DEL SOCIO
								</h3>
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
									<DataField label="DNI" value={detalle.datos_socio.nro_di || 'N/A'} />
									<DataField label="NOMBRES" value={detalle.datos_socio.nombres || 'N/A'} />
									<DataField label="APELLIDO PATERNO" value={detalle.datos_socio.apellido_pat || 'N/A'} />
									<DataField label="APELLIDO MATERNO" value={detalle.datos_socio.apellido_mat || 'N/A'} />
									<DataField label="CELULAR" value={detalle.datos_socio.telefono || 'N/A'} />
									<DataField label="CORREO" value={detalle.datos_socio.email || 'N/A'} />
									<DataField label="EDAD" value={`${detalle.datos_socio.edad ?? 'N/A'}`} />
									<DataField label="ESTADO CIVIL" value={detalle.datos_socio.estado_civil || 'N/A'} />
								</div>
							</div>

							<div>
								<h3 className="text-md md:text-lg font-semibold text-cyan-500 pb-2 mb-4 border-b-4 border-cyan-500 flex items-center">
									<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
									DIRECCIÓN
								</h3>
								<div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 md:px-4 md:py-3 flex flex-col md:flex-row md:items-center border border-gray-200 hover:border-cyan-200 transition-colors mb-2">
									<div className="font-medium text-gray-600 w-full md:w-1/3 text-sm md:text-base mb-1 md:mb-0">DIRECCIÓN</div>
									<div className="w-full md:w-2/3 md:text-right text-gray-800 font-semibold text-sm md:text-base">
										{detalle.demografica.direccion || 'N/A'}
									</div>
								</div>
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
									<DataField label="DEPARTAMENTO" value={detalle.demografica.departamento || 'N/A'} />
									<DataField label="PROVINCIA" value={detalle.demografica.provincia || 'N/A'} />
									<DataField label="DISTRITO" value={detalle.demografica.distrito || 'N/A'} />
								</div>
							</div>

							<div>
								<h2 className="text-lg font-bold uppercase text-cyan-800 mb-3 pb-2 border-b-2 border-cyan-200">
									CUENTAS DE AHORRO ({detalle.cuentas_ahorro.length})
								</h2>
								<div className="hidden lg:block w-full overflow-x-auto">
									<table className="w-full whitespace-nowrap table-auto border-collapse">
										<thead>
											<tr className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white sticky top-0 z-10">
												<th className="px-2 py-3 text-xs md:text-sm font-semibold text-white border border-white text-left">CUENTA</th>
												<th className="px-2 py-3 text-xs md:text-sm font-semibold text-white border border-white text-left">PRODUCTO</th>
												<th className="px-2 py-3 text-xs md:text-sm font-semibold text-white border border-white text-right">SALDO ACTUAL</th>
												<th className="px-2 py-3 text-xs md:text-sm font-semibold text-white border border-white text-right">SALDO INTERÉS</th>
												<th className="px-2 py-3 text-xs md:text-sm font-semibold text-white border border-white text-center">TEA</th>
												<th className="px-2 py-3 text-xs md:text-sm font-semibold text-white border border-white text-center">ESTADO</th>
												<th className="px-2 py-3 text-xs md:text-sm font-semibold text-white border border-white text-center">FEC. APERTURA</th>
												<th className="px-2 py-3 text-xs md:text-sm font-semibold text-white border border-white text-center">FEC. ÚLT. MOV.</th>
                                                <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white border border-white text-center">ACCIONES</th>
											</tr>
										</thead>
										<tbody>
											{detalle.cuentas_ahorro.map((cuenta, index) => (
												<tr key={`${cuenta.cta_aho}-${cuenta.producto}-${index}`} className="transition-colors duration-200 ease-in-out hover:bg-gradient-to-r hover:from-cyan-50 hover:to-teal-50">
													<td className="px-4 py-2 text-sm border border-gray-200">{cuenta.cta_aho || 'N/A'}</td>
													<td className="px-4 py-2 text-sm border border-gray-200">{cuenta.producto || 'N/A'}</td>
													<td className="px-4 py-2 text-sm border border-gray-200 text-right">S/ {(cuenta.saldo_actual || 0).toFixed(2)}</td>
													<td className="px-4 py-2 text-sm border border-gray-200 text-right">S/ {(cuenta.saldo_interes || 0).toFixed(2)}</td>
													<td className="px-4 py-2 text-sm border border-gray-200 text-center">{cuenta.tea ?? 0}%</td>
													<td className="px-4 py-2 text-sm border border-gray-200 text-center">{cuenta.estado || 'N/A'}</td>
													<td className="px-4 py-2 text-sm border border-gray-200 text-center">{cuenta.fecha_apert || 'N/A'}</td>
													<td className="px-4 py-2 text-sm border border-gray-200 text-center">{cuenta.fecha_ult_mov || 'N/A'}</td>
                                                    
												</tr>
											))}
										</tbody>
									</table>
								</div>

								<div className="lg:hidden">
									{detalle.cuentas_ahorro.map((cuenta, index) => (
										<div key={`${cuenta.cta_aho}-${cuenta.producto}-${index}`} className="bg-white rounded-lg shadow-md p-3 mb-3">
											<div className="flex justify-between items-center mb-2">
												<h3 className="text-sm font-bold text-cyan-800">{cuenta.producto || 'SIN PRODUCTO'}</h3>
												<span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
													{cuenta.estado || 'N/A'}
												</span>
											</div>
											<div className="grid grid-cols-2 gap-1.5">
												<InfoField label="Cuenta" value={cuenta.cta_aho || 'N/A'} />
												<InfoField label="TEA" value={`${cuenta.tea ?? 0}%`} />
												<InfoField label="Saldo actual" value={`S/ ${(cuenta.saldo_actual || 0).toFixed(2)}`} />
												<InfoField label="Saldo interés" value={`S/ ${(cuenta.saldo_interes || 0).toFixed(2)}`} />
												<InfoField label="Tipo CTA" value={cuenta.tipo_cta || 'N/A'} />
												<InfoField label="Carácter" value={cuenta.caracter || 'N/A'} />
											</div>
											<div className="mt-2 grid grid-cols-1">
												<InfoField label="Apertura" value={cuenta.fecha_apert || 'N/A'} />
												<InfoField label="Últ. Mov." value={cuenta.fecha_ult_mov || 'N/A'} />
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					)}

				</div>
			</div>
		</Layout>
	);
};

const DataField = ({ label, value }: { label: string; value: string }) => (
	<div className="bg-gradient-to-r from-gray-50 to-white rounded-lg px-3 py-2 flex items-center border border-gray-200 hover:border-cyan-200 transition-colors">
		<div className="font-medium text-gray-600 w-1/3 text-sm md:text-base">{label}</div>
		<div className="w-2/3 text-right text-gray-800 font-semibold text-sm md:text-base truncate">{value}</div>
	</div>
);

const InfoField = ({ label, value }: { label: string; value: string }) => (
	<div>
		<p className="text-sm text-gray-600">{label}</p>
		<p className="font-medium">{value}</p>
	</div>
);

export default ClienteAhorro;
