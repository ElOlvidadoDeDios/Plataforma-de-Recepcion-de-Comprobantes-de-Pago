
import { MapPin } from 'lucide-react';
import Layout from '../Layout';
import { useState } from "react"
import CreditosComponent from './creditos';
import PlazoFijo from './plazo_fijo';
import AhorroLibre from './ahorro_libre';

export default function Calculadora_creditos() {
    const [activeTab, setActiveTab] = useState('creditos');
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'creditos':
                return <CreditosComponent />
            case 'plazo_fijo':
                return <PlazoFijo />
            case 'ahorro_libre':
                return <AhorroLibre />
            default:
                return <CreditosComponent />
        }
    };
    
    return(
        <Layout title = "Calculadora de creditos">
            <div className = 'flex flex-col' style={{ height: '100%' }}>
                <div className='flex-grow'>
                    <div className='bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg shadow-lg h-full'>
                        <div className='border-t border-gray-200'>
                            <div className='flex flex-wrap'>
                                <button
                                    onClick={()=> setActiveTab('creditos')}
                                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === 'creditos'
                                            ? 'border-blue-500 text-blue-600 bg-blue-50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                >
                                    <MapPin className="inline w-4 h-4 mr-2" />
                                    Créditos
                                </button>
                                <button
                                    onClick = {() => setActiveTab('plazo_fijo')}
                                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === 'plazo_fijo'
                                            ? 'border-blue-500 text-blue-600 bg-blue-50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <MapPin className="inline w-4 h-4 mr-2" />
                                    Plazo Fijo
                                </button>
                                <button
                                    onClick = {() => setActiveTab('ahorro_libre')}
                                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === 'plazo_variable'
                                            ? 'border-blue-500 text-blue-600 bg-blue-50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <MapPin className="inline w-4 h-4 mr-2" />
                                    Plazo Variable
                                </button>
                            </div>
                        </div>
                        
                        {/* Contenido del tab seleccionado */}
                        <div className="p-4">
                            {renderTabContent()}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}