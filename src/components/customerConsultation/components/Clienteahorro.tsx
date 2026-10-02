import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../Layout';

const ClienteAhorro: React.FC = () => {
	const navigate = useNavigate();

	return (
		<Layout title="Cuentas de Ahorro" showBackButton={true}>
			<div className="h-full w-full bg-gradient-to-r from-cyan-50 to-teal-50 p-4">
				<div className="bg-white rounded-lg shadow-md p-6">
					<h2 className="text-2xl font-bold text-cyan-700 mb-3">Cuentas de Ahorro</h2>
					<p className="text-gray-600 mb-6">Cuentas de ahorro</p>

					<button
						type="button"
						onClick={() => navigate('/consulta-clientes')}
						className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-4 py-2 rounded-md transition-colors"
					>
						Volver a Consulta de Socios
					</button>
				</div>
			</div>
		</Layout>
	);
};

export default ClienteAhorro;
