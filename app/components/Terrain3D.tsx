import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const Terrain3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // 控制变量
  const isDraggingRef = useRef(false);
  const lastMousePositionRef = useRef({ x: 0, y: 0 });
  const rotYRef = useRef(-0.3);
  const rotXRef = useRef(0.25);
  const cameraDistanceRef = useRef(160); // 初始相机距离
  const isFreeLookRef = useRef(false); // 自由视角模式

  // 噪声函数
  const noise2 = (x: number, y: number): number => {
    return (Math.sin(x * 1.7 + Math.cos(y * 1.3) * 0.8) + Math.cos(y * 1.9 + Math.sin(x * 1.1) * 0.7)) * 0.5;
  };

  const fbm = (x: number, y: number): number => {
    let v = 0, a = 0.5, f = 1.0;
    for (let i = 0; i < 5; i++) {
      v += a * noise2(x * f, y * f);
      a *= 0.5;
      f *= 2.0;
    }
    return v;
  };

  // 颜色映射函数
  const colormap = (t: number): [number, number, number] => {
    const q = Math.floor(t * 12) / 12; // 12个颜色级别
    const v = q;
    if (v < 0.25) return [0.02, 0.08 + v * 1.5, 0.45 + v * 0.2]; // 深蓝色
    if (v < 0.5) return [0.02, 0.3 + v * 0.9, 0.6 + (v - 0.25) * 0.7];
    if (v < 0.8) return [0.05 + (v - 0.5) * 1.2, 0.9 - (v - 0.5) * 0.6, 0.35 + (v - 0.5) * 0.4];
    return [0.7, 0.9, 0.3]; // 黄色
  };

  // 初始化场景
  const initScene = () => {
    if (!containerRef.current) return;

    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    // 创建相机
    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(120, 90, 160);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 添加光照
    const ambient = new THREE.AmbientLight(0x507080, 0.7);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(100, 150, 100);
    scene.add(dir);

    // 创建地形几何
    const SEG = 200;
    const SIZE = 200;
    const geometry = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    geometry.rotateX(-Math.PI / 2);

    // 位移顶点并计算颜色
    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    for (let i = 0; i < positions.count; i++) {
      const ix = positions.getX(i);
      const iz = positions.getZ(i);
      const nx = (ix / SIZE) + 0.5;
      const nz = (iz / SIZE) + 0.5;
      const h = fbm(nx * 8, nz * 8) * 28.0;
      positions.setY(i, h);
      const t = (h + 20) / 60;
      const rgb = colormap(Math.max(0, Math.min(1, t)));
      colors[i * 3 + 0] = rgb[0];
      colors[i * 3 + 1] = rgb[1];
      colors[i * 3 + 2] = rgb[2];
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // 创建地形网格
    const mat = new THREE.MeshStandardMaterial({ 
      vertexColors: true, 
      flatShading: true, 
      roughness: 0.9, 
      metalness: 0.0 
    });
    const terrain = new THREE.Mesh(geometry, mat);
    terrain.receiveShadow = true;
    scene.add(terrain);

    // 添加散点标记
    const pointGeom = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const pointMat = new THREE.MeshStandardMaterial({ 
      color: 0x072f8a, 
      emissive: 0x091f6a 
    });
    const points = new THREE.InstancedMesh(pointGeom, pointMat, 300);
    let idx = 0;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 300; i++) {
      const x = (Math.random() - 0.5) * SIZE * 0.95;
      const z = (Math.random() - 0.5) * SIZE * 0.95;
      const nx = (x / SIZE) + 0.5;
      const nz = (z / SIZE) + 0.5;
      const h = fbm(nx * 8, nz * 8) * 28.0 + (Math.random() - 0.5) * 1.5;
      dummy.position.set(x, h + 1.2, z);
      dummy.updateMatrix();
      points.setMatrixAt(idx++, dummy.matrix);
    }
    scene.add(points);

    // 添加分层条纹
    const stripesGroup = new THREE.Group();
    for (let s = 0; s < 14; s++) {
      const level = -6 + s * 3.6;
      const lineGeom = new THREE.BufferGeometry();
      const sampleCount = 400;
      const verts = new Float32Array(sampleCount * 3);
      for (let i = 0; i < sampleCount; i++) {
        const px = -SIZE / 2 + (i / (sampleCount - 1)) * SIZE;
        const pz = -SIZE / 2 + Math.sin(i * 0.12 + s * 0.6) * 6;
        const nx = (px / SIZE) + 0.5;
        const nz = (pz / SIZE) + 0.5;
        const hy = fbm(nx * 8, nz * 8) * 28.0;
        verts[i * 3 + 0] = px;
        verts[i * 3 + 1] = hy - Math.abs(hy - level) < 1.4 ? hy - 0.05 : level - 2.5;
        verts[i * 3 + 2] = pz;
      }
      lineGeom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      const lineMat = new THREE.LineBasicMaterial({ 
        color: 0x79e3ff, 
        linewidth: 1, 
        opacity: 0.95, 
        transparent: true 
      });
      const line = new THREE.Line(lineGeom, lineMat);
      stripesGroup.add(line);
    }
    stripesGroup.position.y = 0;
    scene.add(stripesGroup);

    // 添加角落立方体
    const cornerGeo = new THREE.BoxGeometry(18, 18, 18);
    const cornerMat = new THREE.MeshBasicMaterial({ 
      color: 0x1a9b2f, 
      wireframe: false, 
      opacity: 0.0, 
      transparent: true 
    });
    const corner = new THREE.Mesh(cornerGeo, cornerMat);
    corner.position.set(SIZE / 2 - 12, 6, SIZE / 2 - 12);
    scene.add(corner);
  };

  // 动画循环
  const animate = () => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    
    if (!scene || !camera || !renderer) return;

    // 自动旋转
    rotYRef.current += 0.0015;
    
    // 计算相机位置
    const distance = cameraDistanceRef.current;
    const phi = rotXRef.current;
    const theta = rotYRef.current;
    
    camera.position.x = distance * Math.sin(phi) * Math.cos(theta);
    camera.position.y = distance * Math.cos(phi);
    camera.position.z = distance * Math.sin(phi) * Math.sin(theta);
    
    // 自由视角模式下，相机看向当前位置的前方，而不是固定点
    if (isFreeLookRef.current) {
      camera.lookAt(
        camera.position.x + Math.sin(phi) * Math.cos(theta + Math.PI / 2),
        camera.position.y,
        camera.position.z + Math.sin(phi) * Math.sin(theta + Math.PI / 2)
      );
    } else {
      camera.lookAt(0, 20, 0); // 固定看向地形中心上方
    }

    renderer.render(scene, camera);
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // 处理鼠标事件
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    lastMousePositionRef.current = { x: e.clientX, y: e.clientY };
    
    // 右键或中键进入自由视角模式
    if (e.button === 2 || e.button === 1) {
      isFreeLookRef.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    
    const deltaX = (e.clientX - lastMousePositionRef.current.x) / 200;
    const deltaY = (e.clientY - lastMousePositionRef.current.y) / 200;
    
    lastMousePositionRef.current = { x: e.clientX, y: e.clientY };
    
    // 自由视角模式下，旋转方向不同
    if (isFreeLookRef.current) {
      rotYRef.current -= deltaX;
      rotXRef.current += deltaY;
    } else {
      rotYRef.current += deltaX;
      rotXRef.current += deltaY;
    }
    
    // 限制垂直旋转角度，避免翻转
    rotXRef.current = Math.max(0.1, Math.min(Math.PI - 0.1, rotXRef.current));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isFreeLookRef.current = false;
  };

  // 处理鼠标滚轮事件（缩放）
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY * 0.01;
    cameraDistanceRef.current = Math.max(50, Math.min(500, cameraDistanceRef.current + delta));
  };

  // 处理窗口大小变化
  const handleResize = () => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    
    if (!container || !camera || !renderer) return;
    
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  // 初始化和清理
  useEffect(() => {
    initScene();
    animate();
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      // 清理资源
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      window.removeEventListener('resize', handleResize);
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
    };
  }, []);

  return (
    <div 
      style={{ width: '100%', height: '100%', overflow: 'hidden' }}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onMouseLeave={handleMouseUp}
    />
  );
};

export default Terrain3D;