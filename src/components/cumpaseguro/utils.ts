import { PersonaData, PersonaErrors } from './types';

export const formatFecha = (iso: string): string => {
  const fecha = new Date(iso);
  return fecha.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const soloNumeros = (valor: string) => valor.replace(/[^0-9]/g, '');

export const validarPersona = (
  persona: PersonaData,
  obligatorio: boolean,
  pedirVoucher: boolean = true
): PersonaErrors => {
  const errores: PersonaErrors = {};
  const requerido = (valor: string) => obligatorio && valor.trim() === '';

  if (requerido(persona.dni)) {
    errores.dni = 'El DNI es obligatorio';
  } else if (persona.dni && persona.tipoDoc === 'DNI' && persona.dni.length !== 8) {
    errores.dni = 'El DNI debe tener 8 dígitos';
  }

  if (requerido(persona.nombre)) errores.nombre = 'El nombre es obligatorio';
  if (requerido(persona.apePaterno)) errores.apePaterno = 'El apellido paterno es obligatorio';
  if (requerido(persona.apeMaterno)) errores.apeMaterno = 'El apellido materno es obligatorio';
  if (requerido(persona.direccion)) errores.direccion = 'La dirección es obligatoria';

  if (obligatorio && persona.tipoAtencion === '') {
    errores.tipoAtencion = 'Selecciona el tipo de atención';
  }

  if (requerido(persona.costo)) {
    errores.costo = 'El costo es obligatorio';
  } else if (persona.costo && Number(persona.costo) <= 0) {
    errores.costo = 'El costo debe ser mayor a 0';
  }

  if (requerido(persona.correo)) {
    errores.correo = 'El correo es obligatorio';
  } else if (persona.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(persona.correo)) {
    errores.correo = 'Correo no válido';
  }

  if (requerido(persona.celular)) {
    errores.celular = 'El celular es obligatorio';
  } else if (persona.celular && persona.celular.length !== 9) {
    errores.celular = 'El celular debe tener 9 dígitos';
  }

  if (obligatorio && !persona.sinDocumento && !persona.fotoDniAnverso) {
    errores.fotoDniAnverso = 'Falta la foto del DNI (anverso)';
  }
  if (obligatorio && !persona.sinDocumento && !persona.fotoDniReverso) {
    errores.fotoDniReverso = 'Falta la foto del DNI (reverso)';
  }
  if (obligatorio && persona.sinDocumento && !persona.fotoSustento) {
    errores.fotoSustento = 'Falta el documento de sustentación';
  }
  if (obligatorio && pedirVoucher && !persona.fotoVoucher) {
    errores.fotoVoucher = 'Falta la foto del comprobante de pago';
  }

  return errores;
};