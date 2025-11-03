import type { Route } from "./+types/home";
import Terrain3D from '../components/Terrain3D';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "3D地形可视化" },
    { name: "description", content: "使用Three.js生成的3D地形可视化" },
  ];
}

export default function Home() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Terrain3D />
    </div>
  );
}
