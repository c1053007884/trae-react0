import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as d3 from 'd3';
import CTData from '../geoJson/contour.ts';

interface Geo3DMapProps {
  width?: number;
  height?: number;
}

export const Geo3DMap: React.FC<Geo3DMapProps> = ({ width = 800, height = 600 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 初始化场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    sceneRef.current = scene;

    // 初始化相机
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    camera.position.set(0, 50, 100); // 调整相机位置更接近地形
    camera.lookAt(0, -20, 0); // 看向地形中心
    cameraRef.current = camera;

    // 初始化渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 添加轨道控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, -20, 0); // 设置控制器目标为地形中心
    controlsRef.current = controls;

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(500, 1000, 500);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // 处理等高线数据
    const features = CTData.features;
    const contourData: { z: number; points: THREE.Vector3[] }[] = [];

    // 按z值分组等高线
    const contourMap = new Map<number, THREE.Vector3[]>();

    // 坐标偏移和缩放参数 - 根据实际数据调整
    const offsetX = 19630000;
    const offsetY = 3947000;
    const scale = 0.01; // 缩小坐标到合适范围

    features.forEach(feature => {
      if (feature.geometry.type === 'LineString') {
        const coordinates = feature.geometry.coordinates;
        const z = coordinates[0][2]; // 假设所有点的z值相同
        
        if (!contourMap.has(z)) {
          contourMap.set(z, []);
        }

        const points = coordinates.map(coord => {
          // 转换坐标到合适的比例尺和偏移量
          return new THREE.Vector3(
            (coord[0] - offsetX) * scale,
            z * 0.1, // 垂直方向缩放
            (coord[1] - offsetY) * scale
          );
        });

        contourMap.get(z)?.push(...points);
      }
    });

    // 将分组后的数据转换为数组
    contourMap.forEach((points, z) => {
      contourData.push({ z, points });
    });

    // 按z值排序
    contourData.sort((a, b) => a.z - b.z);

    // 创建地形表面 - 使用BufferGeometry
    const terrainGeometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const indices: number[] = [];
    const colors: number[] = [];

    // 首先收集所有等高线点
    const allPoints: THREE.Vector3[] = [];
    contourData.forEach(contour => {
      allPoints.push(...contour.points);
    });

    // 使用等高线数据创建地形表面
    if (allPoints.length > 0) {
      // 简单的点云可视化，以便我们能看到数据
      const pointGeometry = new THREE.BufferGeometry();
      const pointPositions = new Float32Array(allPoints.length * 3);
      const pointColors = new Float32Array(allPoints.length * 3);

      for (let i = 0; i < allPoints.length; i++) {
        const point = allPoints[i];
        pointPositions[i * 3] = point.x;
        pointPositions[i * 3 + 1] = point.y;
        pointPositions[i * 3 + 2] = point.z;

        const color = new THREE.Color();
        color.setHSL(0.3 + (point.y + 50) * 0.005, 0.7, 0.5);
        pointColors[i * 3] = color.r;
        pointColors[i * 3 + 1] = color.g;
        pointColors[i * 3 + 2] = color.b;
      }

      pointGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
      pointGeometry.setAttribute('color', new THREE.BufferAttribute(pointColors, 3));

      const pointMaterial = new THREE.PointsMaterial({ 
        size: 1, 
        vertexColors: true, 
        transparent: true, 
        opacity: 0.8
      });

      const points = new THREE.Points(pointGeometry, pointMaterial);
      scene.add(points);

      // 使用Delaunay三角化创建地形表面
      try {
        // 提取2D坐标
        const points2D = allPoints.map(point => [point.x, point.z]);
        
        // 使用D3的Delaunay三角化
        const delaunay = d3.Delaunay.from(points2D);
        const triangles = delaunay.triangles;

        // 创建顶点
        const terrainPositions: number[] = [];
        const terrainColors: number[] = [];
        const terrainIndices: number[] = [];

        allPoints.forEach(point => {
          terrainPositions.push(point.x, point.y, point.z);
          
          // 添加颜色
          const color = new THREE.Color();
          color.setHSL(0.3 + (point.y + 50) * 0.005, 0.7, 0.5); // 根据高度调整颜色
          terrainColors.push(color.r, color.g, color.b);
        });

        // 创建三角形索引
        for (let i = 0; i < triangles.length; i++) {
          terrainIndices.push(triangles[i]);
        }

        // 创建地形网格
        const terrainGeometry = new THREE.BufferGeometry();
        terrainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(terrainPositions, 3));
        terrainGeometry.setAttribute('color', new THREE.Float32BufferAttribute(terrainColors, 3));
        terrainGeometry.setIndex(terrainIndices);
        terrainGeometry.computeVertexNormals();

        const terrainMaterial = new THREE.MeshStandardMaterial({ 
          vertexColors: true,
          side: THREE.DoubleSide,
          opacity: 0.8,
          transparent: true
        });

        const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
        scene.add(terrain);
      } catch (error) {
        console.error('Error creating terrain:', error);
      }
    }

    terrainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    terrainGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    terrainGeometry.setIndex(indices);
    terrainGeometry.computeVertexNormals();

    const terrainMaterial = new THREE.MeshStandardMaterial({ 
      vertexColors: true,
      side: THREE.DoubleSide,
      flatShading: false
    });

    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.castShadow = true;
    terrain.receiveShadow = true;
    scene.add(terrain);

    // 添加实际等高线作为线框
    contourData.forEach(contour => {
      const points = contour.points;
      const z = contour.z;

      if (points.length > 1) {
        const contourGeometry = new THREE.BufferGeometry();
        const contourPositions = new Float32Array(points.length * 3);
        
        for (let i = 0; i < points.length; i++) {
          contourPositions[i * 3] = points[i].x;
          contourPositions[i * 3 + 1] = points[i].y;
          contourPositions[i * 3 + 2] = points[i].z;
        }

        contourGeometry.setAttribute('position', new THREE.BufferAttribute(contourPositions, 3));
        
        const contourMaterial = new THREE.LineBasicMaterial({ 
          color: 0x000000,
          opacity: 0.5,
          transparent: true
        });

        const contourLine = new THREE.Line(contourGeometry, contourMaterial);
        scene.add(contourLine);
      }
    });

    // 添加体积层 - 使用多个平面表示不同高度的地质层
    const volumeLayers = 10;
    const minZ = Math.min(...contourData.map(c => c.z));
    const maxZ = Math.max(...contourData.map(c => c.z));
    const layerHeight = (maxZ - minZ) / volumeLayers;

    for (let i = 0; i < volumeLayers; i++) {
      const z = minZ + i * layerHeight;
      const layerGeometry = new THREE.PlaneGeometry(100, 100, 10, 10);
      const layerMaterial = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color().setHSL(0.1 + i * 0.08, 0.8, 0.5),
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
      });

      const layer = new THREE.Mesh(layerGeometry, layerMaterial);
      layer.position.y = z * 0.1;
      layer.rotation.x = Math.PI / 2;
      scene.add(layer);
    }

    // 添加网格辅助线
    const gridHelper = new THREE.GridHelper(50, 20, 0x444444, 0x222222);
    gridHelper.position.y = -50;
    scene.add(gridHelper);

    // 添加裁剪平面
    const clipPlanes = [
      new THREE.Plane(new THREE.Vector3(0, -1, 0), 0), // 底部裁剪
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 100)  // 顶部裁剪
    ];

    // 应用裁剪平面到材质
    terrainMaterial.clippingPlanes = clipPlanes;
    terrainMaterial.clipShadows = true;

    // 添加裁剪平面可视化
    const clipHelper1 = new THREE.PlaneHelper(clipPlanes[0], 500, 0xff0000);
    clipHelper1.visible = false;
    scene.add(clipHelper1);

    const clipHelper2 = new THREE.PlaneHelper(clipPlanes[1], 500, 0x00ff00);
    clipHelper2.visible = false;
    scene.add(clipHelper2);

    // 添加交互控制
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    containerRef.current.addEventListener('mousemove', (event: MouseEvent) => {
      mouse.x = (event.clientX / width) * 2 - 1;
      mouse.y = -(event.clientY / height) * 2 + 1;

      // 更新射线
      raycaster.setFromCamera(mouse, camera);

      // 检测与地形的交互
      const intersects = raycaster.intersectObject(terrain);
      if (intersects.length > 0) {
        containerRef.current!.style.cursor = 'pointer';
      } else {
        containerRef.current!.style.cursor = 'default';
      }
    });

    containerRef.current.addEventListener('click', (event: MouseEvent) => {
      mouse.x = (event.clientX / width) * 2 - 1;
      mouse.y = -(event.clientY / height) * 2 + 1;

      // 更新射线
      raycaster.setFromCamera(mouse, camera);

      // 检测与地形的点击
      const intersects = raycaster.intersectObject(terrain);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        console.log('点击位置:', point);
      }
    });

    // 渲染循环
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 清理
    return () => {
      renderer.dispose();
      terrainGeometry.dispose();
      terrainMaterial.dispose();
      containerRef.current?.removeChild(renderer.domElement);
      containerRef.current?.removeEventListener('mousemove', () => {});
      containerRef.current?.removeEventListener('click', () => {});
    };
  }, [width, height]);

  return <div ref={containerRef} style={{ width, height }} />;
};