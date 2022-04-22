import React from "react";
import {
  Collapse,
  SketchClassTable,
  ResultsCard,
  useSketchProperties,
  LayerToggle,
  DataDownload,
} from "@seasketch/geoprocessing/client-ui";
import {
  ReportResult,
  ReportResultBase,
  toNullSketchArray,
  flattenBySketchAllClass,
  metricsWithSketchId,
  toPercentMetric,
  firstMatchingMetric,
} from "@seasketch/geoprocessing/client-core";
import { ClassTable } from "../components/ClassTable";

import config from "../_config";

import HabitatTotals from "../../data/precalc/sccHabitatRasterRegionTotals.json";
import { squareMeterToKilometer } from "@seasketch/geoprocessing";
const habitatPrecalcTotals = HabitatTotals as ReportResultBase;

const METRIC = config.metricGroups.habitatAreaOverlapRasterRegion;

const Habitat = () => {
  const [{ isCollection }] = useSketchProperties();

  return (
    <>
      <ResultsCard title="Habitat" functionName="sccHabitatRaster">
        {(data: ReportResult) => {
          // Get total raster cell count across all classes
          const totalMetric = firstMatchingMetric(
            habitatPrecalcTotals.metrics,
            (m) => !m.classId
          );

          // Get metrics for top-level collection or single sketch
          const parentCountMetrics = data.metrics.filter(
            (m) =>
              m.metricId === METRIC.metricId &&
              m.sketchId === data.sketch.properties.id
          );

          const parentAreaMetrics = parentCountMetrics.map((m) => ({
            ...m,
            value: (m.value / totalMetric.value) * METRIC.totalArea!, // transform cell count to area
          }));

          const percentMetricId = `${METRIC.metricId}Perc`;

          // Convert to percent metrics
          const parentPercMetrics = toPercentMetric(
            parentCountMetrics,
            habitatPrecalcTotals.metrics,
            percentMetricId
          );

          const tableMetrics = [
            ...parentAreaMetrics.map((m) => ({
              ...m,
              value: squareMeterToKilometer(m.value),
            })),
            ...parentPercMetrics,
          ];

          return (
            <>
              <LayerToggle
                layerId={METRIC.layerId}
                label="Show Habitat Layer"
              />
              <ClassTable
                titleText="Habitat Class"
                showTitle={false}
                rows={tableMetrics}
                dataGroup={METRIC}
                metricIdName={METRIC.metricId}
                percMetricIdName={percentMetricId}
                formatPerc
                showLayerToggle={false}
              />
              <DataDownload
                filename="hgmspHabitat"
                data={tableMetrics}
                titleElement={
                  <div
                    style={isCollection ? { margin: "20px 0px 0px 0px" } : {}}
                  >
                    ➥ Export Data
                  </div>
                }
              />
              {isCollection && (
                <Collapse title="Show by MPA">{genSketchTable(data)}</Collapse>
              )}
            </>
          );
        }}
      </ResultsCard>
    </>
  );
};

const genSketchTable = (data: ReportResult) => {
  // Build agg metric objects for each child sketch in collection with percValue for each class
  const childSketches = toNullSketchArray(data.sketch);
  const childSketchIds = childSketches.map((sk) => sk.properties.id);
  const childSketchMetrics = toPercentMetric(
    metricsWithSketchId(
      data.metrics.filter((m) => m.metricId === METRIC.metricId),
      childSketchIds
    ),
    habitatPrecalcTotals.metrics
  );
  const sketchRows = flattenBySketchAllClass(
    childSketchMetrics,
    METRIC.classes,
    childSketches
  );
  return <SketchClassTable rows={sketchRows} dataGroup={METRIC} formatPerc />;
};

export default Habitat;
