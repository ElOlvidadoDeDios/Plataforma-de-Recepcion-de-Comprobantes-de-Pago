import React, { useState } from 'react';
import { Save, TrendingUp, Target, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/card';
import { Button } from '../components/button';
import { Input } from '../components/input';

export default function MiAgenciaView() {
  // Datos simulados de la agencia del usuario logueado
  const [proyeccionOps, setProyeccionOps] = useState('');
  const [proyeccionMonto, setProyeccionMonto] = useState('');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Hola, Wanchaq 👋</h1>
        <p className="text-slate-500">Aquí está tu resumen y proyecciones para hoy, 10/09/2026.</p>
      </div>

      {/* Tarjetas de Resumen Rápido (Solo Lectura) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 text-white">
          <CardContent className="p-6">
            <p className="text-slate-300 text-sm font-medium mb-1">Meta Mensual Ajustada</p>
            <p className="text-3xl font-bold">S/ 300,000</p>
            <p className="text-xs text-slate-400 mt-2">Definida por Gerencia</p>
          </CardContent>
        </Card>
        
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-6">
            <p className="text-emerald-800 text-sm font-medium mb-1">Faltante del Mes</p>
            <p className="text-3xl font-bold text-emerald-600">S/ 36,000</p>
            <p className="text-xs text-emerald-600 mt-2">12 Operaciones restantes</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <p className="text-blue-800 text-sm font-medium mb-1">Avance Actual</p>
            <p className="text-3xl font-bold text-blue-600">88%</p>
            <div className="w-full bg-blue-200 rounded-full h-1.5 mt-3">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '88%' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulario Enfocado de Ingreso */}
      <Card className="border-2 border-blue-100 shadow-md">
        <CardHeader className="bg-blue-50/50 border-b border-blue-100">
          <CardTitle className="text-lg flex items-center text-blue-800">
            <Target className="w-5 h-5 mr-2" />
            Ingresa tu Proyección de Hoy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Proyección en Operaciones</label>
              <Input 
                type="number" 
                placeholder="Ej. 12"
                value={proyeccionOps}
                onChange={(e) => setProyeccionOps(e.target.value)}
                className="text-2xl h-14 text-center font-bold"
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Proyección en Monto (S/)</label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-slate-400 font-bold">S/</span>
                <Input 
                  type="number" 
                  placeholder="32000"
                  value={proyeccionMonto}
                  onChange={(e) => setProyeccionMonto(e.target.value)}
                  className="text-2xl h-14 pl-10 font-bold text-emerald-600"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700 h-12 px-8 text-lg w-full md:w-auto">
              <Save className="w-5 h-5 mr-2" />
              Enviar Proyección Diaria
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}