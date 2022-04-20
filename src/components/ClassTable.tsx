import React from "react";
import {
  percentWithEdge,
  DataGroup,
  Metric,
  keyBy,
  nestMetrics,
} from "@seasketch/geoprocessing/client-core";
import {
  Column,
  Table,
  LayerToggle,
  SmallReportTableStyled,
} from "@seasketch/geoprocessing/client-ui";
import { CheckCircleFill } from "@styled-icons/bootstrap";
import { HorizontalStackedBar } from "./HorizontalStackedBar";

const Number = new Intl.NumberFormat("en", { style: "decimal" });

/**
 * Stories to create
 * percent value
 * nopercent value
 * area column and not
 */

export interface ClassTableProps {
  /** Table row objects, each expected to have a classId and value. Defaults to "Class" */
  rows: Metric[];
  /** Data class definitions. if group has layerId at top-level, will display one toggle for whole group */
  dataGroup: DataGroup;
  /** Whether to format metric value and goal value as a percent.  Defaults to false */
  formatPerc?: boolean;
  /** Text to display for class name column.  Defaults to "Class" */
  titleText?: string;
  /** Whether to show map layer toggle column.  Data classes must have layerId defined */
  showLayerToggle?: boolean;
  /** Text to display for layer toggle column.  Defaults to "Show Map" */
  layerColText?: string;
  /** Whether to show title value */
  showTitle?: boolean;
  /** Whether to show goal column.  Data classes must have a goalValue defined. Defaults to false */
  showGoal?: boolean;
  /** Whether to show area column.   */
  showArea?: boolean;
  /** Text to display for value column.  Defaults to "Within Plan" */
  valueColText?: string;
  /** Text to display for area column, if visible.  Defaults to "%" */
  percColText?: string;
  /** Text to display for goal column.  Defaults to "Goal" */
  goalColText?: string;
  metricIdName?: string;
  percMetricIdName?: string;
  unitLabel?: string;
  /** Override column widths */
  options?: {
    classColWidth?: string;
    percColWidth?: string;
    showMapWidth?: string;
    goalWidth?: string;
    areaWidth?: string;
  };
}

/**
 * Table displaying class metrics, one class per table row
 */
export const ClassTable: React.FunctionComponent<ClassTableProps> = ({
  titleText = "Class",
  rows,
  dataGroup,
  formatPerc = false,
  valueColText = " ",
  percColText = "% Within Plan",
  showLayerToggle = false,
  layerColText = "Show Map",
  showTitle = true,
  showGoal = false,
  goalColText = "Goal",
  showArea = false,
  metricIdName = "areaOverlap",
  percMetricIdName = "areaOverlapPerc",
  unitLabel = "sq. meters",
  options,
}) => {
  // Use user-defined width, otherwise sane default depending on whether goal
  const colWidths = {
    classColWidth: options?.classColWidth
      ? options?.classColWidth
      : showGoal
      ? "30%"
      : "50%",
    percColWidth: options?.percColWidth
      ? options?.percColWidth
      : showGoal
      ? "30%"
      : "30%",
    showMapWidth: options?.showMapWidth
      ? options?.showMapWidth
      : showGoal
      ? "20%"
      : "20%",
    goalWidth: options?.goalWidth
      ? options?.goalWidth
      : showGoal
      ? "20%"
      : "50%",
    areaWidth: options?.areaWidth
      ? options?.areaWidth
      : showArea
      ? "10%"
      : "20%",
  };
  const classesByName = keyBy(
    dataGroup.classes,
    (curClass) => curClass.classId
  );

  const metricsByClassByMetric = nestMetrics(rows, ["classId", "metricId"]);
  const metricsByMetricByClass = nestMetrics(rows, ["metricId", "classId"]);

  // Use sketch ID for each table row, use index to lookup into nested metrics
  const tableRows = Object.keys(metricsByClassByMetric).map((classId) => ({
    classId,
  }));

  const columns: Column<{ classId: string }>[] = [
    {
      Header: titleText,
      accessor: (row) =>
        classesByName[row.classId || "missing"]?.display || "missing",
      style: { width: "18%" },
    },
    {
      Header: "Area (sq. km)",
      accessor: (row) => {
        const value =
          metricsByClassByMetric[row.classId][metricIdName][0].value;
        return Number.format(Math.round(value));
      },
      style: { width: "30%", textAlign: "right" },
    },
    {
      Header: "% Area",
      accessor: (row) => {
        const value =
          metricsByClassByMetric[row.classId][percMetricIdName][0].value;
        return percentWithEdge(value);
      },
      style: { width: "17%", textAlign: "right" },
    },
    {
      Header: valueColText,
      style: { textAlign: "center", width: "40%" },
      accessor: (row, rowIndex) => {
        const value =
          metricsByClassByMetric[row.classId][percMetricIdName][0].value;
        // const valueDisplay = formatPerc
        //   ? percentWithEdge(value)
        //   : value;
        // @ts-ignore: need to add objective to type
        const goal = dataGroup.objective
          ? formatPerc
            ? // @ts-ignore: need to add objective to type
              dataGroup.objective.target * 100
            : // @ts-ignore: need to add objective to type
              dataGroup.objective.target
          : 0;

        const chartAllConfig = {
          rows: [[[formatPerc ? value * 100 : value]]],
          rowConfigs: [
            {
              title: (value: number) => (
                <>
                  {goal && value >= goal ? (
                    <CheckCircleFill
                      size={14}
                      style={{ color: "#78c679", paddingRight: 5 }}
                    />
                  ) : (
                    <></>
                  )}
                  {percentWithEdge(value / 100)}
                </>
              ),
            },
          ],
          max: 100,
        };

        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <HorizontalStackedBar
                {...chartAllConfig}
                blockGroupNames={["foo"]}
                blockGroupStyles={[{ backgroundColor: "#ACD0DE" }]}
                showTitle={showTitle}
                showLegend={false}
                showTargetLabel={rowIndex === rows.length - 1 ? true : false}
                targetLabelPosition="bottom"
                showTotalLabel={false}
                barHeight={15}
                target={goal || undefined}
                targetValueFormatter={(value: number) =>
                  `Target - ${percentWithEdge(goal / 100)}`
                }
              />
            </div>
          </div>
        );
      },
    },
  ];

  // Optionally insert layer toggle column
  if (showLayerToggle) {
    columns.push({
      Header: layerColText,
      accessor: (row, index) => {
        const isSimpleGroup = dataGroup.layerId ? false : true;
        const layerId =
          dataGroup.layerId || classesByName[row.classId!].layerId;
        if (isSimpleGroup && layerId) {
          return (
            <LayerToggle
              simple
              layerId={layerId}
              style={{ marginTop: 0, marginLeft: 15 }}
            />
          );
        } else if (!isSimpleGroup && layerId && index === 0) {
          return (
            <LayerToggle
              simple
              layerId={layerId}
              style={{ marginTop: 0, marginLeft: 15 }}
            />
          );
        } else {
          return <></>;
        }
      },
      style: { width: colWidths.showMapWidth },
    });
  }

  // Optionally insert goal column
  if (showGoal) {
    columns.splice(columns.length - (showLayerToggle ? 1 : 0), 0, {
      Header: goalColText,
      style: { textAlign: "right", width: colWidths.goalWidth },
      accessor: (row) => {
        const goalValue = dataGroup.classes.find(
          (curClass) => curClass.classId === row.classId
        )?.goalValue;
        if (!goalValue)
          throw new Error(`Goal value not found for ${row.classId}`);
        return formatPerc ? percentWithEdge(goalValue) : goalValue;
      },
    });
  }

  return (
    <SmallReportTableStyled>
      <Table className="styled" columns={columns} data={tableRows} />
    </SmallReportTableStyled>
  );
};
