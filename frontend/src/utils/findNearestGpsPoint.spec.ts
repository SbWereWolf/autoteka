import { describe, expect, it } from "vitest";
import { findNearestGpsPoint } from "./findNearestGpsPoint";

describe("findNearestGpsPoint", () => {
  it("возвращает code ближайшей точки и расстояние", () => {
    const result = findNearestGpsPoint(
      [
        { code: "moscow", lat: 55.752, lon: 37.617 },
        { code: "spb", lat: 59.939, lon: 30.315 },
      ],
      { lat: 59.94, lon: 30.32 },
    );

    expect(result.code).toBe("spb");
    expect(result.distanceKm).toBeLessThan(1);
  });

  it("возвращает пустой результат для пустого списка", () => {
    expect(findNearestGpsPoint([], { lat: 55.75, lon: 37.61 })).toEqual(
      {
        code: "",
        distanceKm: 0,
      },
    );
  });

  it("возвращает пустой результат для некорректных искомых координат", () => {
    expect(
      findNearestGpsPoint(
        [{ code: "moscow", lat: 55.752, lon: 37.617 }],
        { lat: 91, lon: 37.61 },
      ),
    ).toEqual({ code: "", distanceKm: 0 });
  });

  it("пропускает точки без координат", () => {
    const result = findNearestGpsPoint(
      [
        { code: "invalid", lat: null, lon: 30.315 },
        { code: "spb", lat: 59.939, lon: 30.315 },
      ],
      { lat: 59.94, lon: 30.32 },
    );

    expect(result.code).toBe("spb");
  });

  it("пропускает точки с некорректными координатами", () => {
    const result = findNearestGpsPoint(
      [
        { code: "invalid", lat: 91, lon: 30.315 },
        { code: "moscow", lat: 55.752, lon: 37.617 },
      ],
      { lat: 55.75, lon: 37.61 },
    );

    expect(result.code).toBe("moscow");
  });

  it("возвращает пустой результат, если пригодных точек нет", () => {
    expect(
      findNearestGpsPoint(
        [
          { code: "a", lat: null, lon: 30.315 },
          { code: "b", lat: 91, lon: 37.617 },
        ],
        { lat: 55.75, lon: 37.61 },
      ),
    ).toEqual({ code: "", distanceKm: 0 });
  });

  it("при одинаковом расстоянии выбирает меньший code", () => {
    const result = findNearestGpsPoint(
      [
        { code: "z", lat: 55.75, lon: 37.61 },
        { code: "a", lat: 55.75, lon: 37.61 },
      ],
      { lat: 55.75, lon: 37.61 },
    );

    expect(result.code).toBe("a");
    expect(result.distanceKm).toBe(0);
  });

  it("считает расстояния в пределах epsilon равными и выбирает меньший code", () => {
    const result = findNearestGpsPoint(
      [
        { code: "a", lat: 4e-15, lon: 0 },
        { code: "z", lat: 0, lon: 0 },
      ],
      { lat: 0, lon: 0 },
    );

    expect(result.code).toBe("a");
    expect(result.distanceKm).toBeGreaterThan(0);
  });
});
