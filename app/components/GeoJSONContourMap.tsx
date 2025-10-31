import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import contour from 'd3-contour';
import dcData from '../geoJson/dc.json';

interface GeoJSONContourMapProps {
  width?: number;
  height?: number;
}

export const GeoJSONContourMap: React.FC<GeoJSONContourMapProps> = ({
  width = 800,
  height = 600
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // 清除之前的内容
    d3.select(svgRef.current).selectAll('*').remove();

    // 设置SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const margin = { top: 20, right: 20, bottom: 50, left: 20 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    try {
      // 提取所有坐标点
      const coordinates: [number, number][] = [];
      
      // 处理MultiPolygon几何数据
      dcData.features.forEach((feature: any) => {
        if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
          feature.geometry.coordinates.forEach((polygon: any) => {
            polygon.forEach((ring: any) => {
              ring.forEach((coord: [number, number]) => {
                coordinates.push(coord);
              });
            });
          });
        }
      });

      // 计算边界框
      const xExtent = d3.extent(coordinates, d => d[0]);
      const yExtent = d3.extent(coordinates, d => d[1]);

      // 创建投影
      const projection = d3.geoMercator()
        .fitSize([chartWidth, chartHeight], {
          type: 'FeatureCollection',
          features: dcData.features
        });

      // 创建路径生成器
      const path = d3.geoPath().projection(projection);

      // 创建模拟高度场
      const gridSize = 100;
      const heightData: number[][] = [];
      
      // 填充高度数据
      const xScale = d3.scaleLinear().domain(xExtent as [number, number]).range([0, gridSize - 1]);
      const yScale = d3.scaleLinear().domain(yExtent as [number, number]).range([0, gridSize - 1]);
      
      // 生成噪声高度
      for (let i = 0; i < gridSize; i++) {
        heightData[i] = [];
        for (let j = 0; j < gridSize; j++) {
          const nx = (i / gridSize - 0.5) * 2;
          const ny = (j / gridSize - 0.5) * 2;
          heightData[i][j] = Math.sin(nx * 5) * Math.cos(ny * 5) * 100 + Math.sin(nx * 2) * Math.cos(ny * 2) * 50;
        }
      }

      // 创建等高线生成器
      const contourGenerator = contour()
        .size([gridSize, gridSize])
        .thresholds(10);

      // 生成等高线
      const contours = contourGenerator(heightData);

      // 创建等高线的投影函数
      const contourProjection = d3.geoTransform({
        point: function(x: number, y: number) {
          const lon = xScale.invert(x);
          const lat = yScale.invert(y);
          const proj = projection([lon, lat]);
          if (proj) {
            this.stream.point(proj[0], proj[1]);
          }
        }
      });

      // 创建等高线路径生成器
      const contourPath = d3.geoPath().projection(contourProjection);

      // 绘制等高线
      const colorScale = d3.scaleSequential(d3.interpolateViridis)
        .domain(d3.extent(contours, d => d.value));

      g.selectAll('.contour')
        .data(contours)
        .enter().append('path')
        .attr('class', 'contour')
        .attr('d', contourPath)
        .attr('fill', (d: any) => colorScale(d.value))
        .attr('stroke', '#666')
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.7);

      // 绘制原始GeoJSON边界
      g.selectAll('.boundary')
        .data(dcData.features)
        .enter().append('path')
        .attr('class', 'boundary')
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', '#333')
        .attr('stroke-width', 1.5);

      // 添加颜色图例
      const legendHeight = 20;
      const legend = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${height - margin.bottom + 5})`);

      // 创建颜色条
      const defs = svg.append('defs');
      const linearGradient = defs.append('linearGradient')
        .attr('id', 'colorGradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');

      linearGradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.interpolateViridis(0));

      linearGradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', d3.interpolateViridis(1));

      legend.append('rect')
        .attr('width', chartWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#colorGradient)');

      // 添加图例标签
      const extent = d3.extent(contours, d => d.value);
      if (extent[0] !== undefined && extent[1] !== undefined) {
        const minValue = Math.round(extent[0] * 10) / 10;
        const maxValue = Math.round(extent[1] * 10) / 10;
        
        legend.append('text')
          .attr('x', 0)
          .attr('y', legendHeight + 20)
          .attr('text-anchor', 'start')
          .text(`高程: ${minValue}`);

        legend.append('text')
          .attr('x', chartWidth)
          .attr('y', legendHeight + 20)
          .attr('text-anchor', 'end')
          .text(`高程: ${maxValue}`);
      }
    } catch (error) {
      console.error('Error rendering contour map:', error);
    }
  }, [width, height]);

  return (
    <div className="geo-contour-map-container">
      <h2 className="text-xl font-bold mb-4">GeoJSON等高线图</h2>
      <svg ref={svgRef}></svg>
    </div>
  );
};