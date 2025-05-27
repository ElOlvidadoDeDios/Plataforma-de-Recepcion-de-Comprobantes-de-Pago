export const ContributionsSection = () => {
  return (
    <div className="mt-6">
      <div className="flex items-center mb-2">
        <div className="font-medium">Aportaciones</div>
        <div className="ml-4 text-xs text-red-600">F1 = Redondea el Total Operación</div>
      </div>
      
      <div className="flex gap-4">
        <div className="w-1/3">
          <div className="font-medium mb-1">Importe</div>
          <div className="bg-yellow-100 border border-yellow-200 px-2 py-1 text-right">
            157.00
          </div>
        </div>
      </div>
    </div>
  );
};