import { useCallback } from 'react';
import { useDefaultValues } from './useDefaultValues';
import { useSelectOptions } from '../utils/selectOptions';

// Interface para el hook combinado
interface UseRegistroClienteUtilsProps {
  comboData: any;
  showFullForm: boolean;
  formData: any;
  handleInputChange: (field: any, value: string) => void;
}

/**
 * Hook combinado que integra todas las utilidades reutilizables para registro de clientes
 * 
 * Incluye:
 * - Valores por defecto automáticos
 * - Opciones de select formateadas
 * - Funciones utilitarias para obtener valores específicos
 * - Manejo de efectos para formularios completos
 * 
 * @param props - Propiedades del hook
 * @returns Objeto con todas las utilidades disponibles
 */
export const useRegistroClienteUtils = ({
  comboData,
  showFullForm,
  formData,
  handleInputChange
}: UseRegistroClienteUtilsProps) => {
  
  // Usar el hook de valores por defecto
  const defaultValueUtils = useDefaultValues({
    comboData,
    showFullForm,
    formData,
    handleInputChange
  });

  // Usar el hook de opciones de select
  const selectOptions = useSelectOptions(comboData);

  // Función utilitaria para limpiar formulario con valores por defecto
  const resetFormWithDefaults = useCallback(() => {
    const dniDoc = defaultValueUtils.getDNIDocument();
    return {
      TIPO_IDEN: dniDoc ? dniDoc.TIPO_DI : '',
      selectedDocType: dniDoc ? dniDoc.TIPO_DI : '',
      // Otros campos se pueden agregar aquí según necesidades
    };
  }, [defaultValueUtils]);

  // Función para validar longitud de documento
  const validateDocumentLength = useCallback((value: string, docType: string) => {
    if (!comboData?.TIPO_DOCUMENTO || !docType) return { isValid: true, error: '' };
    
    const selectedDoc = comboData.TIPO_DOCUMENTO.find((doc: any) => doc.TIPO_DI === docType);
    if (!selectedDoc) return { isValid: true, error: '' };
    
    const expectedLength = parseInt(selectedDoc.NCARACTER, 10);
    if (value.length !== expectedLength) {
      return {
        isValid: false,
        error: `El ${selectedDoc.NOM_DI} debe tener ${expectedLength} caracteres.`
      };
    }
    
    return { isValid: true, error: '' };
  }, [comboData]);

  // Función para obtener documento DNI por defecto
  const getDefaultDNIDocument = useCallback(() => {
    return defaultValueUtils.getDNIDocument();
  }, [defaultValueUtils]);

  return {
    // Valores por defecto
    ...defaultValueUtils,
    
    // Opciones de select
    ...selectOptions,
    
    // Funciones utilitarias adicionales
    resetFormWithDefaults,
    validateDocumentLength,
    getDefaultDNIDocument,
    
    // Estado de carga
    isComboDataLoaded: !!comboData,
  };
};

export default useRegistroClienteUtils;