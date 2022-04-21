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

  const metricsByRegion = await Promise.all(
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
      ).map((m) => ({ ...m, regionId: region.regionName }));
      return metrics;
    })
  );

  // seed with first region metrics
  const metricsByClass = metricsByRegion[0].reduce<Record<string, Metric>>(
    (soFar, metric) => ({ ...soFar, [metric.classId!]: metric }),
    {}
  );

  // traverse remaining regions adding their value
  METRIC.regions.slice(1).forEach((region, regionIndex) => {
    const curRegionMetrics = metricsByRegion[regionIndex + 1];
    curRegionMetrics.forEach((m) => {
      metricsByClass[m.classId!].value += m.value;
    });
  });

  const metrics = Object.values(metricsByClass);

  return {
    metrics: rekeyMetrics(metrics),
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
