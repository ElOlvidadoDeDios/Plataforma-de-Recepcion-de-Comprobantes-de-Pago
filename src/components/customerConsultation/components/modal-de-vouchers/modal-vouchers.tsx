import { memo, useContext, useState } from 'react';
import { AuthContext } from '../../../../contexts/AuthContext';
import { PaymentRecord } from '../../../../types';
import { PaymentImage } from '../../../PaymentImage';
import { VoucherData, generateVoucherPDF, generateVoucherPDFBlobUrl, generateVoucherPDFDataUri } from '../../../pagos_recaudadores/vaucher_pdf';
import { extraerVoucherExterno } from '../../services/vouchers.service';

interface PagosModalProps {
	selectedCreditoId: string;
	pagosData: PaymentRecord[];
	onClose: () => void;
}

interface VoucherPreviewItem {
	url: string;
	previewSrc: string;
	fileName: string;
	voucherData: VoucherData;
}

const esRechazado = (estado?: string): boolean => {
	return String(estado || '').trim().toLowerCase() === 'rechazado';
};

const PagosModal = memo(({ selectedCreditoId, pagosData, onClose }: PagosModalProps) => {
	const authContext = useContext(AuthContext);
	const { user } = authContext || {};
	const [isExtracting, setIsExtracting] = useState(false);
	const [extractError, setExtractError] = useState<string | null>(null);
	const [previewVouchers, setPreviewVouchers] = useState<VoucherPreviewItem[]>([]);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);
	const [previewIndex, setPreviewIndex] = useState(0);

	const cerrarPreview = () => {
		previewVouchers.forEach((item) => URL.revokeObjectURL(item.url));
		setPreviewVouchers([]);
		setPreviewIndex(0);
		setIsPreviewOpen(false);
	};

	const descargarPreviewActual = () => {
		const actual = previewVouchers[previewIndex];
		if (!actual) {
			return;
		}

		generateVoucherPDF(actual.voucherData);
	};

	const descargarTodos = () => {
		previewVouchers.forEach((item) => {
			generateVoucherPDF(item.voucherData);
		});
	};

	const handleExtraerVouchers = async (pago: PaymentRecord) => {
		if (esRechazado(pago.estadoGeneral)) {
			setExtractError('El pago está en estado RECHAZADO y no tiene vouchers válidos para extraer.');
			return;
		}

		const vouchers = pago.comprobantebase_64 || [];
		const vouchersConOperacion = vouchers.filter(
			(comprobante) => Boolean(comprobante?.nroOperacion) && !esRechazado(comprobante?.estado),
		);

		if (vouchersConOperacion.length === 0) {
			setExtractError('No se encontraron vouchers válidos para extraer (los rechazados no aplican).');
			return;
		}

		setIsExtracting(true);
		setExtractError(null);

		try {
			const previews: VoucherPreviewItem[] = [];

			for (const comprobante of vouchersConOperacion) {
				const voucherData = await extraerVoucherExterno(
					{
						pagare: pago.creditoId,
						nroOperacion: String(comprobante.nroOperacion || '').trim(),
						fecha: pago.fecha,
						hora: pago.hora,
						dni: pago.dni,
					},
					user || undefined,
				);

				const url = generateVoucherPDFBlobUrl(voucherData);
				const recibo = String(voucherData?.RECIBO || comprobante.nroOperacion || 'voucher').trim();
				previews.push({
					url,
					previewSrc: generateVoucherPDFDataUri(voucherData),
					fileName: `Voucher_${recibo}.pdf`,
					voucherData,
				});
			}

			if (previews.length > 0) {
				setPreviewVouchers(previews);
				setPreviewIndex(0);
				setIsPreviewOpen(true);
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Error al extraer voucher';
			setExtractError(message);
		} finally {
			setIsExtracting(false);
		}
	};

	return (
		<>
		<div
			className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4"
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					onClose();
				}
			}}
		>
			<div
				className="bg-white rounded-lg shadow-xl max-w-[85vw] w-full max-h-[95vh] overflow-hidden"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 sm:px-6 py-3 flex justify-between items-center">
					<h2 className="text-lg sm:text-xl font-bold">
						Pagos del Préstamo: {selectedCreditoId}
					</h2>
					<button
						onClick={() => {
							if (isPreviewOpen) {
								cerrarPreview();
							}
							onClose();
						}}
						className="text-white hover:text-gray-200 transition-colors p-1"
					>
						<svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
							<path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
						</svg>
					</button>
				</div>

				<div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-60px)]">
					{extractError && (
						<div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
							{extractError}
						</div>
					)}
					{pagosData.length === 0 ? (
						<div className="text-center py-8">
							<div className="text-gray-500 text-lg">No se encontraron pagos para este préstamo</div>
						</div>
					) : (
						<div className="space-y-6">
							{pagosData.map((pago, index) => (
								<div key={`${pago.dni}-${pago.fecha}-${pago.hora}-${index}`} className="border rounded-lg p-4 bg-gray-50">
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
										<div>
											<h3 className="font-semibold text-lg text-cyan-800">📅 {pago.fecha} - {pago.hora}</h3>
											<p className="text-sm text-gray-600">Cliente: {pago.nombreSocio}</p>
											<p className="text-sm text-gray-600">DNI: {pago.dni}</p>
										</div>
										<div>
											<p className="text-sm text-gray-600">Cuotas Vencidas: <span className="font-medium">{pago.cuotasVencidasCantidad}</span></p>
											<p className="text-sm text-gray-600">Estado General:
												<span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
													pago.estadoGeneral === 'atendido' ? 'bg-green-100 text-green-800' :
													pago.estadoGeneral === 'parcial' ? 'bg-yellow-100 text-yellow-800' :
													'bg-gray-100 text-gray-800'
												}`}>
													{pago.estadoGeneral.toUpperCase()}
												</span>
											</p>
										</div>
									</div>

									<div className="mb-4 flex justify-end">
										<button
											type="button"
											onClick={() => handleExtraerVouchers(pago)}
											disabled={
												esRechazado(pago.estadoGeneral) ||
												!pago.comprobantebase_64 ||
												pago.comprobantebase_64.filter((comprobante) => Boolean(comprobante?.nroOperacion) && !esRechazado(comprobante?.estado)).length === 0
											}
											className="px-3 py-2 rounded-md bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
										>
											{isExtracting ? 'Extrayendo...' : 'Extraer vouchers'}
										</button>
									</div>

									<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
										{pago.comprobantebase_64?.map((comprobante, compIndex) => (
											<div key={`${comprobante._id}-${compIndex}`} className="border rounded-lg p-2 bg-white shadow-sm">
												<div className="aspect-[3/4] mb-2 bg-gray-100 rounded overflow-hidden">
													<PaymentImage
														imageSource={comprobante.ruta}
														alt={`Comprobante ${compIndex + 1}`}
													/>
												</div>
												<div className="space-y-1">
													<div className="flex justify-between items-center">
														<span className="text-xs font-medium">Estado:</span>
														<span className={`px-2 py-1 rounded text-xs font-medium ${
															comprobante.estado === 'aceptado' ? 'bg-green-100 text-green-800' :
															comprobante.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
															'bg-yellow-100 text-yellow-800'
														}`}>
															{comprobante.estado.toUpperCase()}
														</span>
													</div>
													{comprobante.monto_pago && (
														<div className="flex justify-between items-center">
															<span className="text-xs font-medium">Monto:</span>
															<span className="text-xs">S/ {comprobante.monto_pago}</span>
														</div>
													)}
													{comprobante.nroOperacion && (
														<div className="flex justify-between items-center">
															<span className="text-xs font-medium">Nro. Op:</span>
															<span className="text-xs">{comprobante.nroOperacion}</span>
														</div>
													)}
													{comprobante.tipoOperacion && (
														<div className="flex justify-between items-center">
															<span className="text-xs font-medium">Tipo:</span>
															<span className="text-xs">{comprobante.tipoOperacion}</span>
														</div>
													)}
													{comprobante.motivo_rechazo && (
														<div className="mt-2">
															<span className="text-xs font-medium text-red-600">Motivo rechazo:</span>
															<p className="text-xs text-red-600 mt-1">{comprobante.motivo_rechazo}</p>
														</div>
													)}
													{comprobante.fechamodificacion && (
														<div className="mt-2">
															<span className="text-xs font-medium text-red-600">Fecha transacción:</span>
															<p className="text-xs font-medium text-blue-600 mt-1">{comprobante.fechamodificacion}</p>
														</div>
													)}
													{comprobante.horamodificacion && (
														<div className="mt-2">
															<span className="text-xs font-medium text-red-600">Hora transacción:</span>
															<p className="text-xs font-medium text-blue-600 mt-1">{comprobante.horamodificacion}</p>
														</div>
													)}
													{comprobante.user_caja && (
														<div className="mt-2">
															<span className="text-xs font-medium text-red-600">Usuario:</span>
															<p className="text-xs font-medium text-blue-600 mt-1">{comprobante.user_caja}</p>
														</div>
													)}
												</div>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>

		{isPreviewOpen && previewVouchers.length > 0 && (
			<div
				className="fixed inset-0 z-[10001] bg-black/70 flex items-center justify-center p-3"
				onClick={(e) => {
					if (e.target === e.currentTarget) {
						cerrarPreview();
					}
				}}
			>
				<div className="w-full max-w-5xl h-[88vh] rounded-lg bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
					<div className="bg-cyan-600 text-white px-4 py-3 flex flex-wrap gap-2 items-center justify-between">
						<p className="text-sm font-semibold">
							Previsualización de voucher {previewIndex + 1} de {previewVouchers.length}
						</p>
						<div className="flex flex-wrap gap-2">
							{previewVouchers.length > 1 && (
								<>
									<button
										type="button"
										onClick={() => setPreviewIndex((prev) => Math.max(0, prev - 1))}
										disabled={previewIndex === 0}
										className="px-3 py-1 rounded-md bg-white text-cyan-700 text-sm disabled:opacity-50"
									>
										Anterior
									</button>
									<button
										type="button"
										onClick={() => setPreviewIndex((prev) => Math.min(previewVouchers.length - 1, prev + 1))}
										disabled={previewIndex === previewVouchers.length - 1}
										className="px-3 py-1 rounded-md bg-white text-cyan-700 text-sm disabled:opacity-50"
									>
										Siguiente
									</button>
								</>
							)}
							<button
								type="button"
								onClick={descargarPreviewActual}
								className="px-3 py-1 rounded-md bg-blue-700 text-white text-sm"
							>
								Descargar actual
							</button>
							{previewVouchers.length > 1 && (
								<button
									type="button"
									onClick={descargarTodos}
									className="px-3 py-1 rounded-md bg-blue-900 text-white text-sm"
								>
									Descargar todos
								</button>
							)}
							<button
								type="button"
								onClick={cerrarPreview}
								className="px-3 py-1 rounded-md bg-gray-200 text-gray-800 text-sm"
							>
								Cerrar
							</button>
						</div>
					</div>
					<div className="h-[calc(88vh-56px)] bg-gray-100">
						<object
							data={previewVouchers[previewIndex]?.previewSrc}
							type="application/pdf"
							className="h-full w-full"
						>
							<embed
								src={previewVouchers[previewIndex]?.previewSrc}
								type="application/pdf"
								className="h-full w-full"
							/>
							<div className="h-full w-full flex items-center justify-center p-4 text-center">
								<div>
									<p className="text-sm text-gray-700 mb-2">Tu navegador móvil no permite vista previa embebida.</p>
									<a
										href={previewVouchers[previewIndex]?.previewSrc}
										target="_blank"
										rel="noreferrer"
										className="inline-block px-3 py-2 rounded-md bg-cyan-600 text-white text-sm"
									>
										Abrir vista previa
									</a>
								</div>
							</div>
						</object>
					</div>
				</div>
			</div>
		)}
		</>
	);
});

PagosModal.displayName = 'PagosModal';

export default PagosModal;
