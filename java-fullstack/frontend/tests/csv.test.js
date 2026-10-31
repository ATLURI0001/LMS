import test from "node:test";
import assert from "node:assert/strict";
import { csvCell, toCsv } from "../src/lib/csv.js";

test("CSV quotes commas, quotes, newlines, nulls and numbers", () => {
  assert.equal(
    toCsv([
      ["Name", "Value"],
      ['a,b"c', 7],
      [null, "line\nbreak"],
    ]),
    '"Name","Value"\r\n"a,b""c","7"\r\n"","line\nbreak"',
  );
});
test("CSV neutralizes direct and whitespace-hidden spreadsheet formulas", () => {
  for (const value of [
    "=1+1",
    "+SUM(A1)",
    "-1+2",
    "@SUM(A1)",
    "  =1+1",
    "\t=1+1",
    "\rtest",
    "\n=1+1",
    "\u0000  +1",
    "\u00a0=1",
  ]) {
    assert.ok(csvCell(value).startsWith("\"'"), JSON.stringify(value));
  }
  assert.equal(csvCell("Design - build"), '"Design - build"');
});
