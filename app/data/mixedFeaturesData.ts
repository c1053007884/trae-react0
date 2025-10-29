// 混合特征数据
export const mixedFeaturesData = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "北京首都国际机场",
        "type": "airport",
        "icao_code": "ZBAA",
        "passengers_per_year": 100000000
      },
      "geometry": {
        "type": "Point",
        "coordinates": [116.6047, 40.0799]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "上海浦东国际机场",
        "type": "airport",
        "icao_code": "ZSPD",
        "passengers_per_year": 70000000
      },
      "geometry": {
        "type": "Point",
        "coordinates": [121.8070, 31.1440]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "京广铁路",
        "length_km": 2324,
        "built_year": 1957,
        "status": "运营中"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [116.3974, 39.9093],
          [114.3055, 38.0429],
          [113.6230, 34.7466],
          [113.2644, 30.5928],
          [113.2644, 23.1291]
        ]
      }
    }
  ]
};