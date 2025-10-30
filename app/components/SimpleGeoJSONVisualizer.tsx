import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { geoPath, geoContour, geoNaturalEarth1, geoGraticule } from 'd3-geo';
import { extent, range } from 'd3-array';
import { scaleSequential } from 'd3-scale';
import { interpolateViridis } from 'd3-scale-chromatic';

interface GeoJSONVisualizerProps {
  width?: number;
  height?: number;
}

// 模拟高程数据生成函数
const generateElevationData = (width: number = 50, height: number = 50) => {
  const data: number[][] = [];
  
  // 创建带有山峰和谷地的模拟地形
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      // 生成多个山峰
      let elevation = 0;
      
      // 第一个山峰
      const dx1 = x - width * 0.3;
      const dy1 = y - height * 0.4;
      elevation += Math.exp(-(dx1 * dx1 + dy1 * dy1) / (width * height * 0.01)) * 100;
      
      // 第二个山峰
      const dx2 = x - width * 0.7;
      const dy2 = y - height * 0.6;
      elevation += Math.exp(-(dx2 * dx2 + dy2 * dy2) / (width * height * 0.015)) * 80;
      
      // 添加一些随机噪声
      elevation += Math.random() * 10;
      
      row.push(elevation);
    }
    data.push(row);
  }
  
  return data;
};

// 生成GeoJSON格式的数据
const generateGeoJSONData = (elevationData: number[][]) => {
  const width = elevationData[0].length;
  const height = elevationData.length;
  const cells: any[] = [];
  
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      cells.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [x, y],
            [x + 1, y],
            [x + 1, y + 1],
            [x, y + 1],
            [x, y]
          ]]
        },
        properties: {
          value: (elevationData[y][x] + elevationData[y][x+1] + 
                  elevationData[y+1][x] + elevationData[y+1][x+1]) / 4
        }
      });
    }
  }
  
  return {
    type: 'FeatureCollection',
    features: cells
  };
};

const SimpleGeoJSONVisualizer: React.FC<GeoJSONVisualizerProps> = ({
  width = 800,
  height = 500
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const pathRef = useRef<d3.GeoPath<any, d3.GeoGeometryObjects> | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // 清除现有内容
    d3.select(svgRef.current).selectAll('*').remove();

    // 创建SVG元素
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');

    // 创建投影
    projectionRef.current = geoNaturalEarth1()
      .fitSize([width, height], { type: 'Sphere' });

    pathRef.current = geoPath(projectionRef.current);

    // 生成模拟高程数据
    const elevationData = generateElevationData(100, 100);
    const geoJSONData = generateGeoJSONData(elevationData);

    // 计算高程范围
    const values = elevationData.flat();
    const [minValue, maxValue] = extent(values) as [number, number];
    
    // 创建等高线生成器
    const contourGenerator = geoContour()
      .extent([[0, 0], [100, 100]])
      .size([100, 100])
      .thresholds(range(minValue, maxValue, 10));

    // 生成等高线
    const contours = contourGenerator(elevationData);

    // 创建颜色比例尺
    const colorScale = scaleSequential(interpolateViridis)
      .domain([minValue, maxValue]);

    // 创建等高线路径
    svg.append('g')
      .selectAll('path')
      .data(contours.features)
      .join('path')
      .attr('d', pathRef.current)
      .attr('fill', (d) => d.properties?.value ? colorScale(d.properties.value) : 'none')
      .attr('stroke', '#666')
      .attr('stroke-width', 0.5);

    // 添加坐标轴网格
    const graticule = geoGraticule();
    svg.append('g')
      .attr('stroke', '#ddd')
      .attr('stroke-width', 0.5)
      .selectAll('path')
      .data([graticule()])
      .join('path')
      .attr('d', pathRef.current);

    // 添加标题
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '18px')
      .attr('font-weight', 'bold')
      .text('D3.js 等高线图示例');

    // 添加图例
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = width - legendWidth - 20;
    const legendY = height - 40;

    // 创建渐变
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'colorGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', colorScale(minValue));

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', colorScale(maxValue));

    // 绘制图例
    svg.append('rect')
      .attr('x', legendX)
      .attr('y', legendY)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', 'url(#colorGradient)');

    // 添加图例标签
    svg.append('text')
      .attr('x', legendX)
      .attr('y', legendY - 10)
      .attr('font-size', '12px')
      .text(`高程范围: ${Math.round(minValue)} - ${Math.round(maxValue)}`);

    // 添加交互功能 - 鼠标悬停显示高程值
    svg.append('text')
      .attr('id', 'tooltip')
      .attr('x', 10)
      .attr('y', 30)
      .attr('font-size', '14px')
      .attr('fill', '#333')
      .text('鼠标悬停查看高程值');

    svg.selectAll('path')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke', '#333')
          .attr('stroke-width', 2);

        if (d.properties?.value) {
          svg.select('#tooltip')
            .text(`高程: ${Math.round(d.properties.value)}`);
        }
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke', '#666')
          .attr('stroke-width', 0.5);
      });

  }, [width, height]);

  return (
    <div className="geo-visualizer-container">
      <svg ref={svgRef}></svg>
      <div className="visualizer-info">
        <p>使用D3.js生成的等高线图，模拟了GeoJSON格式的地形数据</p>
      </div>
    </div>
  );
};

export default SimpleGeoJSONVisualizer;