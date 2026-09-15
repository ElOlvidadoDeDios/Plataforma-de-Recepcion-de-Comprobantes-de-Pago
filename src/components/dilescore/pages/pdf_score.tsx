import { jsPDF } from 'jspdf';
import type { DileScoreAutoData, DileScoreInputData } from '../types';

// ---- Tipos flexibles: acepta cualquier objeto plano de campos ----
type CamposPlanos = Record<string, unknown>;
type DileScoreInputLike = DileScoreInputData | CamposPlanos;
type DileScoreAutoLike = DileScoreAutoData | CamposPlanos;

interface GenerarScorePdfParams {
  dni: string;
  inputData: DileScoreInputLike;   // Datos manuales (MONTO_PRESTAMO, CUOTAS, etc.)
  autoData: DileScoreAutoLike;    // Datos automáticos (TIPO_SOCIO, EDAD_ANIOS, etc.)
  resultado: CamposPlanos;   // Respuesta del API /score (score, threshold, grado, etc.)
  nombreArchivo?: string;    // opcional, por defecto usa el DNI
}

// Etiquetas legibles para las claves técnicas (agrega/edita las que necesites)
const ETIQUETAS: Record<string, string> = {
  TIPO_SOCIO: 'Tipo de socio',
  RAZON_SOCIAL: 'Razón social',
  MESES_ANTIGUEDAD: 'Meses de antigüedad',
  EDAD_ANIOS: 'Edad (años)',
  LUGAR_NAC: 'Lugar de nacimiento',
  TIPO_PERSONA: 'Tipo de persona',
  TIPO_VIVIENDA: 'Tipo de vivienda',
  ESTADO_CIVIL: 'Estado civil',
  NIVEL_INSTRUCCION: 'Nivel de instrucción',
  PROFESION: 'Profesión',
  NACIONALIDAD: 'Nacionalidad',
  ACTIVIDAD_ECONOMICA: 'Actividad económica',
  TIENE_AHORRO: 'Tiene ahorro',

  MONTO_PRESTAMO: 'Monto préstamo',
  CUOTAS: 'Cuotas',
  CUOTA_FIJA: 'Cuota fija',
  FINALIDAD_PRESTAMO: 'Finalidad del préstamo',
  TIPO_DESTINO: 'Tipo destino',
  SUBTIPO_PRES: 'Subtipo préstamo',
  TIPO_PRODUCTO: 'Tipo de producto',
  FRECUENCIA_PAGO: 'Frecuencia de pago',
  AGENCIA_NOMBRE: 'Agencia',

  score: 'Score',
  grado: 'Grado',
  producto: 'Producto',
  decision: 'Decisión',
};

const etiquetaDe = (clave: string): string => ETIQUETAS[clave] ?? clave;

const formatearValor = (valor: unknown): string => {
  if (valor === null || valor === undefined || valor === '') return '-';
  if (typeof valor === 'number') return String(valor);
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  return String(valor);
};

const getFechaPeru = (date = new Date()): string => {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export function generarScorePdf({
  dni,
  inputData,
  autoData,
  resultado,
  nombreArchivo,
}: GenerarScorePdfParams): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' }); // puntos, hoja A4
  const marginX = 36;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const fechaGeneracion = getFechaPeru();
  let y = 36;

  const nuevaPaginaSiNecesario = (alturaNecesaria: number) => {
    if (y + alturaNecesaria > pageHeight - 32) {
      doc.addPage();
      y = 36;
    }
  };

  // ---------- Encabezado ----------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Reporte de Scoring', marginX, y);
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90);
  doc.text(`Fecha de generación: ${fechaGeneracion}    |    DNI consultado: ${dni}`, marginX, y);
  doc.setTextColor(0);
  y += 10;

  doc.setDrawColor(180);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 12;

  // ---------- Helper: dibuja una sección como TABLA con bordes ----------
  const colLabelWidth = 150;
  const tableWidth = pageWidth - marginX * 2;
  const colValueWidth = tableWidth - colLabelWidth;
  const rowPaddingY = 3;
  const lineHeight = 9;
  const headerHeight = 14;

  const dibujarSeccion = (
    titulo: string,
    datos: DileScoreInputLike | DileScoreAutoLike | CamposPlanos,
  ) => {
    const entradaComoObjeto = datos as Record<string, unknown>;
    const entradas = Object.entries(entradaComoObjeto).filter(
      ([, v]) => v !== null && v !== undefined,
    );
    if (entradas.length === 0) return;

    // Título de la sección (fuera de la tabla)
    if (titulo) {
      nuevaPaginaSiNecesario(headerHeight + 10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(0);
      doc.text(titulo, marginX, y);
      y += 10;
    }

    // Pre-calcular altura de cada fila (por si el valor ocupa varias líneas)
    doc.setFontSize(7.5);
    const filas = entradas.map(([clave, valor]) => {
      const textoValor = formatearValor(valor);
      const lineas = doc.splitTextToSize(textoValor, colValueWidth - 8);
      const alto = Math.max(lineHeight, lineas.length * lineHeight) + rowPaddingY * 2;
      return { etiqueta: etiquetaDe(clave), lineas, alto };
    });

    // Encabezado de la tabla
    const dibujarEncabezadoTabla = () => {
      doc.setFillColor(235, 238, 242);
      doc.setDrawColor(190);
      doc.rect(marginX, y, tableWidth, headerHeight, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(60);
      doc.text('Campo', marginX + 6, y + headerHeight / 2 + 2.5);
      doc.text('Valor', marginX + colLabelWidth + 6, y + headerHeight / 2 + 2.5);
      // Línea vertical divisoria del encabezado
      doc.line(marginX + colLabelWidth, y, marginX + colLabelWidth, y + headerHeight);
      y += headerHeight;
    };

    nuevaPaginaSiNecesario(headerHeight + filas[0].alto);
    dibujarEncabezadoTabla();

    doc.setFontSize(7.5);
    filas.forEach((fila, idx) => {
      // Si la fila no entra en la página actual, saltamos de página y repetimos encabezado
      if (y + fila.alto > pageHeight - 32) {
        doc.addPage();
        y = 36;
        dibujarEncabezadoTabla();
      }

      // Fondo alternado (zebra)
      if (idx % 2 === 1) {
        doc.setFillColor(248, 249, 250);
        doc.rect(marginX, y, tableWidth, fila.alto, 'F');
      }

      // Bordes de la fila
      doc.setDrawColor(215);
      doc.rect(marginX, y, colLabelWidth, fila.alto);
      doc.rect(marginX + colLabelWidth, y, colValueWidth, fila.alto);

      // Contenido
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50);
      doc.text(fila.etiqueta, marginX + 6, y + rowPaddingY + lineHeight - 2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20);
      doc.text(fila.lineas, marginX + colLabelWidth + 6, y + rowPaddingY + lineHeight - 2);

      y += fila.alto;
    });

    doc.setTextColor(0);
    y += 9; // espacio después de la tabla
  };

  // ---------- Secciones ----------
  dibujarSeccion('DATOS DEL SOCIO', autoData);
  dibujarSeccion('DATOS DE LA SOLICITUD', inputData);

  // ---------- Resultado (destacado) ----------
  nuevaPaginaSiNecesario(24);
  doc.setDrawColor(180);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text('Resultado del scoring', marginX, y);
  y += 10;

  dibujarSeccion('', resultado);

  // ---------- Pie de página ----------
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i += 1) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(140);
    doc.text(
      'cooperativa de ahorro y credito dile',
      marginX,
      pageHeight - 18,
    );
    doc.text(
      `- Generado el ${fechaGeneracion}`,
      pageWidth - marginX,
      pageHeight - 18,
      { align: 'right' },
    );
  }

  const archivo = nombreArchivo || `reporte_score_${dni}.pdf`;
  doc.save(archivo);
}