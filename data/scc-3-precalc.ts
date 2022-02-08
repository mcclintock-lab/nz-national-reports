// Run inside workspace
// Precalculates overall stats used by habitat protection function

import fs from "fs";
import config from "../src/_config";
import {
  Georaster,
  Metric,
  ReportResultBase,
  classIdMapping,
  createMetric,
  rekeyMetrics,
} from "@seasketch/geoprocessing";
import { loadCogWindow } from "../src/cog";
// @ts-ignore
import geoblaze from "geoblaze";

const REPORT = config.reports.sccHabitat;
const METRIC = REPORT.metrics.areaOverlap;
const DEST_PATH = `${__dirname}/precalc/sccTotals.json`;

async function main() {
  const url = `${config.localDataUrl}${METRIC.filename}`;

  try {
    const raster = await loadCogWindow(url, {}); // Load wole raster
    const metrics: Metric[] = await countByClass(raster, {
      classIdToName: classIdMapping(METRIC.classes),
    });

    const result: ReportResultBase = {
      metrics: rekeyMetrics(metrics),
    };

    fs.writeFile(DEST_PATH, JSON.stringify(result, null, 2), (err) =>
      err
        ? console.error("Error", err)
        : console.info(`Successfully wrote ${DEST_PATH}`)
    );
  } catch (err) {
    throw new Error(
      `raster fetch failed, did you start-data? Is this url correct? ${url}`
    );
  }
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
    if (histogram[numericClassId]) {
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
