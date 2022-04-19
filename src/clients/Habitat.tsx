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
} from "@seasketch/geoprocessing/client-core";
import { ClassTable } from "../components/ClassTable";

import config from "../_config";

import HabitatTotals from "../../data/precalc/sccHabitatTotals.json";
import { squareMeterToKilometer } from "@seasketch/geoprocessing";
const existingPrecalcTotals = HabitatTotals as ReportResultBase;

const METRIC = config.metricGroups.habitatAreaOverlap;

const Habitat = () => {
  const [{ isCollection }] = useSketchProperties();

  return (
    <>
      <ResultsCard title="Habitat" functionName="sccHabitat">
        {(data: ReportResult) => {
          const parentMetrics = data.metrics.filter(
            (m) =>
              m.metricId === METRIC.metricId &&
              m.sketchId === data.sketch.properties.id
          );
          const percentMetricId = `${METRIC.metricId}Perc`;

          // Collection or single sketch
          const parentPercMetrics = toPercentMetric(
            parentMetrics,
            existingPrecalcTotals.metrics,
            percentMetricId
          );

          const tableMetrics = [
            ...parentMetrics.map((m) => ({
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
                options={{
                  classColWidth: "25%",
                  areaWidth: "30%",
                  percColWidth: "45%",
                  showMapWidth: "0%",
                  goalWidth: "0%",
                }}
              />
              <DataDownload
                filename="hgmspHabitat"
                data={parentMetrics}
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
    existingPrecalcTotals.metrics
  );
  const sketchRows = flattenBySketchAllClass(
    childSketchMetrics,
    METRIC.classes,
    childSketches
  );
  return <SketchClassTable rows={sketchRows} dataGroup={METRIC} formatPerc />;
};

export default Habitat;
