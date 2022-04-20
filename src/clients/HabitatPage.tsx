import React, { FunctionComponent } from "react";
import { ReportPageProps } from "../types/ReportPage";
import HabitatSection from "./HabitatSection";

const ReportPage: FunctionComponent<ReportPageProps> = ({ hidden }) => {
  return (
    <div style={{ display: hidden ? "none" : "block" }}>
      <HabitatSection />
    </div>
  );
};

export default ReportPage;
