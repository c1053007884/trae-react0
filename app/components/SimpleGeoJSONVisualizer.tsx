import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { dataSources } from '../data';

interface SimpleGeoJSONVisualizerProps {
  dataSourceId?: string;
  heightField?: string;
  heightScale?: number;
}

export function SimpleGeoJSONVisualizer({
  dataSourceId = 'points',
  heightField,
  heightScale
}: SimpleGeoJSONVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  // 添加调试信息
  const addDebug = (info: string) => {
    console.log('[THREE_DEBUG]', info);
    setDebugInfo(prev => [...prev.slice(-9), info]); // 只保留最近10条
  };
  
  useEffect(() => {
    // 确保containerRef存在
    if (!containerRef.current) {
      addDebug('错误: 容器引用不存在');
      return;
    }
    
    // 重置状态
    setLoading(true);
    setError(null);
    addDebug(`开始加载数据源: ${dataSourceId}`);
    
    // 创建基本的Three.js场景
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // 创建相机
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 10, 20);
    
    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    addDebug('渲染器已添加到容器');
    
    // 添加轨道控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);
    
    // 添加网格辅助
    const gridHelper = new THREE.GridHelper(20, 20, 0xcccccc, 0xeeeeee);
    scene.add(gridHelper);
    
    // 创建一个简单的立方体作为测试
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    addDebug('已添加测试立方体');
    
    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);
      
      // 旋转立方体
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      
      controls.update();
      renderer.render(scene, camera);
    };
    
    // 窗口大小调整处理
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      
      renderer.setSize(newWidth, newHeight);
    };
    
    // 启动动画
    animate();
    window.addEventListener('resize', handleResize);
    setLoading(false);
    addDebug('Three.js场景初始化完成');
    
    // 清理函数
    return () => {
      addDebug('清理Three.js资源');
      window.removeEventListener('resize', handleResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
      if (controls) controls.dispose();
    };
  }, [dataSourceId, heightField, heightScale]);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-lg font-medium">正在加载数据...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-100 text-red-500 p-4">
        <p className="text-lg font-medium mb-2">加载数据失败</p>
        <p className="text-sm word-break text-center">{error}</p>
      </div>
    );
  }
  
  return (
    <div style={{ height: '100%' }}>
      <div 
        ref={containerRef}
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'relative'
        }}
      />
      {/* 调试信息面板 */}
      <div style={{ 
        position: 'absolute', 
        bottom: '10px', 
        left: '10px', 
        backgroundColor: 'rgba(0, 0, 0, 0.7)', 
        color: 'white', 
        padding: '10px', 
        borderRadius: '4px', 
        fontSize: '12px',
        maxWidth: '300px',
        maxHeight: '150px',
        overflowY: 'auto',
        zIndex: 100
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>调试信息:</div>
        {debugInfo.map((info, index) => (
          <div key={index} style={{ margin: '2px 0' }}>{info}</div>
        ))}
      </div>
    </div>
  );
}