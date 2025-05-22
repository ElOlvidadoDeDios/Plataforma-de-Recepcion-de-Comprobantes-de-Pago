import { ClienteBasico } from '../../../api/customerConsultationAPI';

interface ClienteListProps {
  clientes: ClienteBasico[];
  clienteSeleccionado: ClienteBasico | null;
  onClienteSelect: (cliente: ClienteBasico) => void;
}

const ClienteList = ({ clientes, clienteSeleccionado, onClienteSelect }: ClienteListProps) => {
  if (clientes.length === 0) return null;

  return (
    <div className="mb-6 bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-lg font-semibold text-cyan-800 mb-4">Resultados de búsqueda</h2>
      <div className="grid gap-3">
        {clientes.map((cliente) => (
          <button
            key={`${cliente.NRO_DI}-${cliente.CUENTA}`}
            onClick={() => onClienteSelect(cliente)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200
              ${clienteSeleccionado?.NRO_DI === cliente.NRO_DI
                ? 'border-cyan-500 bg-cyan-50'
                : 'border-gray-200 hover:border-cyan-300 hover:bg-gray-50'}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-800">{cliente.RAZON_SOCIAL}</p>
                <p className="text-sm text-gray-600">DNI: {cliente.NRO_DI}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">Cuenta: {cliente.CUENTA}</p>
                <p className="text-sm text-gray-500">{cliente.AGENCIA}</p>
              </div>
            </div>
            <div className="mt-2 flex gap-4">
              <span className="text-sm text-cyan-600">
                Créditos vigentes: {cliente.CREDITOS_VIGENTES}
              </span>
              <span className="text-sm text-gray-500">
                Créditos cancelados: {cliente.CREDITOS_CANCELADOS}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ClienteList;