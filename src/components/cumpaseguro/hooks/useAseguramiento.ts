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

  const [esSocio, setEsSocio] = useState(false);
  const [incluyeBeneficiario, setIncluyeBeneficiario] = useState(false);
  const [beneficiario, setBeneficiario] = useState<PersonaData>(crearPersonaVacia());
  const [beneficiarioErrores, setBeneficiarioErrores] = useState<PersonaErrors>({});

  const [incluyeBeneficiarioAdicional, setIncluyeBeneficiarioAdicional] = useState(false);
  const [beneficiarioAdicional, setBeneficiarioAdicional] = useState<PersonaData>(crearPersonaVacia());
  const [beneficiarioAdicionalErrores, setBeneficiarioAdicionalErrores] = useState<PersonaErrors>({});

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
  const actualizarCampoBeneficiarioAdicional = actualizarCampo(setBeneficiarioAdicional);
  const actualizarFotoBeneficiarioAdicional = actualizarFoto(setBeneficiarioAdicional);

  const reiniciarFormulario = () => {
    setTitular(crearPersonaVacia());
    setTitularErrores({});
    setBeneficiario(crearPersonaVacia());
    setBeneficiarioErrores({});
    setBeneficiarioAdicional(crearPersonaVacia());
    setBeneficiarioAdicionalErrores({});
    setIncluyeBeneficiario(false);
    setIncluyeBeneficiarioAdicional(false);
    setEsSocio(false);
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
    const erroresBeneficiarioAdicional = esSocio && incluyeBeneficiarioAdicional
      ? validarPersona(beneficiarioAdicional, false, false)
      : {};

    setTitularErrores(erroresTitular);
    setBeneficiarioErrores(erroresBeneficiario);
    setBeneficiarioAdicionalErrores(erroresBeneficiarioAdicional);

    const hayErrores =
      Object.keys(erroresTitular).length > 0 ||
      Object.keys(erroresBeneficiario).length > 0 ||
      Object.keys(erroresBeneficiarioAdicional).length > 0;

    if (hayErrores) {
      setErrorGeneral('Revisa los campos marcados en rojo antes de continuar.');
      return;
    }

    // La fecha de registro se genera una sola vez, en el momento del envío,
    // y se guarda en formato ISO para no depender del formato local.
    const fechaRegistro = new Date().toISOString();
    const beneficiarios: PersonaData[] = [];

    if (incluyeBeneficiario) {
      beneficiarios.push(beneficiario);
    }

    if (esSocio && incluyeBeneficiarioAdicional) {
      beneficiarios.push(beneficiarioAdicional);
    }

    const payload: AseguramientoPayload = {
      titular,
      beneficiario: beneficiarios[0] ?? null,
      beneficiarios: beneficiarios.length > 0 ? beneficiarios : undefined,
      fechaRegistro,
      user: userData.dni,
      agencia_nom: obtenerNombreAgencia(userData.id_age || ''),
    };

    try {
      setGuardando(true);
      const respuesta = await cumpaSeguroService.guardarAseguramiento(payload);
      setResultado(respuesta);
    } catch (err) {
      setErrorGeneral(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setGuardando(false);
    }
  };

  return {
    titular,
    titularErrores,
    actualizarCampoTitular,
    actualizarFotoTitular,

    esSocio,
    setEsSocio,

    incluyeBeneficiario,
    setIncluyeBeneficiario,
    beneficiario,
    beneficiarioErrores,
    actualizarCampoBeneficiario,
    actualizarFotoBeneficiario,

    incluyeBeneficiarioAdicional,
    setIncluyeBeneficiarioAdicional,
    beneficiarioAdicional,
    beneficiarioAdicionalErrores,
    actualizarCampoBeneficiarioAdicional,
    actualizarFotoBeneficiarioAdicional,

    guardando,
    errorGeneral,
    resultado,

    manejarSubmit,
    reiniciarFormulario,
  };
}