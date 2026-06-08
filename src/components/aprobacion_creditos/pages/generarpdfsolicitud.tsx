/**
 * generarPDFSolicitud.ts
 * Genera un PDF profesional con membrete para una solicitud de crédito.
 * Dependencia: npm install jspdf
 */

import jsPDF from 'jspdf';

interface SolicitudCredito {
  AGENCIA_NOM: string;
  Nro: string;
  NRO_SOL: string;
  FECHA_SOL: string;
  CUENTA: string;
  NOMBRE: string;
  MONTO_SOL: string;
  MONEDA: string;
  NETO: string;
  COD_CARGO: string;
  TEM: string;
  TEA_INTERES: string;
  CUO_SEGURO: string;
}

interface CargoAutorizado {
  no: number;
  prioridad: number;
  cargo: string;
  situacion: string;
}

interface OpcionesPDF {
  solicitud: SolicitudCredito;
  cargos?: CargoAutorizado[];
  glosa?: string;
  empresa?: {
    nombre: string;
    ruc: string;
    direccion: string;
    telefono: string;
    web?: string;
  };
}

// Colores corporativos
const COLOR = {
  azul:        [30,  111, 191] as [number, number, number],
  azulClaro:   [227, 240, 255] as [number, number, number],
  azulOscuro:  [15,  60,  110] as [number, number, number],
  verde:       [34,  139, 57]  as [number, number, number],
  verdeClaro:  [232, 245, 233] as [number, number, number],
  grisClaro:   [248, 249, 250] as [number, number, number],
  grisBorde:   [220, 220, 220] as [number, number, number],
  grisTexto:   [90,  90,  90]  as [number, number, number],
  negro:       [30,  30,  30]  as [number, number, number],
  blanco:      [255, 255, 255] as [number, number, number],
  amarillo:    [255, 193, 7]   as [number, number, number],
};

const fmt = (n: number) =>
  n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function generarPDFSolicitud(opciones: OpcionesPDF): Promise<void> {
  const { solicitud, glosa = '', empresa } = opciones;

  const cargos: CargoAutorizado[] = opciones.cargos ?? [
    { no: 1, prioridad: 1, cargo: 'ADMINISTRADOR', situacion: 'PENDIENTE' },
  ];

  const empresa_ = empresa ?? {
    nombre:    'FINANCIERA EJEMPLO S.A.',
    ruc:       'RUC: 20123456789',
    direccion: 'Av. Principal 123, Lima, Perú',
    telefono:  '(01) 234-5678',
    web:       'www.financieraejemplo.com.pe',
  };

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;   // ancho A4
  const ml = 14;   // margen izquierdo
  const mr = 14;   // margen derecho
  const cw = W - ml - mr;  // ancho de contenido
  let y = 0;

  /* ─────────────────────────────────────────
     MEMBRETE
  ───────────────────────────────────────── */
  // Franja azul superior
  doc.setFillColor(...COLOR.azul);
  doc.rect(0, 0, W, 28, 'F');

  // Icono placeholder (cuadrado con iniciales) — sustituir por logo real con doc.addImage()
  doc.setFillColor(...COLOR.blanco);
  doc.roundedRect(ml, 5, 18, 18, 2, 2, 'F');
  doc.setTextColor(...COLOR.azul);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const iniciales = empresa_.nombre.split(' ').slice(0, 2).map(p => p[0]).join('');
  doc.text(iniciales, ml + 9, 16, { align: 'center' });

  // Nombre empresa
  doc.setTextColor(...COLOR.blanco);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(empresa_.nombre, ml + 22, 12);

  // Datos empresa
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${empresa_.ruc}  |  ${empresa_.telefono}  |  ${empresa_.web ?? ''}`, ml + 22, 18);
  doc.text(empresa_.direccion, ml + 22, 23);

  // Línea decorativa bajo membrete
  doc.setFillColor(...COLOR.amarillo);
  doc.rect(0, 28, W, 2, 'F');

  y = 36;

  /* ─────────────────────────────────────────
     TÍTULO DEL DOCUMENTO
  ───────────────────────────────────────── */
  doc.setFillColor(...COLOR.azulClaro);
  doc.roundedRect(ml, y, cw, 10, 2, 2, 'F');
  doc.setTextColor(...COLOR.azulOscuro);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SOLICITUD DE CRÉDITO', W / 2, y + 6.5, { align: 'center' });

  y += 14;

  /* ─────────────────────────────────────────
     INFORMACIÓN DEL CLIENTE
  ───────────────────────────────────────── */
  sectionTitle(doc, 'DATOS DEL SOLICITANTE', ml, y, cw);
  y += 8;

  const col1x = ml;
  const col2x = ml + cw / 2 + 2;
  const colW  = cw / 2 - 2;

  // Fila 1
  campoDoble(doc,
    'Cuenta', solicitud.CUENTA, col1x, y, colW,
    'Razón Social', solicitud.NOMBRE, col2x, y, colW,
  );
  y += 12;

  // Fila 2
  campoDoble(doc,
    'Nro Solicitud', solicitud.NRO_SOL, col1x, y, colW,
    'Fecha', solicitud.FECHA_SOL.split(' ')[0], col2x, y, colW,
  );
  y += 12;

  // Fila 3
  campoDoble(doc,
    'Moneda', solicitud.MONEDA, col1x, y, colW,
    'Nro Aprobación', '1', col2x, y, colW,
  );
  y += 14;

  /* ─────────────────────────────────────────
     CONDICIONES DEL CRÉDITO
  ───────────────────────────────────────── */
  sectionTitle(doc, 'CONDICIONES DEL CRÉDITO', ml, y, cw);
  y += 8;

  // 4 tarjetas de monto destacadas
  const tarjetaW = (cw - 6) / 4;
  const tarjetas = [
    { label: 'Monto Solicitado', valor: `S/ ${fmt(parseFloat(solicitud.MONTO_SOL))}`, color: COLOR.azulClaro, textColor: COLOR.azulOscuro },
    { label: 'Neto',             valor: `S/ ${fmt(parseFloat(solicitud.NETO))}`,     color: COLOR.verdeClaro, textColor: COLOR.verde },
    { label: 'Valor Cuota',      valor: 'S/ 220.20',                     color: COLOR.azulClaro, textColor: COLOR.azulOscuro },
    { label: 'Cuota Seguro',     valor: 'S/ 10.00',                      color: COLOR.grisClaro, textColor: COLOR.grisTexto },
  ];

  tarjetas.forEach((t, i) => {
    const tx = ml + i * (tarjetaW + 2);
    doc.setFillColor(...t.color);
    doc.roundedRect(tx, y, tarjetaW, 16, 2, 2, 'F');
    doc.setFillColor(...t.textColor);
    doc.setTextColor(...t.textColor);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(t.label, tx + tarjetaW / 2, y + 5, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(t.valor, tx + tarjetaW / 2, y + 12, { align: 'center' });
  });

  y += 20;

  // Fila de condiciones
  campoDoble(doc,
    'Plazo', '6 meses', col1x, y, colW,
    'Frecuencia', 'MESES', col2x, y, colW,
  );
  y += 12;

  campoDoble(doc,
    'Fecha Primer Pago', '9/05/2026', col1x, y, colW,
    'Monto a Aprobar', `S/ ${fmt(parseFloat(solicitud.MONTO_SOL))}`, col2x, y, colW,
  );
  y += 12;

  campoDoble(doc,
    'T.E.A. %', `${parseFloat(solicitud.TEA_INTERES).toFixed(2)}%`, col1x, y, colW,
    'T.E.M. %', '5.95%', col2x, y, colW,
  );
  y += 14;

  /* ─────────────────────────────────────────
     TABLA DE CARGOS AUTORIZADOS
  ───────────────────────────────────────── */
  sectionTitle(doc, 'CARGOS AUTORIZADOS A APROBAR', ml, y, cw);
  y += 8;

  // Encabezado tabla
  const cols = [
    { label: 'No.',        w: 15 },
    { label: 'Prioridad',  w: 25 },
    { label: 'Cargo',      w: cw - 15 - 25 - 35 },
    { label: 'Situación',  w: 35 },
  ];

  doc.setFillColor(...COLOR.azul);
  doc.roundedRect(ml, y, cw, 8, 1, 1, 'F');
  doc.setTextColor(...COLOR.blanco);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  let cx = ml + 2;
  cols.forEach(col => {
    doc.text(col.label, cx, y + 5.2);
    cx += col.w;
  });
  y += 8;

  // Filas
  cargos.forEach((cargo, idx) => {
    const bg = idx % 2 === 0 ? COLOR.azulClaro : COLOR.blanco;
    doc.setFillColor(...bg);
    doc.rect(ml, y, cw, 7, 'F');

    doc.setTextColor(...COLOR.negro);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    cx = ml + 2;
    const valores = [
      String(cargo.no),
      String(cargo.prioridad),
      cargo.cargo,
      cargo.situacion,
    ];
    cols.forEach((col, ci) => {
      if (ci === 3) {
        // Badge situación
        const situColor = cargo.situacion === 'APROBADO' ? COLOR.verde
          : cargo.situacion === 'DENEGADO' ? [180, 0, 0] as [number,number,number]
          : [180, 130, 0] as [number,number,number];
        doc.setFillColor(...situColor);
        doc.roundedRect(cx, y + 1.5, col.w - 2, 4.5, 1, 1, 'F');
        doc.setTextColor(...COLOR.blanco);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.text(valores[ci], cx + (col.w - 2) / 2, y + 4.8, { align: 'center' });
        doc.setTextColor(...COLOR.negro);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
      } else {
        doc.text(valores[ci], cx, y + 5);
      }
      cx += col.w;
    });

    // Borde fila
    doc.setDrawColor(...COLOR.grisBorde);
    doc.setLineWidth(0.1);
    doc.rect(ml, y, cw, 7);
    y += 7;
  });

  y += 6;

  /* ─────────────────────────────────────────
     GLOSA
  ───────────────────────────────────────── */
  sectionTitle(doc, 'GLOSA / OBSERVACIONES', ml, y, cw);
  y += 8;

  const glosaH = 20;
  doc.setFillColor(...COLOR.grisClaro);
  doc.setDrawColor(...COLOR.grisBorde);
  doc.setLineWidth(0.3);
  doc.roundedRect(ml, y, cw, glosaH, 2, 2, 'FD');

  if (glosa.trim()) {
    doc.setTextColor(...COLOR.negro);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(glosa, cw - 6);
    doc.text(lines, ml + 3, y + 6);
  } else {
    doc.setTextColor(...COLOR.grisBorde);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Sin observaciones', ml + 3, y + 11);
  }

  y += glosaH + 8;

  /* ─────────────────────────────────────────
     FIRMAS
  ───────────────────────────────────────── */
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  sectionTitle(doc, 'FIRMAS Y APROBACIONES', ml, y, cw);
  y += 8;

  const firmaW = (cw - 10) / 3;
  const firmas = ['Analista de Créditos', 'Administrador', 'Gerente'];

  firmas.forEach((firma, i) => {
    const fx = ml + i * (firmaW + 5);
    // Línea de firma
    doc.setDrawColor(...COLOR.grisBorde);
    doc.setLineWidth(0.5);
    doc.line(fx + 4, y + 18, fx + firmaW - 4, y + 18);
    // Etiqueta
    doc.setTextColor(...COLOR.grisTexto);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(firma, fx + firmaW / 2, y + 22, { align: 'center' });
  });

  y += 28;

  /* ─────────────────────────────────────────
     PIE DE PÁGINA
  ───────────────────────────────────────── */
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    // Franja pie
    doc.setFillColor(...COLOR.azul);
    doc.rect(0, 284, W, 13, 'F');
    doc.setTextColor(...COLOR.blanco);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Documento generado el ${new Date().toLocaleDateString('es-PE', { day:'2-digit', month:'long', year:'numeric' })}`,
      ml, 291,
    );
    doc.text(`Página ${p} de ${pageCount}`, W - mr, 291, { align: 'right' });
    doc.text(empresa_.web ?? '', W / 2, 291, { align: 'center' });
  }

  /* ─────────────────────────────────────────
     DESCARGA
  ───────────────────────────────────────── */
  const nombreArchivo = `SolicitudCredito_${solicitud.NRO_SOL.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(nombreArchivo);
}

/* ── Helpers internos ── */

function sectionTitle(doc: jsPDF, titulo: string, x: number, y: number, w: number) {
  doc.setFillColor(...COLOR.azul);
  doc.rect(x, y, 3, 6, 'F');
  doc.setTextColor(...COLOR.azulOscuro);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, x + 5, y + 5);
  doc.setDrawColor(...COLOR.grisBorde);
  doc.setLineWidth(0.2);
  doc.line(x + 5 + doc.getTextWidth(titulo) + 2, y + 4, x + w, y + 4);
}

function campoDoble(
  doc: jsPDF,
  label1: string, valor1: string, x1: number, y: number, w1: number,
  label2: string, valor2: string, x2: number, _y: number, w2: number,
) {
  campoSimple(doc, label1, valor1, x1, y, w1);
  campoSimple(doc, label2, valor2, x2, y, w2);
}

function campoSimple(doc: jsPDF, label: string, valor: string, x: number, y: number, w: number) {
  // Label
  doc.setTextColor(...COLOR.grisTexto);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(label, x, y);
  // Caja valor
  doc.setFillColor(...COLOR.grisClaro);
  doc.setDrawColor(...COLOR.grisBorde);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y + 1.5, w, 7, 1, 1, 'FD');
  doc.setTextColor(...COLOR.negro);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(valor, x + 2.5, y + 6.8);
}