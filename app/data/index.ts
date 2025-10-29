// 统一导出所有GeoJSON数据和类型
export * from './types';
export * from './pointsData';
export * from './linesData';
export * from './polygonsData';
export * from './mixedFeaturesData';

// 数据源配置
export interface DataSource {
  id: string;
  name: string;
  data: () => Promise<{default?: any} & Record<string, any>>;
  heightField: string;
  heightScale: number;
}

// 所有可用的数据源
export const dataSources: DataSource[] = [
  {
    id: 'points',
    name: '城市点数据',
    data: () => import('./pointsData').then(m => m.pointsData),
    heightField: 'population',
    heightScale: 0.000001
  },
  {
    id: 'lines',
    name: '路线数据',
    data: () => import('./linesData').then(m => m.linesData),
    heightField: 'length_km',
    heightScale: 0.001
  },
  {
    id: 'polygons',
    name: '区域数据',
    data: () => import('./polygonsData').then(m => m.polygonsData),
    heightField: 'area_km2',
    heightScale: 0.00001
  },
  {
    id: 'mixed',
    name: '混合数据',
    data: () => import('./mixedFeaturesData').then(m => m.mixedFeaturesData),
    heightField: 'passengers_per_year',
    heightScale: 0.00000001
  }
];