import {
  GeoprocessingHandler,
  Metric,
  Polygon,
  ReportResult,
  Sketch,
  SketchCollection,
  toNullSketch,
  rekeyMetrics,
  MultiPolygon,
  overlapRasterClass,
  classIdMapping,
  groupBy,
  toSketchArray,
  isSketchCollection,
  nestMetrics,
  createMetric,
} from "@seasketch/geoprocessing";
import { loadCogWindow } from "@seasketch/geoprocessing/dataproviders";
import bbox from "@turf/bbox";
import config from "../_config";

const METRIC = config.metricGroups.habitatAreaOverlapRasterRegion;

export async function sccHabitat(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>
): Promise<ReportResult> {
  const box = sketch.bbox || bbox(sketch);

  const sketches = toSketchArray(sketch).map((sk) => sk.properties.id);
  const sketchIds = isSketchCollection(sketch)
    ? [sketch.properties.id, ...sketches]
    : sketches;

  const metrics = (
    await Promise.all(
      METRIC.regions.map(async (region) => {
        const metricGroup = { ...METRIC, ...region };
        const url = `${config.dataBucketUrl}${metricGroup.filename}`;

        const raster = await loadCogWindow(url, {}); // Load whole raster

        const metrics: Metric[] = (
          await overlapRasterClass(
            METRIC.metricId,
            raster,
            sketch,
            classIdMapping(METRIC.classes)
          )
        ).map((m) => ({ ...m, geographyId: region.regionName }));
        return metrics;
      })
    )
  ).reduce((soFar, regionMetrics) => soFar.concat(regionMetrics), []);

  // Sum metrics for each sketch and class ID combination
  const metricsBySketchByClass = nestMetrics(metrics, [
    "sketchId",
    "classId",
  ]) as Record<string, Record<string, Metric[]>>;

  const summedMetrics: Metric[] = [];
  sketchIds.forEach((curSketchId) => {
    Object.keys(classIdMapping(METRIC.classes)).forEach((curClassId) => {
      const curMetrics = metricsBySketchByClass[curSketchId][curClassId];
      const summedMetric = curMetrics.reduce<Metric>(
        (metricSoFar, curMetric) => {
          return metricSoFar.value
            ? { ...metricSoFar, value: (metricSoFar.value += curMetric.value) }
            : curMetric;
        },
        createMetric({})
      );
      summedMetrics.push(summedMetric);
    });
  });

  return {
    metrics: rekeyMetrics(summedMetrics),
    sketch: toNullSketch(sketch, true),
  };
}

export default new GeoprocessingHandler(sccHabitat, {
  title: "sccHabitatRaster",
  description: "Find which scc habitat the sketch overlaps with",
  timeout: 240, // seconds
  executionMode: "async",
  memory: 10240,
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
});
