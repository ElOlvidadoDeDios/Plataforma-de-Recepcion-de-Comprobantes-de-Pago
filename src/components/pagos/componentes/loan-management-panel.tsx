import React from "react";
import { Button, Input } from "@heroui/react";
import { LoanDetailsSection } from "./loan-details-section";
import { AccountsReceivableTable } from "./accounts-receivable-table";
import { ContributionsSection } from "./contributions-section";

export const LoanManagementPanel = () => {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="bg-gray-700 text-white px-2 py-1 text-xs">
          0000000028224
        </div>
        <Button variant="bordered" size="sm" className="border-gray-300">
          27/05/2025
        </Button>
      </div>
      
      <LoanDetailsSection />
      
      <div className="mt-4 flex items-center gap-4">
        <div className="font-medium mb-2 flex-grow">Glosa</div>
        <Button 
          color="primary" 
          size="sm" 
          className="mb-2"
        >
          Ver Pagos Disponibles
        </Button>
      </div>
      <Input 
        variant="bordered" 
        className="w-full" 
        size="sm" 
      />
      
      <AccountsReceivableTable />
      <ContributionsSection />
      
      <div className="flex justify-between items-center mt-6 mb-2">
        <div className="w-1/3"></div>
        <div className="flex items-center gap-2">
          <div className="font-medium">Total Operación</div>
          <div className="bg-blue-600 text-white px-3 py-1 font-bold">
            1,500.00
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="bordered" size="sm">
            Imprimir
          </Button>
          <Button variant="bordered" size="sm">
            Salir
          </Button>
        </div>
      </div>
    </>
  );
};