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
  overlapRasterClass,
} from "@seasketch/geoprocessing";
import { loadCogWindow } from "../src/datasources/cog";

const METRIC = config.metricGroups.habitatAreaOverlapRasterRegion;
const DEST_PATH = `${__dirname}/precalc/${METRIC.datasourceId}Totals.json`;

async function main() {
  const metricsByRegion = await Promise.all(
    METRIC.regions.map(async (region) => {
      const metricGroup = { ...METRIC, ...region };
      const url = `${config.localDataUrl}${metricGroup.filename}`;

      const raster = await loadCogWindow(url, {}); // Load whole raster
      const metrics: Metric[] = (
        await overlapRasterClass(
          METRIC.metricId,
          raster,
          null,
          classIdMapping(METRIC.classes)
        )
      ).map((m) => ({ ...m, geographyId: region.regionName }));
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
