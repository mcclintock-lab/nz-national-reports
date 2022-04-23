import React, { FunctionComponent } from "react";
import SizeCard from "./SizeCard";

interface ReportProps {
  hidden: boolean;
}

const Overview: FunctionComponent<ReportProps> = ({ hidden }) => {
  return (
    <div style={{ display: hidden ? "none" : "block" }}>
      <SizeCard />
    </div>
  );
};

export default Overview;
