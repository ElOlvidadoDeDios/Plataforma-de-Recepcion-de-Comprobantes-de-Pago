import React from "react";
import { Card, CardBody } from "@heroui/react";

export const LoanDetailsSection = () => {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="font-medium text-lg">Liquidación de Préstamo</div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-medium">Tipo Crédito:</div>
          <div className="bg-green-100 border border-green-300 px-2 py-1 text-sm">
            MICROEMPRESA
          </div>
          <div className="font-medium ml-4">T.E.A.:</div>
          <div className="bg-yellow-100 border border-yellow-300 px-2 py-1 text-sm">
            213.84
          </div>
          <div className="font-medium ml-4">Cuota:</div>
          <div className="bg-yellow-50 border border-yellow-200 px-2 py-1 text-sm">
            22.38
          </div>
          <div className="font-medium ml-4">Riesgo:</div>
          <div className="bg-green-50 border border-green-200 px-2 py-1 text-sm">
            NORMAL
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1 font-medium w-1/3">Capital</td>
                <td className="py-1 bg-gray-50 border border-gray-200 px-2">742.97</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Interés</td>
                <td className="py-1 bg-yellow-100 border border-yellow-200 px-2">0.00</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Mora</td>
                <td className="py-1 bg-red-100 border border-red-200 px-2">0.00</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Desgravamen</td>
                <td className="py-1 bg-gray-50 border border-gray-200 px-2">0.00</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Seguro</td>
                <td className="py-1 bg-gray-50 border border-gray-200 px-2">600.00</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Portes</td>
                <td className="py-1 bg-gray-50 border border-gray-200 px-2">0.00</td>
              </tr>
              <tr>
                <td className="py-1 font-medium">Total</td>
                <td className="py-1 bg-orange-200 border border-orange-300 px-2 font-bold">1,343.00</td>
              </tr>
            </tbody>
          </table>
          
          <div className="mt-2 text-xs text-blue-700">
            <div>F4 = Calcula Saldo Vencido / Vigente</div>
            <div>F6 = Activa Pago Total del Préstamo</div>
          </div>
        </div>
        
        <div className="col-span-2">
          <div className="font-medium mb-2">Relación de Préstamos</div>
          <div className="border border-gray-300 bg-yellow-50">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border-r border-gray-300 px-2 py-1">Item</th>
                  <th className="border-r border-gray-300 px-2 py-1">Pagaré</th>
                  <th className="border-r border-gray-300 px-2 py-1">Otorga</th>
                  <th className="border-r border-gray-300 px-2 py-1">Saldo</th>
                  <th className="border-r border-gray-300 px-2 py-1">Últ.Pago</th>
                  <th className="border-r border-gray-300 px-2 py-1">Fec.Valuta</th>
                  <th className="px-2 py-1">Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-blue-100">
                  <td className="border-r border-gray-300 px-2 py-1">1</td>
                  <td className="border-r border-gray-300 px-2 py-1">01-000881-24</td>
                  <td className="border-r border-gray-300 px-2 py-1">21/02/2024</td>
                  <td className="border-r border-gray-300 px-2 py-1 text-right">742.97</td>
                  <td className="border-r border-gray-300 px-2 py-1">13/09/2024</td>
                  <td className="border-r border-gray-300 px-2 py-1">13/09/2024</td>
                  <td className="px-2 py-1 text-right">1160.00</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-4">
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
                  {[
                    { nro: "0064", fecha: "01/06/2030", capital: 12.38, interes: 0, mora: 0.00, dias: 0, otros: 10, total: 22.38, aporte: 22.38 },
                    { nro: "0065", fecha: "01/07/2030", capital: 12.38, interes: 0, mora: 0.00, dias: 0, otros: 10, total: 22.38, aporte: 22.38 },
                    { nro: "0066", fecha: "01/08/2030", capital: 12.38, interes: 0, mora: 0.00, dias: 0, otros: 10, total: 22.38, aporte: 22.38 },
                    { nro: "0067", fecha: "02/09/2030", capital: 12.55, interes: 0, mora: 0.00, dias: 0, otros: 10, total: 22.55, aporte: 22.55 }
                  ].map((payment, index) => (
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
        </div>
      </div>
    </div>
  );
};