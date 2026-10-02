import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ClienteBasico } from '../services/buscarsocio.service';
import registroClienteApi from '../../../api/registroDeclientesApi';
import { useNotifications } from '../../../hooks/useNotifications';
import { editarDireccion } from '../services/editardirecion.service';
import { editarDatosContacto } from '../services/editardatoscontacto.service';

type TipoDireccion = 'domiciliaria' | 'familiar' | 'trabajo';

interface UbigeoOption {
  DPTO?: string;
  PROV?: string;
  DIST?: string;
  TIPO_SECTOR?: string;
  NOM_UBIGEO?: string;
  NOM_SECTOR?: string;
}

interface TipoViaOption {
  TIPO_VIA: string;
  NOM_TVIA: string;
}

interface TipoZonaOption {
  TIPO_ZONA: string;
  NOM_TZONA: string;
}

interface ActualizaDatosModalProps {
  codigoSocio: string;
  nombreSocio: string;
  socioData?: ClienteBasico | null;
  onClose: () => void;
  onDatosActualizados?: () => void;
}

export const ActualizaDatosModal: React.FC<ActualizaDatosModalProps> = ({
  codigoSocio,
  nombreSocio,
  socioData,
  onClose,
  onDatosActualizados,
}) => {
  const notifications = useNotifications();

  // Dirección
  const [tipoDireccion, setTipoDireccion] = useState<TipoDireccion>('domiciliaria');
  const [tipoVia, setTipoVia] = useState('');
  const [nombreVia, setNombreVia] = useState('');
  const [numero, setNumero] = useState('');
  const [interior, setInterior] = useState('');
  const [tipoZona, setTipoZona] = useState('');
  const [nombreZona, setNombreZona] = useState('');
  const [referencia, setReferencia] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [provincia, setProvincia] = useState('');
  const [distrito, setDistrito] = useState('');
  const [sector, setSector] = useState('');

  // Combos dinámicos
  const [tipoViaOptions, setTipoViaOptions] = useState<TipoViaOption[]>([]);
  const [tipoZonaOptions, setTipoZonaOptions] = useState<TipoZonaOption[]>([]);
  const [departamentoOptions, setDepartamentoOptions] = useState<UbigeoOption[]>([]);
  const [provinciaOptions, setProvinciaOptions] = useState<UbigeoOption[]>([]);
  const [distritoOptions, setDistritoOptions] = useState<UbigeoOption[]>([]);
  const [sectorOptions, setSectorOptions] = useState<UbigeoOption[]>([]);

  // Otros Datos
  const [telefono1, setTelefono1] = useState('');
  const [telefono2, setTelefono2] = useState('');
  const [email, setEmail] = useState('');
  const [celular1, setCelular1] = useState('');
  const [celular2, setCelular2] = useState('');
  const [savingDireccion, setSavingDireccion] = useState(false);
  const [savingContacto, setSavingContacto] = useState(false);

  const inputClass =
    'w-full px-2 py-1 text-[12px] rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500';
  const selectClass = inputClass + ' bg-white';
  const labelClass = 'text-[11px] font-semibold text-slate-700 block mb-0.5';
  const linkClass =
    'text-[12px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer';

  const tipoDireccionToCode = (value: TipoDireccion) => {
    if (value === 'domiciliaria') return '01';
    if (value === 'familiar') return '02';
    return '03';
  };

  const buildDireccionPayload = () => {
    const direccionCompleta = [nombreVia.trim(), numero.trim(), interior.trim() ? `INT. ${interior.trim()}` : '']
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      cuenta: codigoSocio,
      tipo_dir: tipoDireccionToCode(tipoDireccion),
      tipo_via: tipoVia,
      nom_via: nombreVia,
      tipo_zona: tipoZona,
      nom_zona: nombreZona,
      numero,
      interior,
      referencia,
      dpto: departamento,
      prov: provincia,
      dist: distrito,
      tipo_sector: sector,
      direccion: direccionCompleta,
    };
  };

  const handleActualizarDireccion = async () => {
    if (!codigoSocio) {
      notifications.warning('No se encontró la cuenta del socio.');
      return;
    }

    if (!tipoVia || !nombreVia.trim() || !tipoZona || !nombreZona.trim() || !departamento || !provincia || !distrito) {
      notifications.validation('Faltan campos obligatorios de dirección', [
        'Tipo de Vía',
        'Nombre de Vía',
        'Tipo de Zona',
        'Nombre de Zona',
        'Departamento',
        'Provincia',
        'Distrito',
      ]);
      return;
    }

    try {
      setSavingDireccion(true);
      const result = await editarDireccion(buildDireccionPayload());
      if (result.success) {
        notifications.success(result.message || 'Dirección actualizada correctamente');
        onDatosActualizados?.();
      } else {
        notifications.error(result.error || 'No se pudo actualizar la dirección');
      }
    } catch (error) {
      notifications.error(error instanceof Error ? error.message : 'No se pudo actualizar la dirección');
    } finally {
      setSavingDireccion(false);
    }
  };

  const handleActualizarContacto = async () => {
    const telefonoPrincipal = celular1.trim();
    const emailPrincipal = email.trim();

    if (!codigoSocio) {
      notifications.warning('No se encontró la cuenta del socio.');
      return;
    }

    if (!telefonoPrincipal || !emailPrincipal) {
      notifications.validation('Faltan campos obligatorios de contacto', [
        'Celular principal',
        'Email',
      ]);
      return;
    }

    try {
      setSavingContacto(true);
      const result = await editarDatosContacto({
        cuenta: codigoSocio,
        tlf_cel1: telefonoPrincipal,
        tlf_cel2: celular2.trim(),
        tlf_fijo1: telefono1.trim(),
        tlf_fijo2: telefono2.trim(),
        email: emailPrincipal,
      });

      if (result.success) {
        notifications.success(result.message || 'Datos de contacto actualizados correctamente');
        onDatosActualizados?.();
      } else {
        notifications.error(result.error || 'No se pudieron actualizar los datos de contacto');
      }
    } catch (error) {
      notifications.error(error instanceof Error ? error.message : 'No se pudieron actualizar los datos de contacto');
    } finally {
      setSavingContacto(false);
    }
  };

  const asArray = <T,>(value: unknown): T[] => {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown[] }).data)) {
      return (value as { data: T[] }).data;
    }
    return [];
  };

  useEffect(() => {
    const loadBaseCombos = async () => {
      try {
        const [deptosRaw, dirOpcionesRaw] = await Promise.all([
          registroClienteApi.useComboBoxDepartamentosData(),
          registroClienteApi.useComboBoxSectorOpcionesData(),
        ]);

        setDepartamentoOptions(asArray<UbigeoOption>(deptosRaw));

        const dirOpciones = (dirOpcionesRaw || {}) as {
          TIPO_VIA?: TipoViaOption[];
          TIPO_ZONA?: TipoZonaOption[];
        };

        setTipoViaOptions(asArray<TipoViaOption>(dirOpciones.TIPO_VIA));
        setTipoZonaOptions(asArray<TipoZonaOption>(dirOpciones.TIPO_ZONA));
      } catch {
        setDepartamentoOptions([]);
        setTipoViaOptions([]);
        setTipoZonaOptions([]);
      }
    };

    loadBaseCombos();
  }, []);

  useEffect(() => {
    const loadProvincias = async () => {
      if (!departamento) {
        setProvinciaOptions([]);
        return;
      }
      try {
        const provinciasRaw = await registroClienteApi.useComboBoxProvinciasData(departamento);
        setProvinciaOptions(asArray<UbigeoOption>(provinciasRaw));
      } catch {
        setProvinciaOptions([]);
      }
    };

    loadProvincias();
  }, [departamento]);

  useEffect(() => {
    const loadDistritos = async () => {
      if (!departamento || !provincia) {
        setDistritoOptions([]);
        return;
      }
      try {
        const distritosRaw = await registroClienteApi.useComboBoxDistritosData(
          departamento,
          provincia,
        );
        setDistritoOptions(asArray<UbigeoOption>(distritosRaw));
      } catch {
        setDistritoOptions([]);
      }
    };

    loadDistritos();
  }, [departamento, provincia]);

  useEffect(() => {
    const loadSectores = async () => {
      if (!departamento || !provincia || !distrito) {
        setSectorOptions([]);
        return;
      }
      try {
        const sectoresRaw = await registroClienteApi.useComboBoxSectoresData(
          departamento,
          provincia,
          distrito,
        );
        setSectorOptions(asArray<UbigeoOption>(sectoresRaw));
      } catch {
        setSectorOptions([]);
      }
    };

    loadSectores();
  }, [departamento, provincia, distrito]);

  useEffect(() => {
    if (!socioData) return;

    const tipoDireccionMap: Record<string, TipoDireccion> = {
      '01': 'domiciliaria',
      '02': 'familiar',
      '03': 'trabajo',
    };

    setTipoDireccion(tipoDireccionMap[socioData.TIPO_DIR] || 'domiciliaria');
    setTipoVia(socioData.TIPO_VIA || '');
    setNombreVia(socioData.NOM_VIA || '');
    setNumero(socioData.NUMERO || '');
    setInterior(socioData.INTERIOR || '');
    setTipoZona(socioData.TIPO_ZONA || '');
    setNombreZona(socioData.NOM_ZONA || '');
    setReferencia(socioData.REFERENCIA || '');
    setDepartamento(socioData.DPTO || '');
    setProvincia(socioData.PROV || '');
    setDistrito(socioData.DIST || '');
    setSector(socioData.TIPO_SECTOR || '');

    setTelefono1(socioData.TLF_FIJO1 || '');
    setTelefono2(socioData.TLF_FIJO2 || '');
    setCelular1(socioData.CEL_PRINCIPAL || '');
    setCelular2(socioData.TLF_CEL2 || '');
    setEmail(socioData.EMAIL || '');
  }, [socioData]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl bg-white border border-slate-300 shadow-2xl rounded-sm overflow-hidden">
        {/* Barra de título */}
        <div className="flex items-center justify-between bg-[#fbe9e6] border-b border-slate-300 px-3 py-2">
          <h2 className="text-[13px] font-bold text-slate-700">ActualizaDatos</h2>
          <button
            type="button"
            onClick={onClose}
            title="Cerrar"
            className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-red-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 space-y-3 max-h-[85vh] overflow-y-auto">
          {/* Encabezado: código y nombre */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-1 sm:gap-4 pb-1">
            <span className="text-blue-700 font-bold text-sm sm:text-base">{codigoSocio}</span>
            <span className="text-blue-700 font-bold text-sm sm:text-base">{nombreSocio}</span>
          </div>

          {/* Sección: Dirección */}
          <div className="border border-slate-300 rounded-sm p-2.5 space-y-2">
            <p className="text-[12px] font-bold text-slate-700">Dirección</p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
              {(
                [
                  { value: 'domiciliaria', label: 'Domiciliaria' },
                  { value: 'familiar', label: 'Familiar' },
                  { value: 'trabajo', label: 'Trabajo' },
                ] as { value: TipoDireccion; label: string }[]
              ).map((op) => (
                <label
                  key={op.value}
                  className="inline-flex items-center gap-1.5 text-[12px] text-slate-700 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="tipoDireccion"
                    checked={tipoDireccion === op.value}
                    onChange={() => setTipoDireccion(op.value)}
                    className="w-3.5 h-3.5 accent-blue-700"
                  />
                  {op.label}
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr_70px_70px] gap-2">
              <div>
                <label className={labelClass}>Tipo Via</label>
                <select value={tipoVia} onChange={(e) => setTipoVia(e.target.value)} className={selectClass}>
                  <option value="">Seleccione...</option>
                  {tipoViaOptions.map((op) => (
                    <option key={op.TIPO_VIA} value={op.TIPO_VIA}>
                      {op.NOM_TVIA}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Nombre Via</label>
                <input
                  type="text"
                  value={nombreVia}
                  onChange={(e) => setNombreVia(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Numero</label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Interior</label>
                <input
                  type="text"
                  value={interior}
                  onChange={(e) => setInterior(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-2">
              <div>
                <label className={labelClass}>Tipo Zona</label>
                <select value={tipoZona} onChange={(e) => setTipoZona(e.target.value)} className={selectClass}>
                  <option value="">Seleccione...</option>
                  {tipoZonaOptions.map((op) => (
                    <option key={op.TIPO_ZONA} value={op.TIPO_ZONA}>
                      {op.NOM_TZONA}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Nombre Zona</label>
                <input
                  type="text"
                  value={nombreZona}
                  onChange={(e) => setNombreZona(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Referencia</label>
              <input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div>
                <label className={labelClass}>Departamento</label>
                <select
                  value={departamento}
                  onChange={(e) => {
                    setDepartamento(e.target.value);
                    setProvincia('');
                    setDistrito('');
                    setSector('');
                  }}
                  className={selectClass}
                >
                  <option value="">Seleccione...</option>
                  {departamentoOptions.map((op, i) => (
                    <option key={`${op.DPTO}-${i}`} value={op.DPTO || ''}>
                      {op.NOM_UBIGEO || op.DPTO}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Provincia</label>
                <select
                  value={provincia}
                  onChange={(e) => {
                    setProvincia(e.target.value);
                    setDistrito('');
                    setSector('');
                  }}
                  className={selectClass}
                >
                  <option value="">Seleccione...</option>
                  {provinciaOptions.map((op, i) => (
                    <option key={`${op.PROV}-${i}`} value={op.PROV || ''}>
                      {op.NOM_UBIGEO || op.PROV}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Distrito</label>
                <select
                  value={distrito}
                  onChange={(e) => {
                    setDistrito(e.target.value);
                    setSector('');
                  }}
                  className={selectClass}
                >
                  <option value="">Seleccione...</option>
                  {distritoOptions.map((op, i) => (
                    <option key={`${op.DIST}-${i}`} value={op.DIST || ''}>
                      {op.NOM_UBIGEO || op.DIST}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Sector</label>
                <select value={sector} onChange={(e) => setSector(e.target.value)} className={selectClass}>
                  <option value="">Seleccione...</option>
                  {sectorOptions.map((op, i) => (
                    <option key={`${op.TIPO_SECTOR}-${i}`} value={op.TIPO_SECTOR || ''}>
                      {op.NOM_SECTOR || op.TIPO_SECTOR}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button type="button" className={linkClass} onClick={handleActualizarDireccion} disabled={savingDireccion}>
                {savingDireccion ? 'Actualizando...' : 'Actualizar Dirección'}
              </button>
            </div>
          </div>

          {/* Sección: Otros Datos */}
          <div className="border border-slate-300 rounded-sm p-2.5 space-y-2">
            <p className="text-[12px] font-bold text-slate-700">Otros Datos</p>

            <div className="grid grid-cols-1 sm:grid-cols-[90px_1fr_1fr_50px_1.6fr] sm:items-end gap-2">
              <label className={`${labelClass} sm:mb-1.5`}>Teléfonos</label>
              <input
                type="text"
                value={telefono1}
                onChange={(e) => setTelefono1(e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                value={telefono2}
                onChange={(e) => setTelefono2(e.target.value)}
                className={inputClass}
              />
              <span className="hidden sm:block" />
              <div>
                <label className={labelClass}>email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[90px_1fr_1fr_50px_1.6fr] sm:items-end gap-2">
              <label className={`${labelClass} sm:mb-1.5`}>Celulares</label>
              <input
                type="text"
                value={celular1}
                onChange={(e) => setCelular1(e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                value={celular2}
                onChange={(e) => setCelular2(e.target.value)}
                className={inputClass}
              />
              <span className="hidden sm:block" />
              {/* <div>
                <label className={labelClass}>Tipo Socio</label>
                <select value={tipoSocio} onChange={(e) => setTipoSocio(e.target.value)} className={selectClass}>
                  <option value="">Seleccione...</option>
                  <option value="normal">SOCIO NORMAL</option>
                  <option value="preferencial">SOCIO PREFERENCIAL</option>
                </select>
              </div> */}
            </div>

            <div className="flex justify-end pt-1">
              <button type="button" className={linkClass} onClick={handleActualizarContacto} disabled={savingContacto}>
                {savingContacto ? 'Actualizando...' : 'Actualizar Datos'}
              </button>
            </div>
          </div>

          {/* Sección: Trabajo
          <div className="border border-slate-300 rounded-sm p-2.5 space-y-2">
            <p className="text-[12px] font-bold text-slate-700">Trabajo</p>

            <div className="grid grid-cols-1 sm:grid-cols-[90px_1fr_70px_1fr] sm:items-end gap-2">
              <label className={`${labelClass} sm:mb-1.5`}>Agencia</label>
              <select value={agencia} onChange={(e) => setAgencia(e.target.value)} className={selectClass}>
                <option value="">Seleccione...</option>
                <option value="agencia_digital">AGENCIA DIGITAL</option>
                <option value="agencia_central">AGENCIA CENTRAL</option>
              </select>
              <label className={`${labelClass} sm:mb-1.5`}>Empresa</label>
              <select value={empresa} onChange={(e) => setEmpresa(e.target.value)} className={selectClass}>
                <option value="">Seleccione...</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[90px_1fr_70px_1fr_50px_1fr] sm:items-end gap-2">
              <label className={`${labelClass} sm:mb-1.5`}>CIP</label>
              <input type="text" value={cip} onChange={(e) => setCip(e.target.value)} className={inputClass} />
              <label className={`${labelClass} sm:mb-1.5`}>Cargo</label>
              <input type="text" value={cargo} onChange={(e) => setCargo(e.target.value)} className={inputClass} />
              <label className={`${labelClass} sm:mb-1.5`}>Area</label>
              <input type="text" value={area} onChange={(e) => setArea(e.target.value)} className={inputClass} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[90px_150px_1fr] sm:items-end gap-2">
              <label className={`${labelClass} sm:mb-1.5`}>F. Ingreso</label>
              <input
                type="date"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                className={inputClass}
              />
              <span className="hidden sm:block" />
            </div>

            <div className="flex justify-end pt-1">
              <button type="button" className={linkClass} onClick={marcarActualizacion}>
                Actualizar Laboral
              </button>
            </div>
          </div> */}

          {/* Footer */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-sm border border-slate-400 bg-white text-slate-700 text-[12px] font-semibold hover:bg-slate-50 shadow-sm transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ActualizaDatosModal;