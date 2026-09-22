export function formatDistanceKm(distanceKm: unknown, suffix = " away"): string | null {
  const value = Number(distanceKm);
  if (!Number.isFinite(value) || value < 0) return null;
  if (value < 1) return `${Math.max(1, Math.round(value * 1000))} m${suffix}`;
  return `${value.toFixed(1)} km${suffix}`;
}

export function calculateDistanceKm(origin: { latitude: number; longitude: number } | null, item: any): number | null {
  const latitude = Number(item?.latitude);
  const longitude = Number(item?.longitude);
  if (!origin || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const radians = (value: number) => (value * Math.PI) / 180;
  const dLat = radians(latitude - origin.latitude);
  const dLng = radians(longitude - origin.longitude);
  const lat1 = radians(origin.latitude);
  const lat2 = radians(latitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
