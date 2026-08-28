import { beforeEach, describe, expect, it, vi } from "vitest";
import { initState, state } from "./state";
import type { GeolocationProvider } from "./utils/userGeolocation";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const cities = [
  {
    code: "moscow",
    title: "Москва",
    sort: 10,
    latitude: "55.752",
    longitude: "37.617",
  },
  {
    code: "spb",
    title: "Санкт-Петербург",
    sort: 20,
    latitude: "59.939",
    longitude: "30.315",
  },
];

const commonState = {
  cities,
  categories: [],
  features: [],
};

function provider(): GeolocationProvider & {
  getPosition: ReturnType<typeof vi.fn>;
} {
  return {
    getPosition: vi.fn(async () => ({ status: "denied" as const })),
  };
}

describe("инициализация города", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", new MemoryStorage());
    state.cityCode = "";
    state.cities = [];
    state.citySelectionError = false;
  });

  it("использует валидный город из localStorage без запроса геолокации", async () => {
    localStorage.setItem("autoteka_city", JSON.stringify("spb"));
    const geolocationProvider = provider();

    await initState(commonState, geolocationProvider);

    expect(state.cityCode).toBe("spb");
    expect(geolocationProvider.getPosition).not.toHaveBeenCalled();
  });

  it("запрашивает геолокацию, если сохранённого города нет", async () => {
    const geolocationProvider = provider();

    await initState(commonState, geolocationProvider);

    expect(geolocationProvider.getPosition).toHaveBeenCalledTimes(1);
    expect(state.cityCode).toBe("moscow");
    expect(localStorage.getItem("autoteka_city")).toBe(
      JSON.stringify("moscow"),
    );
  });

  it("использует первый город исходного ответа сервера как fallback", async () => {
    const geolocationProvider = provider();

    await initState(
      {
        ...commonState,
        cities: [cities[1], cities[0]],
      },
      geolocationProvider,
    );

    expect(state.cities.map((city) => city.code)).toEqual([
      "moscow",
      "spb",
    ]);
    expect(state.cityCode).toBe("spb");
    expect(localStorage.getItem("autoteka_city")).toBe(
      JSON.stringify("spb"),
    );
  });

  it("запрашивает геолокацию, если сохранённого города больше нет в списке", async () => {
    localStorage.setItem("autoteka_city", JSON.stringify("removed"));
    const geolocationProvider = provider();

    await initState(commonState, geolocationProvider);

    expect(geolocationProvider.getPosition).toHaveBeenCalledTimes(1);
    expect(state.cityCode).toBe("moscow");
  });
  it("по успешной геолокации выбирает ближайший город и сохраняет его", async () => {
    const geolocationProvider: GeolocationProvider = {
      getPosition: vi.fn(async () => ({
        status: "success" as const,
        position: { lat: 59.94, lon: 30.32 },
      })),
    };

    await initState(commonState, geolocationProvider);

    expect(state.cityCode).toBe("spb");
    expect(localStorage.getItem("autoteka_city")).toBe(
      JSON.stringify("spb"),
    );
  });

  it("устанавливает runtime-флаг, если город определить не удалось", async () => {
    const geolocationProvider = provider();

    await expect(
      initState(
        {
          ...commonState,
          cities: [],
        },
        geolocationProvider,
      ),
    ).resolves.toBeUndefined();

    expect(state.citySelectionError).toBe(true);
    expect(state.cityCode).toBe("");
    expect(state.cities).toEqual([]);
    expect(localStorage.getItem("autoteka_city")).toBeNull();
    expect(geolocationProvider.getPosition).not.toHaveBeenCalled();
  });

  it("сбрасывает runtime-флаг при следующей успешной инициализации", async () => {
    state.citySelectionError = true;
    const geolocationProvider = provider();

    await initState(commonState, geolocationProvider);

    expect(state.citySelectionError).toBe(false);
    expect(state.cityCode).toBe("moscow");
  });

  it("если ближайший город не определён, использует первый город списка", async () => {
    const geolocationProvider: GeolocationProvider = {
      getPosition: vi.fn(async () => ({
        status: "success" as const,
        position: { lat: 55.75, lon: 37.62 },
      })),
    };

    await initState(
      {
        ...commonState,
        cities: cities.map((city) => ({
          ...city,
          latitude: null,
          longitude: null,
        })),
      },
      geolocationProvider,
    );

    expect(state.cityCode).toBe("moscow");
    expect(localStorage.getItem("autoteka_city")).toBe(
      JSON.stringify("moscow"),
    );
  });
});
