import React from "react";
import { HorizontalStackedBar, RowConfig } from "./HorizontalStackedBar";
import { ReportDecorator, Card } from "@seasketch/geoprocessing/client-ui";

export default {
  component: HorizontalStackedBar,
  title: "Components/HorizontalStackedBar",
  decorators: [ReportDecorator],
};

const rows1 = [
  [
    [2, 10],
    [5, 13, 4],
  ],
];

const rows2 = [[[12]]];

const rowConfigs1: RowConfig[] = [
  {
    title: "30% of EEZ",
  },
];
const rowConfigs2: RowConfig[] = [
  {
    title: "15% of EEZ as no-take",
  },
];

const blockGroupNames = ["Fully Protected Area", "Highly Protected Area"];
const blockGroupStyles = [
  { backgroundColor: "#64c2a6" },
  { backgroundColor: "#aadea7" },
  { backgroundColor: "gray" },
];

export const simple = () => (
  <Card title="Card Title">
    <HorizontalStackedBar
      rows={rows1}
      max={100}
      target={30}
      rowConfigs={rowConfigs1}
      blockGroupNames={blockGroupNames}
      blockGroupStyles={blockGroupStyles}
    />
    <HorizontalStackedBar
      rows={rows2}
      max={100}
      target={15}
      rowConfigs={rowConfigs2}
      blockGroupNames={blockGroupNames}
      blockGroupStyles={blockGroupStyles}
    />
  </Card>
);
