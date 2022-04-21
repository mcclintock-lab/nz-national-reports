/**
 * @group smoke
 * @jest-environment node
 */
import Handler from "./sccHabitatRaster";
import {
  getExamplePolygonAllSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof Handler.func).toBe("function");
  });
  test("sccHabitatRasterSmoke - tests run against all examples", async () => {
    const examples = await getExamplePolygonAllSketchAll();
    for (const example of examples) {
      const result = await Handler.func(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "sccHabitatRaster", example.properties.name);
    }
  }, 40000);
});
