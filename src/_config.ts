import { DataClass, Report } from "@seasketch/geoprocessing";
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
  classId: `Group ${i}`,
  display: `Group ${i}`,
}));

const sccHabitat: Report = {
  reportId: "sccHabitat",
  metrics: {
    areaOverlap: {
      metricId: "areaOverlap",
      baseFilename: "SCC_GF75_250m_merged_east180",
      filename: `SCC_GF75_250m_merged_east180${cogFileSuffix}`,
      classes: sccClasses,
      layerId: "",
    },
  },
};

export default {
  STUDY_REGION_AREA_SQ_METERS,
  units,
  localDataUrl,
  dataBucketUrl,
  objectives,
  reports: {
    sccHabitat
  },
};
