import React from 'react';
import { Geo3DMap } from '../components/Geo3DMap';

export const Geo3DPage: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>三维地质图可视化</h1>
      <Geo3DMap width={1200} height={800} />
    </div>
  );
};