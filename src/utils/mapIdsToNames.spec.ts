import { describe, expect, it } from "vitest";
import { mapIdsToNames } from "./mapIdsToNames";

describe("mapIdsToNames", () => {
  it("мапит известные ID на name", () => {
    const map = new Map([
      ["c1", "Категория 1"],
      ["c2", "Категория 2"],
    ]);
    expect(mapIdsToNames(["c1", "c2"], map)).toEqual([
      "Категория 1",
      "Категория 2",
    ]);
  });

  it("для неизвестного ID возвращает [unknown:<id>]", () => {
    const map = new Map([["c1", "Категория 1"]]);
    expect(mapIdsToNames(["c1", "missing"], map)).toEqual([
      "Категория 1",
      "[unknown:missing]",
    ]);
  });
});
