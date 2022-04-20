import {
  Feature,
  GeoprocessingHandler,
  Metric,
  Polygon,
  ReportResult,
  Sketch,
  SketchCollection,
  toNullSketch,
  rekeyMetrics,
  sortMetrics,
  overlapFeatures,
  MultiPolygon,
  VectorDataSource,
} from "@seasketch/geoprocessing";
import { fgbFetchAll } from "@seasketch/geoprocessing/dataproviders";
import bbox from "@turf/bbox";
import config from "../_config";

const METRIC = config.metricGroups.habitatAreaOverlap;

export const classProperty = "DN";
export type HabitatProperties = {
  [classProperty]: string;
};
export type HabitatFeature = Feature<Polygon, HabitatProperties>;

const SubdividedHabitatSource = new VectorDataSource<HabitatFeature>(
  "https://d2zhyg02k9buea.cloudfront.net"
);

export async function sccHabitat(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>
): Promise<ReportResult> {
  const box = sketch.bbox || bbox(sketch);
  // const url = `${config.dataBucketUrl}${METRIC.filename}`;
  // console.log(url);

  // const features = await fgbFetchAll<ExistingProtectionFeature>(url, box);
  let features = await SubdividedHabitatSource.fetch(box);

  const metrics: Metric[] = (
    await Promise.all(
      METRIC.classes.map(async (curClass) => {
        // Filter out single class, exclude null geometry too
        const classFeatures = features.filter((feat) => {
          return (
            `${feat.geometry && feat.properties[classProperty]}` ===
            curClass.classId
          );
        }, []);
        const overlapResult = await overlapFeatures(
          METRIC.metricId,
          classFeatures,
          sketch
        );
        // Transform from simple to extended metric
        return overlapResult.map(
          (metric): Metric => ({
            ...metric,
            classId: curClass.classId,
          })
        );
      })
    )
  ).reduce(
    // merge
    (metricsSoFar, curClassMetrics) => [...metricsSoFar, ...curClassMetrics],
    []
  );

  return {
    metrics: rekeyMetrics(metrics),
    sketch: toNullSketch(sketch, true),
  };
}

export default new GeoprocessingHandler(sccHabitat, {
  title: "sccHabitat",
  description: "Find which scc habitat the sketch overlaps with",
  timeout: 240, // seconds
  executionMode: "async",
  memory: 10240,
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
