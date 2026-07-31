import { useState, FormEvent } from 'react';

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
  ) => (campo: 'fotoDniAnverso' | 'fotoDniReverso' | 'fotoVoucher' | 'fotoSustento', archivo: File | null) => {
    setter((prev) => {
      const previewCampo = (campo + 'Preview') as
        | 'fotoDniAnversoPreview'
        | 'fotoDniReversoPreview'
        | 'fotoVoucherPreview'
        | 'fotoSustentoPreview';
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

  const actualizarSinDocumentoTitular = (valor: boolean) =>
    setTitular((prev) => ({ ...prev, sinDocumento: valor }));
  const actualizarSinDocumentoBeneficiario = (valor: boolean) =>
    setBeneficiario((prev) => ({ ...prev, sinDocumento: valor }));

  const reiniciarFormulario = () => {
    setTitular(crearPersonaVacia());
    setTitularErrores({});
    setBeneficiario(crearPersonaVacia());
    setBeneficiarioErrores({});
    setIncluyeBeneficiario(false);
    setResultado(null);
    setErrorGeneral('');
  };

  const manejarSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorGeneral('');

    const erroresTitular = validarPersona(titular, true, true);
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
    actualizarSinDocumentoTitular,

    incluyeBeneficiario,
    setIncluyeBeneficiario,
    beneficiario,
    beneficiarioErrores,
    actualizarCampoBeneficiario,
    actualizarFotoBeneficiario,
    actualizarSinDocumentoBeneficiario,

    guardando,
    errorGeneral,
    resultado,

    manejarSubmit,
    reiniciarFormulario,
  };
}