import { describe, expect, it } from "vitest";
import { mapCodesToNames } from "./mapCodesToNames";

describe("mapCodesToNames", () => {
  it("мапит известные code на name", () => {
    const map = new Map([
      ["c1", "Категория 1"],
      ["c2", "Категория 2"],
    ]);
    expect(mapCodesToNames(["c1", "c2"], map)).toEqual([
      "Категория 1",
      "Категория 2",
    ]);
  });

  it("для неизвестного code возвращает [unknown:<code>]", () => {
    const map = new Map([["c1", "Категория 1"]]);
    expect(mapCodesToNames(["c1", "missing"], map)).toEqual([
      "Категория 1",
      "[unknown:missing]",
    ]);
  });
});
