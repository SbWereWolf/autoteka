import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { apiClient } from "./api/HttpApiClient";
import { bootstrapAppState } from "./bootstrap";
import { state } from "./state";

const cities = [
  {
    code: "moscow",
    title: "Москва",
    sort: 10,
    latitude: "55.752",
    longitude: "37.617",
  },
];

describe("bootstrap city selection error flag", () => {
  beforeEach(() => {
    state.citySelectionError = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("оставляет флаг установленным, если список городов загрузить не удалось", async () => {
    vi.spyOn(apiClient, "getCityList").mockRejectedValue(
      new Error("city list failed"),
    );
    vi.spyOn(apiClient, "getCategoryList").mockResolvedValue([]);
    vi.spyOn(apiClient, "getFeatureList").mockResolvedValue([]);

    await expect(bootstrapAppState()).rejects.toThrow(
      "city list failed",
    );

    expect(state.citySelectionError).toBe(true);
  });

  it("не устанавливает ошибку выбора города при ошибке списка категорий", async () => {
    vi.spyOn(apiClient, "getCityList").mockResolvedValue(cities);
    vi.spyOn(apiClient, "getCategoryList").mockRejectedValue(
      new Error("category list failed"),
    );
    vi.spyOn(apiClient, "getFeatureList").mockResolvedValue([]);

    await expect(bootstrapAppState()).rejects.toThrow(
      "category list failed",
    );

    expect(state.citySelectionError).toBe(false);
  });

  it("не устанавливает ошибку выбора города при ошибке списка особенностей", async () => {
    vi.spyOn(apiClient, "getCityList").mockResolvedValue(cities);
    vi.spyOn(apiClient, "getCategoryList").mockResolvedValue([]);
    vi.spyOn(apiClient, "getFeatureList").mockRejectedValue(
      new Error("feature list failed"),
    );

    await expect(bootstrapAppState()).rejects.toThrow(
      "feature list failed",
    );

    expect(state.citySelectionError).toBe(false);
  });
});
