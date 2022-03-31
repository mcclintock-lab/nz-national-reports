const anti = require('geojson-antimeridian-cut')

let polygon = {
    "type": "FeatureCollection",
    "features": [{
    "type": "Feature",
    "properties": {
      "name": "Anchorage to Tokyo"
    },
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [170, 10],
          [170, -10],
          [-170, -10],
          [-170, 10],
          [170, 10],
        ],
      ]
    }
  }
   ]
  }

let newPoly = {
    "type": "FeatureCollection",
    "features": [{
    "type": "Feature",
    "properties": {
      "name": "Anchorage to Tokyo"
    },
    "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -198.6328125,
              -19.973348786110602
            ],
            [
              -204.609375,
              -35.17380831799957
            ],
            [
              -162.0703125,
              -37.16031654673676
            ],
        [
              -162.7734375,
              -20.632784250388013
            ],
            [
              -198.6328125,
              -19.973348786110602
            ]
          ]
        ]
      }
  }
   ]
  }

  let addPoly = {
    "type": "FeatureCollection",
    "features": [{
    "type": "Feature",
    "properties": {
      "name": "Anchorage to Tokyo"
    },
    "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              162.6328125,
              -19.973348786110602
            ],
            [
              156.609375,
              -35.17380831799957
            ],
            [
              -162.0703125,
              -37.16031654673676
            ],
            [
              -162.7734375,
              -20.632784250388013
            ],
            [
              162.6328125,
              -19.973348786110602
            ]
          ]
        ]
      }
  }
   ]
  }

let line = {
  "type": "FeatureCollection",
  "features": [{
  "type": "Feature",
  "properties": {
    "name": "Anchorage to Tokyo"
  },
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-149.89, 61.23],
      [-220.29, 35.69]
    ]
  }
}
 ]
}

let multipolygon = {
    "type": "FeatureCollection",
    "features": [{
    "type": "Feature",
    "properties": {
      "name": "Anchorage to Tokyo"
    },
    "geometry": {
            "type": "MultiPolygon",
            "coordinates": [[
              [
                [180, 10],
                [170, 10],
                [170, -10],
                [180, -10],
                [180, 10]
              ],
              [
                [-180, -10],
                [-170, -10],
                [-170, 10],
                [-180, 10],
                [-180, -10]
              ]
            ]]
    }
  }
   ]
  }


----

function latitude (lat) {
    if (lat === undefined || lat === null) throw new Error('lat is required')
  
    // Latitudes cannot extends beyond +/-90 degrees
    if (lat > 90 || lat < -90) {
      lat = lat % 180
      if (lat > 90) lat = -180 + lat
      if (lat < -90) lat = 180 + lat
      if (lat === -0) lat = 0
    }
    return lat
  }

  function longitude (lng) {
    if (lng === undefined || lng === undefined) throw new Error('lng is required')
  
    // lngitudes cannot extends beyond +/-90 degrees
    if (lng > 180 || lng < -180) {
      lng = lng % 360
      if (lng > 180) lng = -360 + lng
      if (lng < -180) lng = 360 + lng
      if (lng === -0) lng = 0
    }
    return lng
  }

  const { coordReduce } = require('@turf/meta')

  let newPoly = {
    "type": "FeatureCollection",
    "features": [{
    "type": "Feature",
    "properties": {
      "name": "Anchorage to Tokyo"
    },
    "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              -198.6328125,
              -19.973348786110602
            ],
            [
              -204.609375,
              -35.17380831799957
            ],
            [
              -162.0703125,
              -37.16031654673676
            ],
            [
              -162.7734375,
              -20.632784250388013
            ],
            [
              -198.6328125,
              -19.973348786110602
            ]
          ]
        ]
      }
  }
   ]
  }

  coordReduce(newPoly, function (previousValue, currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
    return [longitude(currentCoord[0]), latitude(currentCoord[1])]
  })