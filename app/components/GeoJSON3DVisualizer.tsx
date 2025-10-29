import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { dataSources } from '../data';

// 简化的类型定义，避免导出问题
interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: any[];
}

interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: any;
}

interface GeoJSON3DVisualizerProps {
  dataSourceId?: string; // 数据源ID
  heightField?: string; // 用于确定高度的属性字段
  heightScale?: number; // 高度缩放因子
}

export function GeoJSON3DVisualizer({ 
  dataSourceId = 'points',
  heightField,
  heightScale
}: GeoJSON3DVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('GeoJSON3DVisualizer: useEffect started with dataSourceId:', dataSourceId);
    
    if (!containerRef.current) {
      console.log('GeoJSON3DVisualizer: containerRef not available');
      return;
    }

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

    // 加载数据并渲染
    const loadDataAndRender = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 清除场景中的所有对象（保留灯光和网格）
        const objectsToRemove = [];
        scene.traverse(object => {
          if (object instanceof THREE.Mesh && 
              object !== gridHelper && 
              object !== ambientLight && 
              object !== directionalLight) {
            objectsToRemove.push(object);
          }
        });
        objectsToRemove.forEach(obj => scene.remove(obj));
        
        // 获取数据源配置
        const source = dataSources.find(s => s.id === dataSourceId);
        if (!source) {
          throw new Error(`数据源 ${dataSourceId} 不存在`);
        }
        
        // 使用配置或传入的高度参数
        const currentHeightField = heightField || source.heightField;
        const currentHeightScale = heightScale !== undefined ? heightScale : source.heightScale;
        
        console.log(`Loading data source: ${dataSourceId}`);
        console.log(`Using height field: ${currentHeightField}, height scale: ${currentHeightScale}`);
        
        // 动态导入数据
        const module = await source.data();
        const geojsonData = module.default || module;
        
        console.log(`Loaded ${geojsonData.features.length} features`);
        
        // 渲染GeoJSON数据
        renderGeoJSON(geojsonData, scene, currentHeightField, currentHeightScale);
        
        // 调整相机位置
        adjustCamera(camera, controls, scene);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading and rendering data:', err);
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    };

    // 渲染GeoJSON数据
    const renderGeoJSON = (
      data: GeoJSONFeatureCollection,
      scene: THREE.Scene,
      heightField: string,
      heightScale: number
    ) => {
      const meshes: THREE.Mesh[] = [];
      
      data.features.forEach((feature, index) => {
        console.log(`Processing feature ${index + 1}/${data.features.length}:`, feature.type);
        
        const geometry = createGeometryFromFeature(feature, heightField, heightScale);
        if (geometry) {
          // 根据特征类型选择不同的材质
          const material = getMaterialForFeature(feature);
          const mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);
          meshes.push(mesh);
          console.log(`Feature ${index + 1} added to scene`);
        }
      });
      
      console.log(`Total features processed: ${meshes.length}`);
    };

    // 根据特征类型创建几何体
    const createGeometryFromFeature = (
      feature: GeoJSONFeature,
      heightField: string,
      heightScale: number
    ): THREE.BufferGeometry | null => {
      const { geometry, properties } = feature;
      // 获取高度值，如果不存在则使用默认值
      const heightValue = properties[heightField] || 1;
      const height = heightValue * heightScale;
      
      switch (geometry.type) {
        case 'Point':
          return createPointGeometry(geometry as GeoJSONPoint, height);
        case 'LineString':
          return createLineGeometry(geometry as GeoJSONLineString, height);
        case 'Polygon':
          return createPolygonGeometry(geometry as GeoJSONPolygon, height);
        default:
          console.warn('Unsupported geometry type:', geometry.type);
          return null;
      }
    };

    // 创建点几何体（作为立方体）
    const createPointGeometry = (point: GeoJSONPoint, height: number): THREE.BufferGeometry => {
      const { coordinates } = point;
      // 坐标转换：将经纬度映射到场景坐标
      const x = (coordinates[0] - 116) * 2; // 以北京为中心
      const z = (35 - coordinates[1]) * 2; // 翻转纬度并缩放
      const effectiveHeight = Math.max(height, 0.5); // 确保最小高度
      
      const geometry = new THREE.BoxGeometry(0.5, effectiveHeight, 0.5);
      geometry.translate(x, effectiveHeight / 2, z);
      return geometry;
    };

    // 创建线几何体（使用TubeGeometry）
    const createLineGeometry = (line: GeoJSONLineString, height: number): THREE.BufferGeometry => {
      const { coordinates } = line;
      // 转换坐标点
      const points = coordinates.map(([lon, lat]) => {
        const x = (lon - 116) * 2;
        const z = (35 - lat) * 2;
        const y = height / 2; // 线在高度的中间位置
        return new THREE.Vector3(x, y, z);
      });
      
      // 创建曲线
      const curve = new THREE.CatmullRomCurve3(points);
      // 创建管道几何体，半径设置得大一些以便可见
      const geometry = new THREE.TubeGeometry(curve, 100, 0.1, 8, false);
      return geometry;
    };

    // 创建多边形几何体
    const createPolygonGeometry = (polygon: GeoJSONPolygon, height: number): THREE.BufferGeometry => {
      const shape = new THREE.Shape();
      const outerRing = polygon.coordinates[0];
      
      // 设置外轮廓
      outerRing.forEach(([lon, lat], index) => {
        const x = (lon - 116) * 2;
        const y = (35 - lat) * 2;
        if (index === 0) {
          shape.moveTo(x, y);
        } else {
          shape.lineTo(x, y);
        }
      });
      
      // 添加内部孔洞
      for (let i = 1; i < polygon.coordinates.length; i++) {
        const hole = new THREE.Path();
        const innerRing = polygon.coordinates[i];
        innerRing.forEach(([lon, lat], index) => {
          const x = (lon - 116) * 2;
          const y = (35 - lat) * 2;
          if (index === 0) {
            hole.moveTo(x, y);
          } else {
            hole.lineTo(x, y);
          }
        });
        shape.holes.push(hole);
      }
      
      // 挤压成3D形状
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: Math.max(height, 0.1),
        bevelEnabled: false
      });
      
      return geometry;
    };

    // 根据特征获取材质
    const getMaterialForFeature = (feature: GeoJSONFeature): THREE.Material => {
      const colorMap = {
        'Point': 0xff6b6b,
        'LineString': 0x48dbfb,
        'Polygon': 0x1dd1a1
      };
      
      const defaultColor = 0x0077ff;
      const color = colorMap[feature.geometry.type] || defaultColor;
      
      return new THREE.MeshStandardMaterial({
        color,
        transparent: false,
        opacity: 1.0,
        side: THREE.DoubleSide,
        emissive: color * 0.1, // 轻微自发光
        emissiveIntensity: 0.5
      });
    };

    // 调整相机位置以适应场景
    const adjustCamera = (camera: THREE.PerspectiveCamera, controls: OrbitControls, scene: THREE.Scene) => {
      const box = new THREE.Box3().setFromObject(scene);
      const center = new THREE.Vector3();
      box.getCenter(center);
      const size = new THREE.Vector3();
      box.getSize(size);
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 1.5; // 增加距离以便更好地查看
      
      // 设置相机位置
      camera.position.set(center.x, center.y + maxDim, center.z + cameraZ);
      controls.target.copy(center);
      controls.update();
    };

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);
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

    // 初始化
    console.log('Initializing scene...');
    loadDataAndRender();
    
    // 添加事件监听器并开始动画
    window.addEventListener('resize', handleResize);
    animate();
    console.log('Animation loop started');

    // 清理函数
    return () => {
      console.log('Cleaning up Three.js scene');
      window.removeEventListener('resize', handleResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
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
    <div 
      ref={containerRef}
      className="w-full h-[600px] border border-gray-300 rounded-lg overflow-hidden bg-gray-100"
    />
  );
}