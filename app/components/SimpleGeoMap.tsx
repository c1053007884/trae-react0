import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import dcData from '../geoJson/dc.json';

export const SimpleGeoMap: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 600;
    const margin = { top: 30, right: 20, bottom: 30, left: 20 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // 创建投影
    const projection = d3.geoMercator()
      .fitSize([chartWidth, chartHeight], dcData as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry>);
    const path = d3.geoPath().projection(projection);
    
    // 添加缩放功能
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);

    // 生成颜色渐变用于模拟地形 - 使用更美观的配色方案
    const colorScale = d3.scaleSequential(d3.interpolateTurbo)
      .domain([0, 1]);

    // 绘制区域边界并填充模拟地形颜色
    g.selectAll('.boundary')
      .data(dcData.features)
      .enter().append('path')
      .attr('class', 'boundary')
      .attr('d', (d) => path(d as unknown as GeoJSON.Feature<GeoJSON.Geometry>))
      .attr('fill', () => colorScale(Math.random() * 0.7 + 0.3))
      .attr('stroke', '#333')
      .attr('stroke-width', 1.5);

    // 模拟等高线 - 使用随机生成的多边形
    const generateRandomContours = (numContours: number) => {
      const contours = [];
      for (let i = 0; i < numContours; i++) {
        // 生成随机点
        const points = [];
        const numPoints = 8 + Math.floor(Math.random() * 12);
        const centerX = chartWidth / 2;
        const centerY = chartHeight / 2;
        const radius = (chartWidth / 4) * (1 - i / numContours * 0.8);
        
        for (let j = 0; j < numPoints; j++) {
          const angle = (j / numPoints) * Math.PI * 2;
          const randomRadius = radius * (0.9 + Math.random() * 0.2);
          points.push([
            centerX + Math.cos(angle) * randomRadius,
            centerY + Math.sin(angle) * randomRadius
          ]);
        }
        
        contours.push(points);
      }
      return contours;
    };

    const contours = generateRandomContours(5);

    // 绘制模拟等高线
    const contourPath = d3.line<[number, number]>()
      .curve(d3.curveCardinalClosed);
    
    g.selectAll('.contour')
      .data(contours)
      .enter().append('path')
      .attr('class', 'contour')
      .attr('d', (d) => contourPath(d as [number, number][]))
      .attr('fill', 'none')
      .attr('stroke', '#666')
      .attr('stroke-width', 1)
      .attr('opacity', 0.5);

    // 添加标题
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('北京市东城区地图可视化');

    // 添加图例
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 120}, ${height - 50})`);

    legend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 100)
      .attr('height', 20)
      .attr('fill', colorScale(0.5));

    legend.append('text')
      .attr('x', 0)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('dx', 50)
      .style('font-size', '12px')
      .text('模拟地形');

  }, []);

  return (
    <div className="geo-map-container">
      <svg ref={svgRef}></svg>
    </div>
  );
};