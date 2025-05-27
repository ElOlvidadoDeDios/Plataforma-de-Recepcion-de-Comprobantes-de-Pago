
import { Card, CardBody, Button, Input } from "@nextui-org/react";
import { Check } from "lucide-react";
import Layout from "../Layout";
import { LoanDetailsSection } from "./componentes/loan-details-section";
import { AccountsReceivableTable } from "./componentes/cuentas-por-cobrar";
import { ContributionsSection } from "./componentes/seccion-contribuciones";

export const PaymentsPanel = () => {
  return (
    <Layout title="Panel de Pagos">
      <Card className="max-w-6xl mx-auto shadow-sm">
      <CardBody className="p-0">
        <div className="border-b border-gray-200 bg-gray-50 p-2 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                <Check className="text-white text-xs" />
              </div>
              <span className="font-medium text-blue-600">Nuevos Soles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border border-green-600 flex items-center justify-center">
              </div>
              <span className="font-medium text-green-600">Dólares Americanos</span>
            </div>
          </div>
          <div className="bg-gray-700 text-white px-2 py-1">
            PEREDA MATOS, MARÍA LOURDES
          </div>
        </div>
        
        <div className="p-4">
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
        </div>
      </CardBody>
      </Card>
    </Layout>
  );
};