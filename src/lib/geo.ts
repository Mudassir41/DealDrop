/**
 * Haversine distance between two lat/lng points in meters
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Filter items within a radius of a center point
 */
export function filterNearby<T extends { latitude: number; longitude: number }>(
  items: T[],
  centerLat: number,
  centerLng: number,
  radiusMeters: number
): (T & { distance: number })[] {
  return items
    .map((item) => ({
      ...item,
      distance: Math.round(haversineDistance(centerLat, centerLng, item.latitude, item.longitude)),
    }))
    .filter((item) => item.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance);
}
