import { useState, FormEvent, useContext } from 'react';
import { AuthContext } from '../../../contexts/AuthContext';
import { AGENCIAS } from '../../../types';
import {
  AseguramientoPayload,
  AseguramientoResponse,
  PersonaData,
  PersonaErrors,
  crearPersonaVacia,
} from '../types';
import { validarPersona } from '../utils';
import { cumpaSeguroService } from '../service/cumpaSeguro.Service';

export function useAseguramiento() {
  const { user: userData } = useContext(AuthContext);
  
  const [titular, setTitular] = useState<PersonaData>(crearPersonaVacia());
  const [titularErrores, setTitularErrores] = useState<PersonaErrors>({});

  const [incluyeBeneficiario, setIncluyeBeneficiario] = useState(false);
  const [beneficiario, setBeneficiario] = useState<PersonaData>(crearPersonaVacia());
  const [beneficiarioErrores, setBeneficiarioErrores] = useState<PersonaErrors>({});

  const [guardando, setGuardando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');
  const [resultado, setResultado] = useState<AseguramientoResponse | null>(null);

  const actualizarCampo = (
    setter: React.Dispatch<React.SetStateAction<PersonaData>>
  ) => (campo: keyof PersonaData, valor: string) => {
    setter((prev) => ({ ...prev, [campo]: valor } as PersonaData));
  };

  const actualizarFoto = (
    setter: React.Dispatch<React.SetStateAction<PersonaData>>
  ) => (campo: 'fotoDniAnverso' | 'fotoDniReverso' | 'fotoVoucher', archivo: File | null) => {
    setter((prev) => {
      const previewCampo = (campo + 'Preview') as
        | 'fotoDniAnversoPreview'
        | 'fotoDniReversoPreview'
        | 'fotoVoucherPreview';
      const previewAnterior = prev[previewCampo];
      if (previewAnterior) URL.revokeObjectURL(previewAnterior);
      return {
        ...prev,
        [campo]: archivo,
        [previewCampo]: archivo ? URL.createObjectURL(archivo) : '',
      };
    });
  };

  const actualizarCampoTitular = actualizarCampo(setTitular);
  const actualizarFotoTitular = actualizarFoto(setTitular);
  const actualizarCampoBeneficiario = actualizarCampo(setBeneficiario);
  const actualizarFotoBeneficiario = actualizarFoto(setBeneficiario);

  const reiniciarFormulario = () => {
    setTitular(crearPersonaVacia());
    setTitularErrores({});
    setBeneficiario(crearPersonaVacia());
    setBeneficiarioErrores({});
    setIncluyeBeneficiario(false);
    setResultado(null);
    setErrorGeneral('');
  };

  // Función para obtener el nombre de la agencia
  const obtenerNombreAgencia = (idAgencia: string): string => {
    if (!idAgencia) return 'SIN AGENCIA ASIGNADA';
    const agenciasEntries = Object.entries(AGENCIAS);
    const agenciaEncontrada = agenciasEntries.find(([_, id]) => id === idAgencia);
    if (agenciaEncontrada) return agenciaEncontrada[0];
    if (userData?.agencias && userData.agencias.length > 0) {
      return userData.agencias[0].agencia || `ID: ${idAgencia}`;
    }
    return `AGENCIA ID: ${idAgencia}`;
  };

  const manejarSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorGeneral('');

    // Validar que el usuario esté autenticado
    if (!userData?.dni) {
      setErrorGeneral('Usuario no autenticado. Por favor, inicie sesión nuevamente.');
      return;
    }

    const erroresTitular = validarPersona(titular, true, false);
    const erroresBeneficiario = incluyeBeneficiario ? validarPersona(beneficiario, false, false) : {};

    setTitularErrores(erroresTitular);
    setBeneficiarioErrores(erroresBeneficiario);

    const hayErrores =
      Object.keys(erroresTitular).length > 0 || Object.keys(erroresBeneficiario).length > 0;

    if (hayErrores) {
      setErrorGeneral('Revisa los campos marcados en rojo antes de continuar.');
      return;
    }

    // La fecha de registro se genera una sola vez, en el momento del envío,
    // y se guarda en formato ISO para no depender del formato local.
    const fechaRegistro = new Date().toISOString();

    const payload: AseguramientoPayload = {
      titular,
      beneficiario: incluyeBeneficiario ? beneficiario : null,
      fechaRegistro,
      user: userData.dni,
      agencia_nom: obtenerNombreAgencia(userData.id_age || ''),
    };

    try {
      setGuardando(true);
      const respuesta = await cumpaSeguroService.guardarAseguramiento(payload);
      setResultado(respuesta);
    } catch (err) {
      setErrorGeneral('Ocurrió un error al guardar. Intenta nuevamente.');
    } finally {
      setGuardando(false);
    }
  };

  return {
    titular,
    titularErrores,
    actualizarCampoTitular,
    actualizarFotoTitular,

    incluyeBeneficiario,
    setIncluyeBeneficiario,
    beneficiario,
    beneficiarioErrores,
    actualizarCampoBeneficiario,
    actualizarFotoBeneficiario,

    guardando,
    errorGeneral,
    resultado,

    manejarSubmit,
    reiniciarFormulario,
  };
}