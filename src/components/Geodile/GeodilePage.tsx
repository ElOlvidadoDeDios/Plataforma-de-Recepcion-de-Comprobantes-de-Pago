import React from 'react';
import Layout from '../Layout';
import GeodileInicio from './inicio';

const GeodilePage: React.FC = () => {
  return (
    <Layout title="Geodile - Sistema de Ubicación GPS" fullWidth={true}>
      <GeodileInicio />
    </Layout>
  );
};

export default GeodilePage;