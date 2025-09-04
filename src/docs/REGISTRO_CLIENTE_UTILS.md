# Utilidades Reutilizables para Registro de Clientes

Este documento describe las utilidades que se han extraído del componente `registro_datos.tsx` para hacerlas reutilizables en otros componentes que manejen los mismos campos.

## Archivos Creados

### 1. `useDefaultValues.ts` - Hook para Valores por Defecto
Maneja la lógica de valores por defecto que se asignan automáticamente cuando se muestra el formulario completo.

### 2. `selectOptions.ts` - Utilidades para Opciones de Select
Convierte los datos del combo box en opciones formateadas para los componentes select.

### 3. `useRegistroClienteUtils.ts` - Hook Combinado
Integra todas las utilidades en un solo hook fácil de usar.

## Uso Básico

### Importación
```typescript
import { useRegistroClienteUtils } from '../hooks/useRegistroClienteUtils';
import { useComboBoxData } from '../api/registroDeclientesApi';
```

### Implementación en Componente
```typescript
const MiComponenteRegistro = () => {
  const [formData, setFormData] = useState(initialData);
  const [showFullForm, setShowFullForm] = useState(false);
  const { comboData, loading } = useComboBoxData();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Usar el hook combinado
  const {
    // Opciones de select
    nacionalidadOptions,
    estadoCivilOptions,
    viviendaOptions,
    instruccionOptions,
    profesionOptions,
    actividadEconomicaOptions,
    tipoSocioOptions,
    estadoSocioOptions,
    tipoPersonaOptions,
    sexoOptions,
    
    // Funciones utilitarias
    getPeruNacionalidad,
    getTipoPersona,
    getTipoSocio,
    getSituacion,
    getDNIDocument,
    validateDocumentLength,
    resetFormWithDefaults,
    
    // Estados
    isComboDataLoaded
  } = useRegistroClienteUtils({
    comboData,
    showFullForm,
    formData,
    handleInputChange
  });

  return (
    <div>
      {/* Ejemplo de uso con select */}
      <select 
        value={formData.TIPO_NAC} 
        onChange={(e) => handleInputChange('TIPO_NAC', e.target.value)}
      >
        {nacionalidadOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {/* Ejemplo de validación de documento */}
      <input
        value={formData.DOC_IDEN}
        onChange={(e) => {
          handleInputChange('DOC_IDEN', e.target.value);
          const validation = validateDocumentLength(e.target.value, formData.TIPO_IDEN);
          if (!validation.isValid) {
            console.log('Error:', validation.error);
          }
        }}
      />
    </div>
  );
};
```

## Funciones Disponibles

### Valores por Defecto
- `getPeruNacionalidad()` - Obtiene el código de nacionalidad peruana
- `getTipoPersona()` - Obtiene el tipo de persona "Natural"
- `getTipoSocio()` - Obtiene el tipo "Socio Normal"
- `getSituacion()` - Obtiene el estado "Activo"
- `getDNIDocument()` - Obtiene el tipo de documento DNI por defecto

### Opciones de Select
- `nacionalidadOptions` - Array de opciones para nacionalidad
- `estadoCivilOptions` - Array de opciones para estado civil
- `viviendaOptions` - Array de opciones para tipo de vivienda
- `instruccionOptions` - Array de opciones para nivel de instrucción
- `profesionOptions` - Array de opciones para tipo de profesión
- `actividadEconomicaOptions` - Array de opciones para actividad económica
- `tipoSocioOptions` - Array de opciones para tipo de socio
- `estadoSocioOptions` - Array de opciones para estado del socio
- `tipoPersonaOptions` - Array de opciones para tipo de persona
- `sexoOptions` - Array de opciones para sexo (estático)

### Utilidades Adicionales
- `validateDocumentLength(value: string, docType: string)` - Valida la longitud del documento
- `resetFormWithDefaults()` - Resetea el formulario con valores por defecto
- `isComboDataLoaded` - Boolean que indica si los datos del combo están cargados

## Efectos Automáticos

El hook maneja automáticamente los siguientes efectos cuando `showFullForm` es `true`:

1. **Nacionalidad**: Se asigna automáticamente "Perú" si no hay valor
2. **Tipo de Persona**: Se asigna automáticamente "Natural" si no hay valor
3. **Tipo de Socio**: Se asigna automáticamente "Socio Normal" si no hay valor  
4. **Situación**: Se asigna automáticamente "Activo" si no hay valor

## Personalización

### Crear Opciones Personalizadas
```typescript
import { createSelectOptions } from '../utils/selectOptions';

// Crear opciones personalizadas para cualquier array de datos
const misOpciones = createSelectOptions(
  miArrayDeDatos,
  'campoValor',
  'campoEtiqueta'
);
```

### Extending el Hook
Si necesitas funcionalidad adicional, puedes extender el hook:

```typescript
const useMyCustomUtils = (props) => {
  const baseUtils = useRegistroClienteUtils(props);
  
  // Agregar lógica personalizada
  const myCustomFunction = () => {
    // Tu lógica aquí
  };
  
  return {
    ...baseUtils,
    myCustomFunction
  };
};
```

## Migración desde registro_datos.tsx

Para migrar un componente existente que use la misma lógica:

1. **Reemplazar imports**:
   ```typescript
   // Antes
   const getPeruNacionalidad = () => { ... }
   const nacionalidadOptions = useMemo(() => ..., []);
   
   // Después  
   import { useRegistroClienteUtils } from '../hooks/useRegistroClienteUtils';
   const { getPeruNacionalidad, nacionalidadOptions } = useRegistroClienteUtils(...);
   ```

2. **Eliminar código duplicado**:
   - Eliminar funciones `getPeruNacionalidad`, `getTipoPersona`, etc.
   - Eliminar todos los `useMemo` para opciones de select
   - Eliminar `useEffect` para valores por defecto

3. **Actualizar referencias**:
   - Las opciones ahora vienen del hook
   - Las funciones utilitarias también vienen del hook

## Beneficios

- ✅ **Reutilización**: Código compartido entre múltiples componentes
- ✅ **Consistencia**: Misma lógica en todos lados
- ✅ **Mantenimiento**: Cambios centralizados
- ✅ **Performance**: Memoización automática incluida
- ✅ **TypeScript**: Tipado completo incluido
- ✅ **Testing**: Fácil de testear por separado

## Componentes que Pueden Usar Estas Utilidades

- `registro_datos.tsx` (original)
- `registro_laboral.tsx` 
- `registro_familiares.tsx`
- Cualquier componente que maneje datos de clientes/socios