import React, { useRef } from 'react';

interface CalificacionData {
  nroSolicitud: string;
  cuentaSocio: string;
  socio: string;
  fechaSolicitud: string;
  pagare: string;
  moneda: string;
  fecPrimerPago: string;
  montoSolicitado: string;
  montoAprobado: string;
  netoRecibido: string;
  valorCuota: string;
  plazo: string;
  nroAprobaciones: string;
  impresoPor: string;
  ip: string;
  fecha: string;
  hora: string;
  historial: {
    fecha: string;
    cargo: string;
    calificadoPor: string;
    comentario: string;
    estado: string;
  }[];
}

const dataMock: CalificacionData = {
  nroSolicitud: '98-0010508-26',
  cuentaSocio: '000000040630',
  socio: '',
  fechaSolicitud: '09/06/2026',
  pagare: '98-0010508-26',
  moneda: 'NUEVOS SOLES',
  fecPrimerPago: '16/06/2026',
  montoSolicitado: '2,015.00',
  montoAprobado: '2,015.00',
  netoRecibido: '1,725.41',
  valorCuota: '361.82',
  plazo: '6',
  nroAprobaciones: '1',
  impresoPor: 'APAZA CAHUANA JUAN',
  ip: '192.168.3',
  fecha: '09/06/2026',
  hora: '17:54:21',
  historial: [
    {
      fecha: '09/06/2026',
      cargo: 'ADMINISTRADOR',
      calificadoPor: '',
      comentario: '',
      estado: 'APROBADO',
    },
  ],
};

export const CalificacionPDFView = React.forwardRef<HTMLDivElement, { data?: CalificacionData }>(
  ({ data = dataMock }, ref) => {
    const d = data;
    return (
      <div
        ref={ref}
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          color: '#000',
          backgroundColor: '#fff',
          padding: '40px',
          width: '700px',
          boxSizing: 'border-box',
          margin: '0 auto',
        }}
      >
        {/* Título */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ borderBottom: '3px solid #000', marginBottom: '8px' }} />
          <h1 style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '3px', margin: '8px 0' }}>
            CALIFICACIÓN DE SOLICITUD DE CRÉDITO
          </h1>
          <div style={{ borderBottom: '3px solid #000', marginTop: '8px' }} />
        </div>

        {/* Info impresión */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '11px', marginBottom: '20px', gap: '30px' }}>
          <span><strong>Impreso por:</strong> {d.impresoPor}</span>
          <span><strong>IP:</strong> {d.ip}</span>
          <span><strong>Fecha:</strong> {d.fecha}</span>
          <span><strong>Hora:</strong> {d.hora}</span>
        </div>

        {/* Datos principales - dos columnas */}
        <div style={{ display: 'flex', gap: '50px', marginBottom: '20px' }}>
          {/* Columna izquierda */}
          <div style={{ flex: 1 }}>
            <Row label="NRO. SOLICITUD" value={d.nroSolicitud} bold />
            <Row label="CUENTA SOCIO" value={d.cuentaSocio} bold />
            <Row label="SOCIO" value={d.socio || 'N/A'} />
            <Row label="FECHA SOLICITUD" value={d.fechaSolicitud} />
            <Row label="PAGARÉ" value={d.pagare} bold />
            <Row label="MONEDA" value={d.moneda} />
            <Row label="FECHA 1ER PAGO" value={d.fecPrimerPago} />
          </div>

          {/* Columna derecha */}
          <div style={{ flex: 1 }}>
            <Row label="MONTO SOLICITADO" value={`S/ ${d.montoSolicitado}`} right bold />
            <Row label="MONTO APROBADO" value={`S/ ${d.montoAprobado}`} right bold />
            <div style={{ height: '10px' }} />
            <Row label="NETO RECIBIDO" value={`S/ ${d.netoRecibido}`} right bold />
            <Row label="VALOR CUOTA" value={`S/ ${d.valorCuota}`} right />
            <div style={{ height: '10px' }} />
            <Row label="PLAZO (MESES)" value={d.plazo} right />
            <Row label="NRO. APROBACIONES" value={d.nroAprobaciones} right />
          </div>
        </div>

        {/* Línea separadora */}
        <div style={{ borderBottom: '2px solid #000', margin: '20px 0' }} />

        {/* Tabla historial */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginTop: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #000' }}>
              <th style={{ textAlign: 'left', padding: '8px', fontWeight: 'bold', border: '1px solid #000' }}>FECHA</th>
              <th style={{ textAlign: 'left', padding: '8px', fontWeight: 'bold', border: '1px solid #000' }}>CARGO</th>
              <th style={{ textAlign: 'left', padding: '8px', fontWeight: 'bold', border: '1px solid #000' }}>CALIFICADO POR</th>
              <th style={{ textAlign: 'left', padding: '8px', fontWeight: 'bold', border: '1px solid #000' }}>COMENTARIO</th>
              <th style={{ textAlign: 'left', padding: '8px', fontWeight: 'bold', border: '1px solid #000' }}>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {d.historial.map((h, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '6px 8px', border: '1px solid #ddd' }}>{h.fecha}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #ddd' }}>{h.cargo}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #ddd' }}>{h.calificadoPor || 'N/A'}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #ddd' }}>{h.comentario || 'N/A'}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #ddd', fontWeight: 'bold' }}>{h.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Línea de firma */}
        <div style={{ marginTop: '100px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '2px solid #000', width: '250px', marginBottom: '8px' }} />
            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>MO_____ O_____ CALC_____</div>
          </div>
        </div>
      </div>
    );
  }
);

const Row: React.FC<{ label: string; value: string; bold?: boolean; right?: boolean }> = ({
  label, value, bold, right
}) => (
  <div style={{
    display: 'flex',
    justifyContent: right ? 'space-between' : 'flex-start',
    marginBottom: '8px',
    gap: '10px'
  }}>
    <span style={{ minWidth: right ? '140px' : '130px', color: '#333', whiteSpace: 'nowrap' }}>{label}:</span>
    <span style={{ fontWeight: bold ? 'bold' : 'normal' }}>{value}</span>
  </div>
);

CalificacionPDFView.displayName = 'CalificacionPDFView';