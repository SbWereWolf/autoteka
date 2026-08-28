export type GpsPoint = {
  code: string;
  lat: number | null | undefined;
  lon: number | null | undefined;
};

export type GpsPosition = {
  lat: number;
  lon: number;
};

export type NearestGpsResult = {
  code: string;
  distanceKm: number;
};

const EARTH_RADIUS_KM = 6371.0088;
const SAME_DISTANCE_EPSILON_KM = 1e-12;

const EMPTY_RESULT: NearestGpsResult = {
  code: "",
  distanceKm: 0,
};

function hasValidCoordinates<T>(value: T): value is T & GpsPosition {
  if (!value || typeof value !== "object") return false;

  const { lat, lon } = value as {
    lat?: unknown;
    lon?: unknown;
  };

  return (
    typeof lat === "number" &&
    typeof lon === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

function distanceKm(a: GpsPosition, b: GpsPosition): number {
  const toRadians = Math.PI / 180;
  const lat1 = a.lat * toRadians;
  const lat2 = b.lat * toRadians;
  const deltaLat = (b.lat - a.lat) * toRadians;
  const deltaLon = (b.lon - a.lon) * toRadians;

  const sinLat = Math.sin(deltaLat / 2);
  const sinLon = Math.sin(deltaLon / 2);
  const haversine =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;

  return (
    2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(Math.min(1, haversine)))
  );
}

export function findNearestGpsPoint(
  points: readonly GpsPoint[],
  position: GpsPosition,
): NearestGpsResult {
  let result = EMPTY_RESULT;

  if (
    !Array.isArray(points) ||
    points.length === 0 ||
    !hasValidCoordinates(position)
  ) {
    return result;
  }

  let nearestDistanceKm = Number.POSITIVE_INFINITY;

  for (const point of points) {
    if (!hasValidCoordinates(point) || typeof point.code !== "string") {
      continue;
    }

    const currentDistanceKm = distanceKm(position, point);
    const sameDistance =
      Math.abs(currentDistanceKm - nearestDistanceKm) <=
      SAME_DISTANCE_EPSILON_KM;

    const isClearlyCloser =
      currentDistanceKm < nearestDistanceKm - SAME_DISTANCE_EPSILON_KM;

    if (isClearlyCloser || (sameDistance && point.code < result.code)) {
      nearestDistanceKm = currentDistanceKm;
      result = {
        code: point.code,
        distanceKm: currentDistanceKm,
      };
    }
  }

  return result;
}
