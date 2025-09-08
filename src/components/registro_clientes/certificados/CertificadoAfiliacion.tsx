import logo from '../../../logo_dile.webp'; // Ruta corregida del logo (3 niveles hacia arriba)
import { DatosCertificado } from '../../../types/clienteData';
// Props para los componentes
interface DocumentoProps {
  datosCertificado?: DatosCertificado;
}



// Helper para formatear texto de estado civil
const formatearEstadoCivil = (cliente: any): string => {
  return cliente?.TIPO_ECIV_TEXTO || cliente?.TIPO_ECIV || '';
};

// Helper para formatear texto de profesión
const formatearProfesion = (cliente: any): string => {
  return cliente?.TIPO_PROF_TEXTO || cliente?.TIPO_PROF || '';
};

// Helper para formatear texto de instrucción
const formatearInstruccion = (cliente: any): string => {
  return cliente?.TIPO_INST_TEXTO || cliente?.TIPO_INST || '';
};

// Helper para formatear sexo
const formatearSexo = (cliente: any): string => {
  return cliente?.SEXO_TEXTO || (cliente?.SEXO === 'M' ? 'Masculino' : cliente?.SEXO === 'F' ? 'Femenino' : '');
};

// Helpers para formatear datos de dirección
const formatearDireccionCompleta = (direccion: any): string => {
  // Prioridad 1: Si hay DIRECCION_COMPLETA mapeada desde registro_datos.tsx
  if (direccion?.DIRECCION_COMPLETA) {
    return direccion.DIRECCION_COMPLETA;
  }
  
  // Prioridad 2: Si hay una dirección ya formateada en DIRECCION
  if (direccion?.DIRECCION) {
    return direccion.DIRECCION;
  }
  
  // Prioridad 3: Construir la dirección a partir de los componentes
  const partes = [];
  
  if (direccion?.TIPO_VIA && direccion?.NOM_VIA) {
    partes.push(`${direccion.TIPO_VIA} ${direccion.NOM_VIA}`);
  } else if (direccion?.NOM_VIA) {
    partes.push(direccion.NOM_VIA);
  }
  
  if (direccion?.NUMERO) {
    partes.push(`N° ${direccion.NUMERO}`);
  }
  
  if (direccion?.INTERIOR) {
    partes.push(`Int. ${direccion.INTERIOR}`);
  }
  
  if (direccion?.NOM_ZONA) {
    partes.push(direccion.NOM_ZONA);
  }
  
  return partes.join(' - ');
};

const formatearUbigeo = (direccion: any, tipo: 'DPTO' | 'PROV' | 'DIST'): string => {
  // Primero verificar si hay datos de texto ya mapeados
  if (tipo === 'DPTO' && direccion?.DPTO_TEXTO) return direccion.DPTO_TEXTO;
  if (tipo === 'PROV' && direccion?.PROV_TEXTO) return direccion.PROV_TEXTO;
  if (tipo === 'DIST' && direccion?.DIST_TEXTO) return direccion.DIST_TEXTO;
  
  // Si no hay texto mapeado, usar el código original
  return direccion?.[tipo] || '';
};

export function FichaIngreso({ datosCertificado }: DocumentoProps) {
    const cliente = datosCertificado?.cliente;
    const direccion = datosCertificado?.direccion;

    return (
        <div className="w-full">
            <div className="text-center mb-6">
                <h1 className="text-xl font-bold uppercase">FICHA DE INGRESO</h1>
                <div className="mt-2 text-sm">
                    <p>COOPERATIVA DE AHORRO Y CRÉDITO DILE</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="p-3"> {/* Se quitó el border-2 border-black */}
                    <h3 className="text-sm font-bold mb-3 uppercase">DATOS PERSONALES</h3>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <p className="text-xs font-semibold mb-1">APELLIDO PATERNO</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{cliente?.APE_PAT || ''}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1">APELLIDO MATERNO</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{cliente?.APE_MAT || ''}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1">NOMBRES</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{cliente?.NOMBRES || ''}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                        <div>
                            <p className="text-xs font-semibold mb-1">NRO D.I</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{cliente?.DOC_IDEN || ''}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1">ESTADO CIVIL</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{formatearEstadoCivil(cliente)}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1">FECHA NACIMIENTO</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">
                                    {cliente?.FECHA_NAC ? new Date(cliente.FECHA_NAC).toLocaleDateString('es-PE') : ''}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1">SEXO</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{formatearSexo(cliente)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <p className="text-xs font-semibold mb-1">PROFESIÓN</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{formatearProfesion(cliente)}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1">GRADO INSTRUCCIÓN</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{formatearInstruccion(cliente)}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1">CENTRO TRABAJO</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{cliente?.OCUPACION || ''}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className="text-xs font-semibold mb-1">CARGO</p>
                        <div className="border-b-2 border-black h-6 flex items-end px-2">
                            <span className="text-xs">{cliente?.OCUPACION || ''}</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className="text-xs font-semibold mb-1">DIRECCIÓN DE DOMICILIO</p>
                        <div className="border-b-2 border-black h-6 flex items-end px-2">
                            <span className="text-xs">{formatearDireccionCompleta(direccion)}</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className="text-xs font-semibold mb-1">REFERENCIA</p>
                        <div className="border-b-2 border-black h-6 flex items-end px-2">
                            <span className="text-xs">{direccion?.REFERENCIA || ''}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <p className="text-xs font-semibold mb-1">DEPARTAMENTO</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{formatearUbigeo(direccion, 'DPTO')}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1">PROVINCIA</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{formatearUbigeo(direccion, 'PROV')}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1">DISTRITO</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{formatearUbigeo(direccion, 'DIST')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-xs font-semibold mb-1">TELÉFONO</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{cliente?.TLF_CELULAR || ''}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold mb-1">EMAIL</p>
                            <div className="border-b-2 border-black h-6 flex items-end px-2">
                                <span className="text-xs">{cliente?.EMAIL || ''}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="text-xs font-semibold mb-1">OBSERVACIONES Y/O DECLARACIONES</p>
                        <div className="border-2 border-black h-16"></div>
                    </div>

                    {/* Sección de firmas actualizada */}
                    <div className="text-center mt-20">
                        <div className="border-b-2 border-black w-40 mx-auto mb-4"></div>
                        <p className="text-xs font-semibold mb-10">FIRMA Y HUELLA DEL AFILIADO</p>
                        <div className="flex justify-center gap-16">
                            <div className="text-center mt-4">
                                <div className="border-b-2 border-black w-40 mx-auto mb-4"></div>
                                <p className="text-xs font-semibold">FIRMA</p>
                            </div>
                            <div className="text-center mt-4">
                                <div className="border-b-2 border-black w-40 mx-auto mb-4"></div>
                                <p className="text-xs font-semibold">FIRMA</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="text-center mt-6">
                    <p className="text-xs">
                        Fecha: {new Date().toLocaleDateString('es-PE')}
                    </p>
                </div>

            </div>
        </div>
    );
}



export function CertificadoAfiliacion({ datosCertificado }: DocumentoProps) {
  const cliente = datosCertificado?.cliente;
  const usuario = datosCertificado?.usuario;
  const fechaEmision = datosCertificado?.fechaEmision || new Date();

  return (
    <div className="w-[200mm] h-[297mm] p-8 mx-auto bg-white" style={{fontFamily: 'Arial, sans-serif'}}>
      {/* Header con logo */}
      <div className="flex justify-start mb-4">
        <img src={logo} alt="DILE Logo" className="h-20" />
      </div>

      {/* Título principal */}
      <div className="text-center mb-4">
        <h1 className="text-lg font-bold bg-gray-200 py-2 px-4 ">CERTIFICADO DE AFILIACIÓN</h1>
      </div>

      {/* Párrafo introductorio */}
      <p className="text-xs leading-tight text-justify mb-4">
        La Cooperativa de Ahorro y Crédito De Intelectuales, Líderes y Empresarios, en adelante denominado DILE,
        identificado con RUC N° 2049052787, con domicilio fiscal en la Av. Garcilaso N° 415 - Wanchaq, de acuerdo al
        marco normativo vigente para cooperativas, afilia al socio(a) cuyos datos se mencionan en el cuadro siguiente:
      </p>
      {/* Datos del certificado */}
      <div className="mb-4">
        <table className="w-full text-xs border-collapse">
          <tbody>
            <tr>
              <td className="py-1 pr-2 font-bold w-1/3">CERTIFICADO N°:</td>
              <td className="py-1">{cliente?.NVA_CTA || 'PENDIENTE'}</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-bold">APELLIDOS Y NOMBRES:</td>
              <td className="py-1">
                {`${cliente?.APE_PAT || ''} ${cliente?.APE_MAT || ''} ${cliente?.NOMBRES || ''}`.trim()}
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-bold">TIPO Y NRO DE DOCUMENTO:</td>
              <td className="py-1">DNI {cliente?.DOC_IDEN || ''}</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-bold">N° CUENTA DE SOCIO:</td>
              <td className="py-1">{cliente?.NVA_CTA || 'PENDIENTE'}</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-bold">APORTE INICIAL:</td>
              <td className="py-1">S/ 100.00</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-bold">FECHA DE EMISIÓN:</td>
              <td className="py-1">{fechaEmision.toLocaleDateString('es-PE')}</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-bold">RESPONSABLE:</td>
              <td className="py-1">{usuario?.razon}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Párrafo de derechos y obligaciones */}
      <p className="text-xs leading-tight text-justify mb-4">
        Otorgándole todos los derechos y obligaciones, contemplados en la Ley General del Sistema Financiero, Ley General de Cooperativas, y las Resoluciones de la Superintendencia de Banca y Seguros; lo cual es debidamente informado y puesto en conocimiento de todos los afiliados, en adelante el término equivaldrá a socios para todos los efectos legales.
      </p>

      {/* Sección OBLIGACIONES DEL AFILIADO */}
      <div className="mb-4">
        <h2 className="text-sm font-bold bg-gray-200 py-1 px-2 mb-2">OBLIGACIONES DEL AFILIADO</h2>
        <div className="text-xs leading-tight text-justify">
          <p className="mb-2">Son obligaciones del afiliado los siguientes:</p>
          <p className="pl-6" style={{textIndent: '-0.75rem'}}>
            a) Cumplir las normas, el Estatuto, resoluciones de la Asamblea General, del Consejo de Administración, y Reglamentos Internos. Asimismo, deberá cumplir con sus obligaciones, así como aportar mensualmente, y pagar un certificado de aportación obligatoriamente lo cual equivaldrá a doce aportes, para ser socio hábil. Mayor información en nuestras oficinas y la página web www.dile.com.pe.
          </p>
          <p className="pl-6" style={{textIndent: '-0.75rem'}}>
            b) Informarse y realizar las consultas sobre los lineamientos, cláusulas y disposiciones de los diferentes contratos de servicios financieros, de ahorros, depósitos, y créditos, con respecto a la tasa de interés, rendimientos, comisiones, gastos asociados al servicio, y/o modificación de tarifas, penalidades, procedimientos, vencimiento de contrato, y otros.
          </p>
          <p className="pl-6" style={{textIndent: '-0.75rem'}}>
            c) Contribuir con la buena imagen de la institución.
          </p>
        </div>
      </div>

      {/* Sección DERECHOS DEL AFILIADO */}
      <div className="mb-4">
        <h2 className="text-sm font-bold bg-gray-200 py-1 px-2 mb-2">DERECHOS DEL AFILIADO</h2>
        <div className="text-xs leading-tight text-justify">
          <p className="mb-2">Son derechos del afiliado los siguientes:</p>
          <p className="mb-2 pl-6" style={{textIndent: '-0.75rem'}}>
            a) Beneficiarse de los productos y servicios financieros que ofrece DILE, de acuerdo a las directivas internas fijadas por los órganos correspondientes.
          </p>
          <p className="pl-6" style={{textIndent: '-0.75rem'}}>
            b) En el caso de ser socio hábil, podrá participar en las Asambleas Generales, elegir y ser elegido para los distintos órganos directivos: Consejo de Administración, Consejo de Vigilancia, Comité de Educación, o Comité Electoral.
          </p>
        </div>
      </div>

      {/* Sección SANCIONES Y PENALIDADES */}
      <div className="mb-4">
        <h2 className="text-sm font-bold bg-gray-200 py-1 px-2 mb-2">SANCIONES Y PENALIDADES POR INCUMPLIMIENTO</h2>
        <p className="text-xs leading-tight text-justify">
          En el caso de que el asociado afecte la buena imagen de la institución financiera, DILE iniciará las acciones administrativas y legales de acuerdo a ley.
        </p>
      </div>

      {/* Sección DECLARACIONES Y FIRMAS */}
      <div className="mb-8">
        <h2 className="text-sm font-bold bg-gray-200 py-1 px-2 mb-2">DECLARACIONES Y FIRMAS</h2>
        <p className="text-xs leading-tight text-justify">
          Como asociado, dejo constancia de haber leído y recibido la ficha de afiliación, la cartilla de información para los asociados, así como contratos anexos de ser el caso. Asimismo, declaro que todas las dudas y consultas relacionadas a estos documentos me fueron absueltas, por lo que firmo la presente con conocimiento pleno de las condiciones establecidas en dichos documentos.
        </p>
      </div>

      {/* Sección de firmas */}
      <div className="mt-auto flex justify-between items-end pt-16">
        <div className="text-center">
          <div className="border-t-2 border-black w-64 mx-auto mb-2"></div>
          <p className="text-xs font-bold">Firma y Huella digital del Asociado</p>
        </div>
        <div className="text-center">
          <div className="border-t-2 border-black w-64 mx-auto mb-2"></div>
          <p className="text-xs font-bold">Firma y Sello del Asesor de Negocios</p>
        </div>
      </div>
    </div>
  );
}

export default CertificadoAfiliacion;