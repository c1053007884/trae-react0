// 多边形数据
export const polygonsData = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "北京市区域",
        "area_km2": 16410,
        "administrative_level": "直辖市",
        "population": 21540000
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [116.0, 40.0],
            [117.0, 40.0],
            [117.0, 39.5],
            [116.5, 39.0],
            [116.0, 39.5],
            [116.0, 40.0]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "太湖流域",
        "area_km2": 22500,
        "type": "湖泊流域",
        "description": "中国第三大淡水湖"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [120.0, 31.5],
            [120.5, 31.5],
            [120.7, 31.2],
            [120.5, 30.9],
            [120.0, 30.9],
            [119.8, 31.2],
            [120.0, 31.5]
          ],
          [
            [120.1, 31.3],
            [120.3, 31.3],
            [120.3, 31.1],
            [120.1, 31.1],
            [120.1, 31.3]
          ]
        ]
      }
    }
  ]
};