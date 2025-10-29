import type { Route } from "./$types";
import { useState } from 'react';
import { SimpleGeoJSONVisualizer } from '../components/SimpleGeoJSONVisualizer';
import { dataSources } from '../data';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "GeoJSON 3D Volume Visualization" },
    { name: "description", content: "3D visualization of GeoJSON data using Three.js" },
  ];
}

export default function Home() {
  const [selectedDataSource, setSelectedDataSource] = useState('points');
  const [heightField, setHeightField] = useState('');
  const [heightScale, setHeightScale] = useState(1);
  
  // 获取当前数据源配置
  const currentSource = dataSources.find(s => s.id === selectedDataSource) || dataSources[0];
  
  // 当数据源变更时更新高度字段和缩放因子
  const handleDataSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDataSourceId = e.target.value;
    setSelectedDataSource(newDataSourceId);
    
    // 找到新的数据源配置
    const newSource = dataSources.find(s => s.id === newDataSourceId) || dataSources[0];
    setHeightField(newSource.heightField);
    setHeightScale(newSource.heightScale);
  };
  
  // 初始化高度字段和缩放因子
  useState(() => {
    setHeightField(currentSource.heightField);
    setHeightScale(currentSource.heightScale);
  }, []);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">GeoJSON 3D 可视化演示</h1>
      
      <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
        {/* 控制面板 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* 数据源选择 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">数据源</label>
            <select 
              value={selectedDataSource} 
              onChange={handleDataSourceChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {dataSources.map(source => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* 高度字段选择 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">高度字段</label>
            <input 
              type="text" 
              value={heightField}
              onChange={(e) => setHeightField(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* 高度缩放因子 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">高度缩放因子</label>
            <input 
              type="number" 
              step="0.000001"
              min="0"
              value={heightScale}
              onChange={(e) => setHeightScale(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* 3D可视化容器 */}
        <div className="h-[600px] border border-gray-300 rounded-lg overflow-hidden">
          <SimpleGeoJSONVisualizer 
            dataSourceId={selectedDataSource}
            heightField={heightField}
            heightScale={heightScale}
          />
        </div>
        
        {/* 使用说明 */}
        <div className="mt-6 bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium mb-2">使用说明</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 使用鼠标拖动可旋转视角</li>
            <li>• 使用鼠标滚轮可缩放视图</li>
            <li>• 使用Shift+拖动可平移视图</li>
            <li>• 选择不同数据源可切换展示内容</li>
            <li>• 调整高度字段和缩放因子可改变3D效果</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
