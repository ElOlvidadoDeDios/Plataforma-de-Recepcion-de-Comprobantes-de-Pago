import { TipoDocumento } from '../../../api/customerConsultationAPI';

interface SearchBarProps {
  searchQuery: string;
  tipoDocumento: TipoDocumento;
  onSearchChange: (value: string) => void;
  onTipoDocumentoChange: (value: TipoDocumento) => void;
}

const SearchBar = ({ searchQuery, tipoDocumento, onSearchChange, onTipoDocumentoChange }: SearchBarProps) => {
  return (
    <div className="mb-6 md:mb-8 bg-white p-4 md:p-6 rounded-lg shadow-lg transform transition-all duration-300 hover:shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-none">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de búsqueda:</label>
          <select
            id="tipo-documento"
            name="tipo-documento"
            value={tipoDocumento}
            onChange={(e) => onTipoDocumentoChange(e.target.value as TipoDocumento)}
            className="w-full md:w-40 border-2 border-cyan-200 rounded-lg p-2 focus:outline-none focus:border-cyan-400 transition-colors"
          >
            <option value={TipoDocumento.DNI}>DNI</option>
            <option value={TipoDocumento.NOMBRE}>Razon Social</option>
            <option value={TipoDocumento.CUENTA}>Cuenta</option>
          </select>
        </div>
        <div className="flex-grow">
          <label className="block text-sm font-medium text-gray-700 mb-1">Búsqueda:</label>
          <div className="relative">
            <input
              id="busqueda-cliente"
              name="busqueda-cliente"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const value = e.target.value;
                if (tipoDocumento === TipoDocumento.DNI) {
                  // Solo números para DNI
                  if (!/^\d*$/.test(value)) {
                    return;
                  }
                } else if (tipoDocumento === TipoDocumento.CUENTA) {
                  // Para cuentas: números, guiones, espacios y algunos caracteres especiales
                  if (!/^[0-9\-\s]*$/.test(value)) {
                    return;
                  }
                }
                onSearchChange(value);
              }}
              className="w-full border-2 border-cyan-200 rounded-lg p-2 md:p-3 focus:outline-none focus:border-cyan-400 transition-colors"
              placeholder={`Escriba el ${tipoDocumento === TipoDocumento.DNI ? 'DNI' :
                tipoDocumento === TipoDocumento.NOMBRE ? 'nombre' :
                'número de cuenta'}`}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;