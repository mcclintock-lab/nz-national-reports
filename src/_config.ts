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

const sketchArea: MetricGroup = {
  metricId: "sketchArea",
  classes: [
    {
      classId: "sketchArea",
      display: "Sketch Area",
    },
  ],
};

const sizeReport: Report = {
  reportId: "size",
  metrics: {
    sketchArea,
  },
};

//// HABITAT PROTECTION ////

// Multi-class raster (categorical)
const sccClasses: DataClass[] = Array.from({ length: 75 }, (v, i) => ({
  numericClassId: i + 1,
  classId: `${i + 1}`,
  display: `Group ${i + 1}`,
}));

// Vector based - unused
const habitatAreaOverlap: MetricGroup = {
  metricId: "sccHabitatAreaOverlap",
  datasourceId: "sccHabitat",
  baseFilename: "SCC_GF75_250m_merged",
  filename: `SCC_GF75_250m_merged${fgbFileSuffix}`,
  classProperty: "DN",
  classes: sccClasses,
  layerId: "6063dc472b3a98ca7fba3567",
};

// Raster-based
interface MetricGroupRegion extends MetricGroup {
  regions: Array<{
    regionName: string;
    baseFilename: string;
    filename: string;
  }>;
  totalArea?: number;
}

const habitatAreaOverlapRasterRegion: MetricGroupRegion = {
  metricId: "sccHabitatAreaOverlap",
  datasourceId: "sccHabitatRasterRegion",
  totalArea: 8464 * 250 * (13340 * 250), // based on equal area raster dimensions and cell size
  regions: [
    {
      regionName: "east",
      baseFilename: "SCC_GF75_250m_merged_east180",
      filename: `SCC_GF75_250m_merged_east180${cogFileSuffix}`,
    },
    {
      regionName: "west",
      baseFilename: "SCC_GF75_250m_merged_west180",
      filename: `SCC_GF75_250m_merged_west180${cogFileSuffix}`,
    },
  ],
  classes: sccClasses,
  layerId: "6063dc472b3a98ca7fba3567",
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
    sketchArea,
    habitatAreaOverlap,
    habitatAreaOverlapRasterRegion,
  },
  reports: {
    sizeReport,
    habitatReport,
  },
};
