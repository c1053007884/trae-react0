import type { Route } from "./+types/home";
import SimpleGeoJSONVisualizer from "../components/SimpleGeoJSONVisualizer";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "D3.js 等高线图示例" },
    { name: "description", content: "使用D3.js生成的GeoJSON等高线图可视化" },
  ];
}

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">GeoJSON 等高线图可视化</h1>
      <SimpleGeoJSONVisualizer width={900} height={600} />
    </div>
  );
}
