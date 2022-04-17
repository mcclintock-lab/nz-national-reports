import { DataClass, Report, MetricGroup } from "@seasketch/geoprocessing";
import geoprocessingJson from "../geoprocessing.json";
import packageJson from "../package.json";

/**
 * Area of ocean within eez minus land in square miles. Calculated by drawing
 * sketch in seasketch project, exporting the resulting sketch, calling turf/area function on it and converting square
 * meters to square miles */
export const STUDY_REGION_AREA_SQ_METERS = undefined;

export const units = "metric";

export const localDataUrl = `http://127.0.0.1:8080/`;
export const dataBucketUrl =
  process.env.NODE_ENV === "test"
    ? localDataUrl
    : `https://gp-${packageJson.name}-datasets.s3.${geoprocessingJson.region}.amazonaws.com/`;

export const cogFileSuffix = "_cog.tif";
export const fgbFileSuffix = ".fgb";

//// OBJECTIVES ////

export const objectives = {};

//// HABITAT PROTECTION ////

// Multi-class raster (categorical)
const sccClasses: DataClass[] = Array.from({ length: 75 }, (v, i) => ({
  numericClassId: i,
  classId: `${i}`,
  display: `Group ${i}`,
}));

const habitatAreaOverlap: MetricGroup = {
  metricId: "sccHabitatAreaOverlap",
  datasourceId: "sccHabitat",
  baseFilename: "SCC_GF75_250m_merged",
  filename: `SCC_GF75_250m_merged_east180${fgbFileSuffix}`,
  classProperty: "DN",
  classes: sccClasses,
  layerId: "",
};

const habitatReport: Report = {
  reportId: "habitat",
  metrics: {
    areaOverlap: habitatAreaOverlap,
  },
};

export default {
  STUDY_REGION_AREA_SQ_METERS,
  units,
  localDataUrl,
  dataBucketUrl,
  objectives,
  metricGroups: {
    habitatAreaOverlap,
  },
  reports: {
    habitatReport,
  },
};
