import { jsPDF } from "jspdf";

export interface VoucherData {
  "RECIBO": string;
  "CUENTA": string;
  "SOCIO": string;
  "TM": string;
  "APORTE": string;
  "AMORTIZ": string;
  "INTERES": string;
  "MORA": string;
  "SEGURO": string;
  "DESGRAVAMEN": string;
  "PORTES": string;
  "AHORRO": string;
  "CTAS_XCOB": string;
  "CUO_INGRESO": string;
  "PRV_SOCIAL": string;
  "ELECTORAL": string;
  "OBS": string;
  "PLAZO": string;
  "PENDIENTES": string;
  "PAGADAS": string;
  "NCUPAGADAS": string;
  "PROXCUO": string;
  "PLAZO_PRES": string;
  "NRO_DOC": string;
  "NOM_DOC": string;
  "COD_AGE": string;
  "COD_CAJA": string;
  "FECHA_MOV": string;
  "SALDO_ANTER_PRE": string;
  "OPERA_PRE": string;
  "Ndoc": string;
  "HORA_MOV": string;
  "PAGARE": string;
  "GLOSA": string;
  "NOM_COOP": string;
  "RUC_COOP": string;
  "SALDO_APORTE": string;
  "NOMAGENTE": string | null;
}

export const generateVoucherPDF = (data: VoucherData) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [76, 200], // Ancho real de la tiketera (76 mm), altura suficiente
  });

  // --- Estilos ---
  const titleFontSize = 10;
  const textFontSize = 7;
  const smallFontSize = 6;
  const marginLeft = 4;  // margen un poco menor porque el ancho es 76
  const pageWidth = 76;
  const centerX = pageWidth / 2;

  // --- Encabezado ---
  let currentY = 8;
  
  doc.setFontSize(titleFontSize);
  doc.setFont("helvetica", "bold");
  doc.text("C.A.C. D I L E", marginLeft, currentY);
  currentY += 6;

  doc.setFontSize(textFontSize);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.RUC_COOP || "20490522787"}`, marginLeft, currentY);
  currentY += 5;

  doc.setFontSize(smallFontSize);
  doc.text(`AG:${data.COD_AGE} CJ:${data.COD_CAJA}`, marginLeft, currentY);
  currentY += 4;

  doc.text(`FECHA:${data.FECHA_MOV}`, marginLeft, currentY);
  doc.text(data.HORA_MOV, pageWidth - marginLeft, currentY, { align: "right" });
  currentY += 6;

  doc.setFontSize(textFontSize);
  doc.setFont("helvetica", "bold");
  doc.text(`VOUCHER ING. N° ${data.RECIBO}`, centerX, currentY, { align: "center" });
  currentY += 4;

  doc.setDrawColor(0, 0, 0);
  doc.line(marginLeft, currentY, pageWidth - marginLeft, currentY);
  currentY += 4;

  // --- Socio ---
  doc.setFontSize(smallFontSize);
  doc.setFont("helvetica", "normal");
  doc.text(`SOCIO: ${data.CUENTA}`, marginLeft, currentY);
  currentY += 3;

  const nombreSocio = data.SOCIO || "";
  const maxWidth = pageWidth - (marginLeft + 2);
  const nombreLines = doc.splitTextToSize(nombreSocio, maxWidth);
  nombreLines.forEach((line: string) => {
    doc.text(line, marginLeft, currentY);
    currentY += 3;
  });
  currentY += 2;

  // --- Conceptos ---
  const concepts = [
    { label: "AMORTIZA:", value: data.AMORTIZ },
    { label: "INTERES:", value: data.INTERES },
    { label: "MORA:", value: data.MORA },
    { label: "APORTE:", value: data.APORTE },
    { label: "AHORRO:", value: data.AHORRO },
    { label: "P.P.S.:", value: data.PRV_SOCIAL },
    { label: "OTROS:", value: (parseFloat(data.PORTES || "0") + parseFloat(data.DESGRAVAMEN || "0") + parseFloat(data.SEGURO || '0') + parseFloat(data.CTAS_XCOB || '0') + parseFloat(data.ELECTORAL || '0') + parseFloat(data.CUO_INGRESO || '0')).toString() },
    { label: "C.INGRESO:", value: data.CUO_INGRESO },
  ];

  concepts.forEach((item) => {
    const value = parseFloat(item.value || "0");
    doc.text(item.label, marginLeft + 1, currentY);
    doc.text(value.toFixed(2), pageWidth - marginLeft - 2, currentY, { align: "right" });
    currentY += 3.5;
  });

  doc.line(marginLeft, currentY, pageWidth - marginLeft, currentY);
  currentY += 2;

  const paymentConcepts = ["AMORTIZA:", "INTERES:", "MORA:", "P.P.S.:", "OTROS:", "C.INGRESO:"];
  const total = concepts
    .filter((item) => paymentConcepts.includes(item.label))
    .reduce((sum, item) => sum + parseFloat(item.value || "0"), 0);

  doc.setFont("helvetica", "bold");
  doc.text("TOTAL S/.", marginLeft + 1, currentY);
  doc.text(total.toFixed(2), pageWidth - marginLeft - 2, currentY, { align: "right" });
  currentY += 6;

  // --- Extras ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(smallFontSize);

  if (data.PAGARE) {
    doc.text(`${data.OBS} ${data.PAGARE}`, marginLeft + 1, currentY);
    currentY += 3;
  }

  if (data.SALDO_ANTER_PRE) {
    const saldoCapital = parseFloat(data.SALDO_ANTER_PRE) - parseFloat(data.AMORTIZ || "0");
    doc.text(`SALDO CAPITAL:S/${saldoCapital.toFixed(2)}`, marginLeft + 1, currentY);
    currentY += 3;
  }

  if (data.PAGADAS) {
    doc.text(`N° CUOTAS PAGADAS: ${data.PAGADAS}`, marginLeft + 1, currentY);
    currentY += 3;
  }

  if (data.PROXCUO) {
    doc.text(`PROXIMA CUOTA N°: ${data.PROXCUO}`, marginLeft + 1, currentY);
    currentY += 10;
  }

  doc.setDrawColor(0, 0, 0);
  doc.line(marginLeft, currentY, pageWidth - marginLeft, currentY);
  currentY += 4;
  doc.text("FIRMA  / D.N.I. ", centerX, currentY, { align: "center" });

  doc.save(`Voucher_${data.RECIBO}.pdf`);
};
