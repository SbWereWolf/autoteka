import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createBrowserGeolocationProvider,
  createManualGeolocationProvider,
} from "./userGeolocation";

describe("userGeolocation", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("ручной provider возвращает заданные координаты", async () => {
    const provider = createManualGeolocationProvider({
      lat: 55.7558,
      lon: 37.6173,
    });

    await expect(provider.getPosition()).resolves.toEqual({
      status: "success",
      position: { lat: 55.7558, lon: 37.6173 },
    });
  });

  it("browser provider возвращает координаты Geolocation API", async () => {
    const geolocation = {
      getCurrentPosition(success: PositionCallback) {
        success({
          coords: {
            latitude: 59.9386,
            longitude: 30.3141,
          },
        } as GeolocationPosition);
      },
    } as Geolocation;

    const provider = createBrowserGeolocationProvider(geolocation);

    await expect(provider.getPosition()).resolves.toEqual({
      status: "success",
      position: { lat: 59.9386, lon: 30.3141 },
    });
  });

  it("отличает отказ пользователя в геолокации", async () => {
    const geolocation = {
      getCurrentPosition(
        _success: PositionCallback,
        error: PositionErrorCallback,
      ) {
        error({ code: 1 } as GeolocationPositionError);
      },
    } as Geolocation;

    const provider = createBrowserGeolocationProvider(geolocation);

    await expect(provider.getPosition()).resolves.toEqual({
      status: "denied",
    });
  });

  it("возвращает error для прочих ошибок геолокации", async () => {
    const geolocation = {
      getCurrentPosition(
        _success: PositionCallback,
        error: PositionErrorCallback,
      ) {
        error({ code: 2 } as GeolocationPositionError);
      },
    } as Geolocation;

    const provider = createBrowserGeolocationProvider(geolocation);

    await expect(provider.getPosition()).resolves.toEqual({
      status: "error",
    });
  });

  it("возвращает error, если Geolocation API недоступен", async () => {
    const provider = createBrowserGeolocationProvider(null);

    await expect(provider.getPosition()).resolves.toEqual({
      status: "error",
    });
  });

  it("возвращает error, если браузер не ответил за пять минут", async () => {
    vi.useFakeTimers();

    const geolocation = {
      getCurrentPosition() {},
    } as unknown as Geolocation;

    const provider = createBrowserGeolocationProvider(geolocation);
    const result = provider.getPosition();

    let settled = false;
    void result.finally(() => {
      settled = true;
    });

    await vi.advanceTimersByTimeAsync(299_999);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toEqual({ status: "error" });
  });

  it("очищает пятиминутный таймер после штатного success или error callback", async () => {
    vi.useFakeTimers();

    let successCallback: PositionCallback | undefined;
    let errorCallback: PositionErrorCallback | undefined;

    const geolocation = {
      getCurrentPosition(
        success: PositionCallback,
        error: PositionErrorCallback,
      ) {
        successCallback = success;
        errorCallback = error;
      },
    } as Geolocation;

    const successResult =
      createBrowserGeolocationProvider(geolocation).getPosition();

    expect(vi.getTimerCount()).toBe(1);
    successCallback?.({
      coords: {
        latitude: 59.9386,
        longitude: 30.3141,
      },
    } as GeolocationPosition);

    await expect(successResult).resolves.toEqual({
      status: "success",
      position: { lat: 59.9386, lon: 30.3141 },
    });
    expect(vi.getTimerCount()).toBe(0);

    const errorResult =
      createBrowserGeolocationProvider(geolocation).getPosition();

    expect(vi.getTimerCount()).toBe(1);
    errorCallback?.({ code: 2 } as GeolocationPositionError);

    await expect(errorResult).resolves.toEqual({ status: "error" });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("игнорирует callback, пришедший после завершения по тайм-ауту", async () => {
    vi.useFakeTimers();

    let successCallback: PositionCallback | undefined;

    const geolocation = {
      getCurrentPosition(success: PositionCallback) {
        successCallback = success;
      },
    } as Geolocation;

    const provider = createBrowserGeolocationProvider(geolocation);
    const result = provider.getPosition();
    const observer = vi.fn();
    void result.then(observer);

    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    await expect(result).resolves.toEqual({ status: "error" });
    expect(observer).toHaveBeenCalledTimes(1);
    expect(observer).toHaveBeenLastCalledWith({ status: "error" });

    successCallback?.({
      coords: {
        latitude: 59.9386,
        longitude: 30.3141,
      },
    } as GeolocationPosition);
    await Promise.resolve();

    expect(observer).toHaveBeenCalledTimes(1);
    await expect(result).resolves.toEqual({ status: "error" });
  });
});
