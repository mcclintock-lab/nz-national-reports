import React, { useState } from "react";
import { SegmentControl } from "@seasketch/geoprocessing/client-ui";
import Habitat from "./HabitatPage";

const enableAllTabs = false;
const AllReports = () => {
  const [tab, setTab] = useState<string>("Habitat");
  return (
    <>
      <div style={{ marginTop: 5 }}>
        <SegmentControl
          value={tab}
          onClick={(segment) => setTab(segment)}
          segments={["Habitat"]}
        />
      </div>
      <Habitat hidden={!enableAllTabs && tab !== "Habitat"} />
    </>
  );
};

export default AllReports;
