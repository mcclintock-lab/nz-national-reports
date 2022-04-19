/**
 * @group smoke
 * @jest-environment node
 */
import Handler from "./sccHabitat";
import {
  getExamplePolygonAllSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof Handler.func).toBe("function");
  });
  test("sccHabitatSmoke - tests run against all examples", async () => {
    const examples = await getExamplePolygonAllSketchAll();
    for (const example of examples) {
      console.log(example.properties.name);
      const result = await Handler.func(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "sccHabitat", example.properties.name);
    }
  }, 40000);
});
