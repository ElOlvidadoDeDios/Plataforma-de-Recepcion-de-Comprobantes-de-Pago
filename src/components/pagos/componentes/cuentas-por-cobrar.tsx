
export const AccountsReceivableTable = () => {
  return (
    <div className="mt-6">
      <div className="font-medium mb-2">Cuentas por Cobrar</div>
      
      <div className="flex gap-4">
        <div className="w-1/4">
          <div className="font-medium mb-1">Importe</div>
          <div className="bg-yellow-100 border border-yellow-200 px-2 py-1 text-right">
            0.00
          </div>
        </div>
        
        <div className="w-3/4">
          <div className="border border-gray-300 bg-yellow-50 h-[80px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border-r border-gray-300 px-2 py-1">Item</th>
                  <th className="border-r border-gray-300 px-2 py-1">Nombre Cuenta por Cobrar</th>
                  <th className="border-r border-gray-300 px-2 py-1">Saldo</th>
                  <th className="px-2 py-1">Pago</th>
                </tr>
              </thead>
              <tbody>
                {/* Empty table body */}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};