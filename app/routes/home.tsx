import type { Route } from "./+types/home";
import { SimpleGeoMap } from '../components/SimpleGeoMap';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "GeoJSON等高线图" },
    { name: "description", content: "使用d3生成的GeoJSON等高线图可视化" },
  ];
}

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <SimpleGeoMap />
    </div>
  );
}
