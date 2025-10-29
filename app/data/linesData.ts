// 路线数据
export const linesData = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "京杭大运河",
        "length_km": 1794,
        "built_year": "春秋时期",
        "status": "历史古迹"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [116.3974, 39.9093],
          [117.2009, 39.0842],
          [118.7969, 32.0603],
          [120.5853, 31.2989],
          [121.4737, 31.2304]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "京沪高铁",
        "length_km": 1318,
        "built_year": 2011,
        "status": "运营中"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [116.3974, 39.9093],
          [117.0616, 38.5690],
          [117.9891, 36.6512],
          [118.7143, 34.2650],
          [119.9799, 31.9761],
          [121.4737, 31.2304]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "长江流域示意",
        "length_km": 6300,
        "status": "河流"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [95.0, 33.0],
          [100.0, 30.0],
          [105.0, 28.0],
          [110.0, 25.0],
          [115.0, 28.0],
          [120.0, 30.0]
        ]
      }
    }
  ]
};