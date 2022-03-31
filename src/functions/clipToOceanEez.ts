import {
  ValidationError,
  PreprocessingHandler,
  VectorDataSource,
  isPolygonFeature,
  Feature,
  Polygon,
  MultiPolygon,
  BBox,
  FeatureCollection,
  clip,
} from "@seasketch/geoprocessing";
import bboxClip from "@turf/bbox-clip";
import bbox from "@turf/bbox";
import { featureCollection as fc, feature as turfFeature } from "@turf/helpers";
import area from "@turf/area";
import kinks from "@turf/kinks";
import { clipMultiMerge } from "@seasketch/geoprocessing";
import splitGeojson from "geojson-antimeridian-cut";
import { cleanCoords } from "../util/cleanCoords";

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
  const cleanFeature = cleanCoords(feature) as Feature<MultiPolygon>;
  // Split geojson on antimeridian if it crosses, otherwise simply returns original
  const splitOrNotFeature = splitGeojson(cleanFeature);

  let clipped = await clipLand(splitOrNotFeature);
  // if (clipped) clipped = await clipOutsideEez(clipped, eezFilterByNames);

  if (!clipped || area(clipped) === 0) {
    throw new ValidationError("Sketch is outside of project boundaries");
  } else {
    return clipped;
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
