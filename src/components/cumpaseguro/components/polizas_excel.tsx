import ExcelJS from 'exceljs';
import { PolizaPorAplicar } from '../AplicacionPolizas.types';

type RegistroExcel = {
	fecha: string;
	titularOBeneficiario: string;
	tipoAsegurado: 'TITULAR' | 'BENEFICIARIO';
	nroBanco: string;
	dni: string;
	monto: number;
	asesor: string;
	observacion: string;
};

const nombreCompleto = (p?: {
	nombres?: string;
	apellido_paterno?: string;
	apellido_materno?: string;
}) => `${p?.nombres || ''} ${p?.apellido_paterno || ''} ${p?.apellido_materno || ''}`.trim();

const obtenerFecha = (poliza: PolizaPorAplicar) => {
	if (poliza.fecha_hora_local) return poliza.fecha_hora_local;
	if (poliza.fecha_local && poliza.hora_local) return `${poliza.fecha_local} ${poliza.hora_local}`;
	if (poliza.fecha_local) return poliza.fecha_local;
	return '';
};

function mapearRegistros(polizas: PolizaPorAplicar[]): RegistroExcel[] {
	const rows: RegistroExcel[] = [];

	polizas.forEach((poliza) => {
		const fecha = obtenerFecha(poliza);
		const nroBanco = String(poliza.voucher?.data?.voucher?.nro_banco || '');
		const monto = Number(poliza.titular?.costo || poliza.voucher?.data?.voucher?.monto_pago || 0);
		const asesor = String(poliza.user || '');
		const observacion = String(poliza.estado || poliza.voucher?.data?.voucher?.estado || '').toUpperCase();

		rows.push({
			fecha,
			titularOBeneficiario: nombreCompleto(poliza.titular),
			tipoAsegurado: 'TITULAR',
			nroBanco,
			dni: String(poliza.titular?.nro_documento || ''),
			monto,
			asesor,
			observacion,
		});

		(poliza.beneficiarios || []).forEach((beneficiario) => {
			rows.push({
				fecha,
				titularOBeneficiario: nombreCompleto(beneficiario),
				tipoAsegurado: 'BENEFICIARIO',
				nroBanco,
				dni: String(beneficiario.nro_documento || ''),
				monto,
				asesor,
				observacion,
			});
		});
	});

	return rows;
}

export async function exportarPolizasExcel(polizas: PolizaPorAplicar[]): Promise<void> {
	const registros = mapearRegistros(polizas);
	const workbook = new ExcelJS.Workbook();
	const sheet = workbook.addWorksheet('Lista Asegurados');

	sheet.columns = [
		{ header: 'FECHA', key: 'fecha', width: 20 },
		{ header: 'TITULAR O BENEFICIARIO', key: 'titularOBeneficiario', width: 38 },
		{ header: 'TIPO ASEGURADO', key: 'tipoAsegurado', width: 18 },
		{ header: 'NRO BANCO', key: 'nroBanco', width: 15 },
		{ header: 'DNI', key: 'dni', width: 16 },
		{ header: 'MONTO', key: 'monto', width: 14 },
		{ header: 'ASESOR', key: 'asesor', width: 18 },
		{ header: 'OBSERVACION', key: 'observacion', width: 22 },
	];

	const headerRow = sheet.getRow(1);
	headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
	headerRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FF0F766E' },
	};

	registros.forEach((item) => {
		sheet.addRow(item);
	});

	sheet.eachRow((row, rowNumber) => {
		row.eachCell((cell) => {
			cell.border = {
				top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
				left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
				bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
				right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
			};
			if (rowNumber > 1) {
				cell.alignment = { vertical: 'middle', horizontal: 'left' };
			}
		});
	});

	sheet.getColumn('monto').numFmt = '#,##0.00';

	const buffer = await workbook.xlsx.writeBuffer();
	const blob = new Blob([buffer], {
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	});

	const fechaArchivo = new Date().toISOString().slice(0, 10);
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `Lista_Asegurados_${fechaArchivo}.xlsx`;
	document.body.appendChild(a);
	a.click();
	a.remove();
	window.URL.revokeObjectURL(url);
}

