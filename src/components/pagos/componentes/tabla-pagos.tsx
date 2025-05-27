export const PaymentScheduleTable = () => {
  const paymentData = [
    { nro: "0064", fecha: "01/06/2030", capital: 12.38, interes: 0, mora: 0.00, dias: 0, otros: 10, total: 22.38, aporte: 22.38 },
    { nro: "0065", fecha: "01/07/2030", capital: 12.38, interes: 0, mora: 0.00, dias: 0, otros: 10, total: 22.38, aporte: 22.38 },
    { nro: "0066", fecha: "01/08/2030", capital: 12.38, interes: 0, mora: 0.00, dias: 0, otros: 10, total: 22.38, aporte: 22.38 },
    { nro: "0067", fecha: "02/09/2030", capital: 12.55, interes: 0, mora: 0.00, dias: 0, otros: 10, total: 22.55, aporte: 22.55 },
  ];

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <div className="font-medium">Plan de Pagos</div>
        <div className="flex items-center">
          <div className="bg-blue-700 text-white px-4 py-1 text-center">
            CRÉDITO DIGITAL
          </div>
          <div className="flex items-center">
            <div className="bg-red-600 text-white px-2 py-1">Cuotas vencidas:</div>
            <div className="bg-red-600 text-white px-2 py-1 font-bold">000</div>
          </div>
          <div className="flex items-center ml-4">
            <div className="font-medium">Cuotas</div>
            <div className="bg-yellow-300 px-2 py-1 ml-2 font-bold">60</div>
          </div>
        </div>
      </div>
      
      <div className="border border-gray-300">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border-r border-gray-300 px-2 py-1">Nro</th>
              <th className="border-r border-gray-300 px-2 py-1">Fec.Venc.</th>
              <th className="border-r border-gray-300 px-2 py-1">Capital</th>
              <th className="border-r border-gray-300 px-2 py-1">Interés</th>
              <th className="border-r border-gray-300 px-2 py-1">Mora</th>
              <th className="border-r border-gray-300 px-2 py-1">N.Días</th>
              <th className="border-r border-gray-300 px-2 py-1">Otros</th>
              <th className="border-r border-gray-300 px-2 py-1">Total</th>
              <th className="px-2 py-1">S/Aporte</th>
            </tr>
          </thead>
          <tbody>
            {paymentData.map((payment, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                <td className="border-r border-gray-300 px-2 py-1">{payment.nro}</td>
                <td className="border-r border-gray-300 px-2 py-1">{payment.fecha}</td>
                <td className="border-r border-gray-300 px-2 py-1 text-right">{payment.capital}</td>
                <td className="border-r border-gray-300 px-2 py-1 text-right">{payment.interes}</td>
                <td className="border-r border-gray-300 px-2 py-1 text-right">{payment.mora.toFixed(2)}</td>
                <td className="border-r border-gray-300 px-2 py-1 text-right">{payment.dias}</td>
                <td className="border-r border-gray-300 px-2 py-1 text-right">{payment.otros}</td>
                <td className="border-r border-gray-300 px-2 py-1 text-right">{payment.total}</td>
                <td className="px-2 py-1 text-right">{payment.aporte}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};