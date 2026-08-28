import type { GpsPosition } from "./findNearestGpsPoint";

export type GeolocationResult =
  | { status: "success"; position: GpsPosition }
  | { status: "denied" }
  | { status: "error" };

export type GeolocationProvider = {
  getPosition(): Promise<GeolocationResult>;
};

const GEOLOCATION_RESPONSE_TIMEOUT_MS = 5 * 60 * 1000;

export function createBrowserGeolocationProvider(
  geolocation: Geolocation | null = typeof navigator !== "undefined"
    ? navigator.geolocation
    : null,
): GeolocationProvider {
  return {
    getPosition() {
      if (!geolocation) {
        return Promise.resolve({ status: "error" });
      }

      return new Promise((resolve) => {
        let settled = false;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const complete = (result: GeolocationResult) => {
          if (settled) return;

          settled = true;
          if (timeoutId !== undefined) clearTimeout(timeoutId);
          resolve(result);
        };

        timeoutId = setTimeout(() => {
          complete({ status: "error" });
        }, GEOLOCATION_RESPONSE_TIMEOUT_MS);

        try {
          geolocation.getCurrentPosition(
            (position) => {
              complete({
                status: "success",
                position: {
                  lat: position.coords.latitude,
                  lon: position.coords.longitude,
                },
              });
            },
            (error) => {
              complete({
                status: error.code === 1 ? "denied" : "error",
              });
            },
          );
        } catch {
          complete({ status: "error" });
        }
      });
    },
  };
}

export function createManualGeolocationProvider(
  position: GpsPosition,
): GeolocationProvider {
  return {
    getPosition: async () => ({ status: "success", position }),
  };
}
