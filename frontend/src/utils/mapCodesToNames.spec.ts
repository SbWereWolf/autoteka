import { describe, expect, it } from "vitest";
import { mapIdsToTitles } from "./mapCodesToNames";

describe("mapIdsToTitles", () => {
  it("мапит известные id на title", () => {
    const map = new Map([
      ["c1", "Категория 1"],
      ["c2", "Категория 2"],
    ]);
    expect(mapIdsToTitles(["c1", "c2"], map)).toEqual([
      "Категория 1",
      "Категория 2",
    ]);
  });

  it("для неизвестного id возвращает [unknown:<id>]", () => {
    const map = new Map([["c1", "Категория 1"]]);
    expect(mapIdsToTitles(["c1", "missing"], map)).toEqual([
      "Категория 1",
      "[unknown:missing]",
    ]);
  });
});
