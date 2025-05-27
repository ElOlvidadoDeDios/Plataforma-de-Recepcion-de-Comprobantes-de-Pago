import { useState } from 'react';
import { DetalleCredito, ClienteResponse } from '../../../api/customerConsultationAPI';
import CronogramaModal from '../../cronograma/CronogramaPage';

interface CreditosTableProps {
  creditos: DetalleCredito[];
  clientData: ClienteResponse;
}

const CreditosTable = ({ creditos, clientData }: CreditosTableProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrestamo, setSelectedPrestamo] = useState<DetalleCredito | null>(null);

  const handleVerCronograma = (credito: DetalleCredito) => {
    setSelectedPrestamo(credito);
    setIsModalOpen(true);
  };

  if (!Array.isArray(creditos) || creditos.length === 0 || typeof creditos[0] === 'string') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-3 overflow-hidden">
        <h2 className="text-lg font-bold uppercase text-cyan-800 mb-3 pb-2 border-b-2 border-cyan-200">
          HISTORIAL DE PRÉSTAMOS
        </h2>
        
        <div className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white p-4 rounded-lg">
          <div className="flex justify-center items-center">
            <p className="text-base sm:text-lg font-semibold text-center">
              SIN PRÉSTAMOS A MOSTRAR
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 overflow-hidden">
      <h2 className="text-lg font-bold uppercase text-cyan-800 mb-3 pb-2 border-b-2 border-cyan-200">
        HISTORIAL DE PRÉSTAMOS
      </h2>
      
      {/* Vista de Escritorio - Tabla */}
      <div className="hidden lg:block w-full overflow-x-auto">
        <table className="w-full whitespace-nowrap table-auto border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-cyan-500 to-cyan-700 text-white sticky top-0 z-10">
              <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white border border-white">ID PRESTAMO</th>
              <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white border border-white">ESTADO</th>
              <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white text-center border border-white">MONTO</th>
              <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white text-center border border-white">SALDO CAPITAL</th>
              <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white text-center border border-white">FRECUENCIA</th>
              <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white text-center border border-white">OTORGA</th>
              <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white text-center border border-white">PRODUCTO</th>
              <th className="px-2 py-3 text-xs md:text-sm font-semibold text-white border border-white">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {creditos.map((credito, index) => (
              <tr key={`${credito.ID_PRESTAMO}-${index}`} className="transition-colors duration-200 ease-in-out hover:bg-gradient-to-r hover:from-cyan-50 hover:to-teal-50">
                <td className="px-4 py-2 text-sm border border-gray-200">{credito.ID_PRESTAMO}</td>
                <td className="px-4 py-2 text-sm border border-gray-200">
                  <span className="px-2 py-1 rounded-full text-xs font-medium">{credito.ESTADO}</span>
                </td>
                <MoneyCell value={credito.MONTO} />
                <MoneyCell value={credito.SALDO_CAPITAL || '0'} />
                <td className="px-4 py-2 text-sm font-medium text-center border border-gray-200">{credito.FRECUENCIA}</td>
                <td className="px-4 py-2 text-sm text-center border border-gray-200">{credito.OTORGA}</td>
                <td className="px-4 py-2 text-sm text-center border border-gray-200">{credito.PRODUCTO || 'No especificado'}</td>
                <td className="px-4 py-2 text-sm border border-gray-200">
                  {credito.ESTADO === 'VIGENTE' && (
                    <button
                      className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm"
                      onClick={() => handleVerCronograma(credito)}
                    >
                      Ver Cronograma
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista Móvil - Tarjetas */}
      <div className="lg:hidden">
        {creditos.map((credito, index) => (
          <div key={`${credito.ID_PRESTAMO}-${index}`} className="bg-white rounded-lg shadow-md p-3 mb-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-cyan-800">ID Préstamo: {credito.ID_PRESTAMO}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${credito.ESTADO === 'Vigente' ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                {credito.ESTADO}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <InfoField label="Monto" value={`S/ ${credito.MONTO}`} />
              <InfoField label="Saldo Capital" value={`S/ ${credito.SALDO_CAPITAL || '0'}`} />
              <InfoField label="Producto" value={credito.PRODUCTO || 'No especificado'} />
              <InfoField label="Frecuencia" value={credito.FRECUENCIA} />
            </div>
            <div className="mt-2 grid grid-cols-1">
              <InfoField label="Otorga" value={credito.OTORGA} />
            </div>
            <div className="mt-2">
              <InfoField label="Analista" value={credito.ANALISTA} />
            </div>
            {credito.ESTADO === 'VIGENTE' && (
              <button
                className="mt-4 w-full bg-cyan-500 text-white py-2 rounded-lg hover:bg-cyan-600 transition-colors"
                onClick={() => handleVerCronograma(credito)}
              >
                Ver Cronograma
              </button>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && selectedPrestamo && (
        <CronogramaModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          prestamo={selectedPrestamo}
          clientData={clientData}
        />
      )}
    </div>
  );
};

const MoneyCell = ({ value }: { value: string }) => (
  <td className="px-4 py-2 text-sm border border-gray-200">
    <div className="flex items-center justify-end gap-1">
      <span className="text-gray-500">S/</span>
      <span className="font-medium">{value}</span>
    </div>
  </td>
);

const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-sm text-gray-600">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

export default CreditosTable;