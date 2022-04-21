import fs from "fs";
import config from "../src/_config";
// @ts-ignore
import geoblaze from "geoblaze";
import {
  Georaster,
  Metric,
  ReportResultBase,
  classIdMapping,
  createMetric,
  rekeyMetrics,
} from "@seasketch/geoprocessing";
import { loadCogWindow } from "../src/datasources/cog";

const METRIC = config.metricGroups.habitatAreaOverlapRasterRegion;
const DEST_PATH = `${__dirname}/precalc/${METRIC.datasourceId}Totals.json`;

async function main() {
  const metricsByRegion = await Promise.all(
    METRIC.regions.map(async (region) => {
      const metricGroup = { ...METRIC, ...region };
      const url = `${config.localDataUrl}${metricGroup.filename}`;

      const raster = await loadCogWindow(url, {}); // Load wole raster
      const metrics: Metric[] = (
        await countByClass(raster, {
          classIdToName: classIdMapping(metricGroup.classes),
        })
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

  // Sum the counts to get total
  const totalMetric = createMetric({
    metricId: METRIC.metricId,
    value: Object.values(metricsByClass).reduce(
      (sumSoFar, m) => sumSoFar + m.value,
      0
    ),
  });
  const metrics = [...Object.values(metricsByClass), totalMetric];

  const result: ReportResultBase = {
    metrics: rekeyMetrics(metrics),
  };

  fs.writeFile(DEST_PATH, JSON.stringify(result, null, 2), (err) =>
    err
      ? console.error("Error", err)
      : console.info(`Successfully wrote ${DEST_PATH}`)
  );
}

(async function () {
  await main();
})().catch(console.error);

/**
 * Implements the raster-based areaByClass calculation
 * ToDo: migrate to overlapRasterClass non-sketch
 */
async function countByClass(
  /** raster to search */
  raster: Georaster,
  config: { classIdToName: Record<string, string> }
): Promise<Metric[]> {
  if (!config.classIdToName)
    throw new Error("Missing classIdToName map in config");

  const histogram = geoblaze.histogram(raster, undefined, {
    scaleType: "nominal",
  })[0];

  const numericClassIds = Object.keys(config.classIdToName);

  // Migrate the total counts, skip nodata
  let metrics: Metric[] = [];
  numericClassIds.forEach((numericClassId) => {
    if (numericClassIds.includes(numericClassId) && histogram[numericClassId]) {
      metrics.push(
        createMetric({
          metricId: METRIC.metricId,
          classId: config.classIdToName[numericClassId],
          value: histogram[numericClassId],
        })
      );
    } else {
      metrics.push(
        createMetric({
          metricId: METRIC.metricId,
          classId: config.classIdToName[numericClassId],
          value: 0,
        })
      );
    }
  });

  return metrics;
}
