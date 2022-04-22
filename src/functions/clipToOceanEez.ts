import {
  ValidationError,
  PreprocessingHandler,
  VectorDataSource,
  isPolygonFeature,
  Feature,
  Polygon,
  MultiPolygon,
  clip,
  isMultiPolygonFeature,
} from "@seasketch/geoprocessing";
import bbox from "@turf/bbox";
import { featureCollection as fc, multiPolygon } from "@turf/helpers";
import area from "@turf/area";
import kinks from "@turf/kinks";
import booleanIntersects from "@turf/boolean-intersects";
import { clipMultiMerge } from "@seasketch/geoprocessing";
import splitGeojson from "geojson-antimeridian-cut";
import { cleanCoords } from "../util/cleanCoords";
import flatten from "@turf/flatten";

const MAX_SIZE = 100000000 * 1000 ** 2;

type LandFeature = Feature<Polygon, { gid: number }>;
type EezLandUnion = Feature<Polygon, { gid: number; UNION: string }>;

// Defined at module level for potential caching/reuse by serverless process
const SubdividedLandSource = new VectorDataSource<LandFeature>(
  "https://d2w9fmrdefgbbv.cloudfront.net"
);
const SubdividedEezLandUnionSource = new VectorDataSource<EezLandUnion>(
  "https://d3muy0hbwp5qkl.cloudfront.net"
);

export async function clipLand(feature: Feature<Polygon | MultiPolygon>) {
  const landFeatures = await SubdividedLandSource.fetchUnion(
    bbox(feature),
    "gid"
  );
  if (landFeatures.features.length === 0) return feature;
  return clip(fc([feature, ...landFeatures.features]), "difference");
}

export async function clipOutsideEez(
  feature: Feature<Polygon | MultiPolygon>,
  eezFilterByNames: string[] = ["New Zealand"]
) {
  let eezFeatures = await SubdividedEezLandUnionSource.fetch(bbox(feature));
  if (eezFeatures.length === 0) return feature;
  // Optionally filter down to a single country/union EEZ boundary
  if (eezFilterByNames.length > 0) {
    eezFeatures = eezFeatures.filter((e) =>
      eezFilterByNames.includes(e.properties.UNION)
    );
  }
  return clipMultiMerge(feature, fc(eezFeatures), "intersection");
}

/**
 * Takes a Polygon feature and returns the portion that is in the ocean and within an EEZ boundary
 * If results in multiple polygons then returns the largest
 */
export async function clipToOceanEez(
  feature: Feature,
  eezFilterByNames?: string[]
): Promise<Feature> {
  if (!isPolygonFeature(feature)) {
    throw new ValidationError("Input must be a polygon");
  }

  if (area(feature) > MAX_SIZE) {
    throw new ValidationError(
      "Please limit sketches to under 100,000,000 square km"
    );
  }

  const kinkPoints = kinks(feature);
  if (kinkPoints.features.length > 0) {
    throw new ValidationError("Your sketch polygon crosses itself.");
  }

  // Ensure coordinate positions are within -180 to 180 longitude, -90 to 90 latitude
  const cleanFeature = cleanCoords(feature) as Feature<Polygon | MultiPolygon>;

  // Split sketch on antimeridian.  If it doesn't cross simply returns original polygon
  const splitOrNotFeature = splitGeojson(cleanFeature);

  let clipped = await clipLand(splitOrNotFeature);
  // if (clipped) clipped = await clipOutsideEez(clipped, eezFilterByNames);

  if (!clipped || area(clipped) === 0) {
    throw new ValidationError("Sketch is outside of project boundaries");
  } else {
    if (clipped.geometry.type === "MultiPolygon") {
      // If clipping produces a multipolygon, keep its biggest polygon
      // But if sketch was split on antimeridian, then keep its two biggest polygons (assuming one on each side)
      const numPolysToKeep = isMultiPolygonFeature(splitOrNotFeature) ? 2 : 1;

      const flattened = flatten(clipped);
      const polysByArea = flattened.features
        .map((poly) => ({ poly, area: area(poly) }))
        .sort((a, b) => b.area - a.area);
      if (numPolysToKeep === 1) {
        return polysByArea[0].poly as Feature<Polygon>;
      } else {
        // must be 2 to keep
        // if (booleanIntersects(polysByArea[0].poly, polysByArea[1].poly)) {
        return multiPolygon([
          polysByArea[0].poly.geometry.coordinates,
          polysByArea[1].poly.geometry.coordinates,
        ]);
        // } else {
        // if the two largest polys don't share at least one common point (as would happen with a clean antimeridian cut)
        // then must have hit an edge case such as sketch splitting across land and the antimeridian
        // so just return the largest polygons
        // return polysByArea[0].poly;
        // }
      }
    } else {
      return clipped;
    }
  }
}

export default new PreprocessingHandler(clipToOceanEez, {
  title: "clipToOceanEez",
  description:
    "Erases portion of sketch overlapping with land or extending into ocean outsize EEZ boundary",
  timeout: 40,
  requiresProperties: [],
  memory: 10240,
});
