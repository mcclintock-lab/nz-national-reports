import {
  rekeyMetrics,
  sortMetrics,
  toNullSketch,
  Sketch,
  SketchCollection,
  GeoprocessingHandler,
  Polygon,
  ReportResult,
  createMetric,
  isSketchCollection,
  MultiPolygon,
} from "@seasketch/geoprocessing";
import config from "../_config";
import turfArea from "@turf/area";

const METRIC = config.metricGroups.sketchArea;
const CLASS = METRIC.classes[0];

export async function area(
  sketch:
    | Sketch<Polygon | MultiPolygon>
    | SketchCollection<Polygon | MultiPolygon>
): Promise<ReportResult> {
  let metrics = [
    createMetric({
      metricId: METRIC.metricId,
      classId: CLASS.classId,
      sketchId: sketch.properties.id,
      value: turfArea(sketch),
    }),
  ];

  if (isSketchCollection(sketch)) {
    metrics = metrics.concat(
      sketch.features.map((sk) =>
        createMetric({
          metricId: METRIC.metricId,
          classId: CLASS.classId,
          sketchId: sk.properties.id,
          value: turfArea(sk),
        })
      )
    );
  }

  return {
    metrics: rekeyMetrics(sortMetrics(metrics)),
    sketch: toNullSketch(sketch),
  };
}

export default new GeoprocessingHandler(area, {
  title: "area",
  description: "returnsarea metrics for sketch",
  timeout: 30, // seconds
  executionMode: "async",
  // Specify any Sketch Class form attributes that are required
  requiresProperties: [],
  memory: 2048,
});
