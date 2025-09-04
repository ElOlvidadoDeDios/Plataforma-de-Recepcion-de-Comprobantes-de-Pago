import logo from '../../../logo_dile.webp'; // Ruta corregida del logo (3 niveles hacia arriba)

export function CertificadoAfiliacion() {
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
              <td className="py-1">2049052787</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-bold">APELLIDOS Y NOMBRES:</td>
              <td className="py-1">Juan Pérez</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-bold">TIPO Y NRO DE DOCUMENTO:</td>
              <td className="py-1">DNI 12345678</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-bold">N° CUENTA DE SOCIO:</td>
              <td className="py-1">001234</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-bold">APORTE INICIAL:</td>
              <td className="py-1">S/ 100.00</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-bold">FECHA DE EMISIÓN:</td>
              <td className="py-1">04/09/2025</td>
            </tr>
            <tr>
              <td className="py-1 pr-2 font-bold">RESPONSABLE:</td>
              <td className="py-1">María Gómez</td>
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