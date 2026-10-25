import { GeoPoint, calculateHaversineDistance } from '../data/addisLocations';

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  coordinates: [number, number][]; // [lat, lng]
  isRealRoad: boolean;
  source: 'osrm_road' | 'fallback_estimate';
}

// In-memory cache to avoid hitting public OSRM unnecessarily
const routeCache = new Map<string, RouteResult>();

export async function fetchRoadRoute(
  start: GeoPoint,
  end: GeoPoint,
  externalSignal?: AbortSignal
): Promise<RouteResult> {
  const cacheKey = `${start.lat.toFixed(4)},${start.lng.toFixed(4)}_${end.lat.toFixed(4)},${end.lng.toFixed(4)}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  // Abort controller with 3.5s timeout for fast UI responsiveness
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: controller.signal });

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const durationMinutes = Math.max(8, Math.round(route.duration / 60));
        
        // GeoJSON coordinates are [lng, lat], convert to Leaflet [lat, lng]
        const coordinates: [number, number][] = route.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );

        const result: RouteResult = {
          distanceKm,
          durationMinutes,
          coordinates,
          isRealRoad: true,
          source: 'osrm_road',
        };

        // Cache real road results only
        routeCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err: unknown) {
    if (externalSignal?.aborted) {
      throw err;
    }
    // Graceful fallback if OSRM is offline, slow, or blocked
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }

  // Fallback: Haversine distance with 1.25 road curvature factor
  // Strictly identified as an approximate fallback estimate
  const straightDist = calculateHaversineDistance(start, end);
  const estRoadKm = Math.max(1.5, Math.round(straightDist * 1.25 * 10) / 10);
  const estMinutes = Math.max(10, Math.round(estRoadKm * 3.2));

  // Generate intermediate waypoint coordinates for a smooth curve
  const steps = 10;
  const coordinates: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const lat = start.lat + (end.lat - start.lat) * ratio;
    const lng = start.lng + (end.lng - start.lng) * ratio;
    coordinates.push([lat, lng]);
  }

  const fallbackResult: RouteResult = {
    distanceKm: estRoadKm,
    durationMinutes: estMinutes,
    coordinates,
    isRealRoad: false,
    source: 'fallback_estimate',
  };

  // Do NOT cache fallback estimates so future retries can obtain a real OSRM road route
  return fallbackResult;
}
