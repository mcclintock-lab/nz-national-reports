/**
 * @group smoke
 */
import { area } from "./area";
import {
  getExamplePolygonAllSketchAll,
  writeResultOutput,
} from "@seasketch/geoprocessing/scripts/testing";

describe("Basic smoke tests", () => {
  test("handler function is present", () => {
    expect(typeof area).toBe("function");
  });
  test("area - tests run against all examples", async () => {
    const examples = await getExamplePolygonAllSketchAll();
    for (const example of examples) {
      console.log(example.properties.name);
      const result = await area(example);
      expect(result).toBeTruthy();
      writeResultOutput(result, "area", example.properties.name);
    }
  });
});
