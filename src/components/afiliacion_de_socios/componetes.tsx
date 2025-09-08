import { Edit3, Save, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

// Componente para campo editable
export const EditableField = ({
  label,
  value,
  onChange,
  fieldKey,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (key: string, value: string) => void;
  fieldKey: string;
  type?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onChange(fieldKey, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="p-1 text-green-600 hover:text-green-800"
              title="Guardar"
            >
              <Save size={16} />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-red-600 hover:text-red-800"
              title="Cancelar"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            <p className="flex-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
              {value || 'No registrado'}
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-blue-600 hover:text-blue-800"
              title="Editar"
            >
              <Edit3 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// 🆕 Componente para campos de SELECT editable con opciones
export const EditableSelectField = ({
  label,
  value,
  onChange,
  fieldKey,
  options = [],
  codigo
}: {
  label: string;
  value: string;
  onChange: (key: string, value: string) => void;
  fieldKey: string;
  options?: Array<{ value: string; label: string }>;
  codigo?: string; // El código original del campo
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(codigo || value);

  const handleSave = () => {
    onChange(fieldKey, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(codigo || value);
    setIsEditing(false);
  };

  // Función para obtener el label del código
  const getDisplayValue = () => {
    if (options.length > 0 && codigo) {
      const option = options.find(opt => opt.value === codigo);
      return option?.label || value;
    }
    return value;
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            >
              <option value="">Seleccione una opción</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleSave}
              className="p-1 text-green-600 hover:text-green-800"
              title="Guardar"
            >
              <Save size={16} />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-red-600 hover:text-red-800"
              title="Cancelar"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            <p className="flex-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
              {getDisplayValue() || 'No registrado'}
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-blue-600 hover:text-blue-800"
              title="Editar"
            >
              <Edit3 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// Componente Modal
export const Modal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold">Afiliación de Socio</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
};

// Componente para mostrar imágenes reales del DNI desde AWS S3
export const DNIImageViewer = ({ dniFrontal, dniPosterior }: { dniFrontal: string, dniPosterior: string }) => {
  const [loadingFrontal, setLoadingFrontal] = useState(true);
  const [loadingPosterior, setLoadingPosterior] = useState(true);
  const [errorFrontal, setErrorFrontal] = useState(false);
  const [errorPosterior, setErrorPosterior] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* DNI Frontal */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <h5 className="font-medium text-gray-700 mb-3">DNI - Cara Frontal</h5>
        <div className="bg-gray-100 min-h-[200px] rounded-lg flex items-center justify-center">
          {dniFrontal ? (
            <div className="w-full h-full min-h-[200px] relative">
              {loadingFrontal && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Cargando imagen...</span>
                </div>
              )}
              {errorFrontal ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <div className="text-4xl text-red-400 mb-2">❌</div>
                    <p className="text-sm text-red-600">Error al cargar la imagen</p>
                    <p className="text-xs text-gray-500 mt-1">Verifique la URL o conexión</p>
                  </div>
                </div>
              ) : (
                <img
                  src={dniFrontal}
                  alt="DNI Frontal"
                  className="w-full h-auto max-h-[300px] object-contain rounded-lg shadow-md"
                  onLoad={() => setLoadingFrontal(false)}
                  onError={() => {
                    setLoadingFrontal(false);
                    setErrorFrontal(true);
                  }}
                  style={{ display: loadingFrontal ? 'none' : 'block' }}
                />
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl text-gray-400 mb-2">🆔</div>
              <p className="text-sm text-gray-500">No hay imagen disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* DNI Posterior */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <h5 className="font-medium text-gray-700 mb-3">DNI - Cara Posterior</h5>
        <div className="bg-gray-100 min-h-[200px] rounded-lg flex items-center justify-center">
          {dniPosterior ? (
            <div className="w-full h-full min-h-[200px] relative">
              {loadingPosterior && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Cargando imagen...</span>
                </div>
              )}
              {errorPosterior ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <div className="text-4xl text-red-400 mb-2">❌</div>
                    <p className="text-sm text-red-600">Error al cargar la imagen</p>
                    <p className="text-xs text-gray-500 mt-1">Verifique la URL o conexión</p>
                  </div>
                </div>
              ) : (
                <img
                  src={dniPosterior}
                  alt="DNI Posterior"
                  className="w-full h-auto max-h-[300px] object-contain rounded-lg shadow-md"
                  onLoad={() => setLoadingPosterior(false)}
                  onError={() => {
                    setLoadingPosterior(false);
                    setErrorPosterior(true);
                  }}
                  style={{ display: loadingPosterior ? 'none' : 'block' }}
                />
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl text-gray-400 mb-2">🆔</div>
              <p className="text-sm text-gray-500">No hay imagen disponible</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// Componente para mostrar imagen real del comprobante desde AWS S3
export const VoucherViewer = ({ otroDocumento }: { otroDocumento: string }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
      <h5 className="font-medium text-gray-700 mb-3">
        Comprobante de Pago de Afiliación
      </h5>
      <div className="bg-gray-100 min-h-[600px] rounded-lg flex items-center justify-center relative overflow-hidden">
        {otroDocumento ? (
          <div className="w-full h-full relative flex justify-center items-center p-2">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-2 text-sm text-gray-600">
                  Cargando comprobante...
                </span>
              </div>
            )}
            {error ? (
              <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                  <div className="text-4xl text-red-400 mb-2">❌</div>
                  <p className="text-sm text-red-600">Error al cargar el comprobante</p>
                  <p className="text-xs text-gray-500 mt-1">Verifique la URL o conexión</p>
                </div>
              </div>
            ) : (
              <img
                src={otroDocumento}
                alt="Comprobante de Pago"
                className="w-full h-full object-contain rounded-lg shadow-lg"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
                style={{ 
                  display: loading ? "none" : "block",
                  minHeight: "550px",
                  maxHeight: "800px"
                }}
              />
            )}
          </div>
        ) : (
          <div className="text-center p-6">
            <div className="text-4xl text-gray-400 mb-2">🧾</div>
            <p className="text-sm text-gray-500">No hay comprobante disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};