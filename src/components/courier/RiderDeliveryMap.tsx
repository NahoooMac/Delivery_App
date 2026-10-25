import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Navigation, Locate, ExternalLink } from 'lucide-react';
import { GeoPoint } from '../../types/delivery';
import { fetchRoadRoute, RouteResult } from '../../services/routingService';

interface RiderDeliveryMapProps {
  currentStage: 'to_pickup' | 'to_dropoff';
  originCoords: GeoPoint;
  originName: string;
  destinationCoords: GeoPoint;
  destinationName: string;
  vehicleType: 'motorcycle' | 'bicycle';
}

const YANDEX_TILES_KEY =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_YANDEX_TILES_KEY || import.meta.env?.VITE_YANDEX_MAPS_KEY)) ||
  '';

const MAPBOX_TOKEN =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAPBOX_TOKEN) ||
  '';

export const RiderDeliveryMap: React.FC<RiderDeliveryMapProps> = ({
  currentStage,
  originCoords,
  originName,
  destinationCoords,
  destinationName,
  vehicleType,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);

  const [routeInfo, setRouteInfo] = useState<RouteResult | null>(null);
  const mapProvider = YANDEX_TILES_KEY ? 'yandex' : 'mapbox';

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [originCoords.lat, originCoords.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: true,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Determine tile provider URL
    let tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    let attribution = '© <a href="https://carto.com/">CARTO</a> © OpenStreetMap';

    if (mapProvider === 'yandex' && YANDEX_TILES_KEY) {
      tileUrl = `https://tiles.api-maps.yandex.ru/v1/tiles/?projection=wgs84_mercator&x={x}&y={y}&z={z}&l=map&apikey=${YANDEX_TILES_KEY}`;
      attribution = '© <a href="https://yandex.com/maps-api/startup" target="_blank">Yandex Maps API</a>';
    } else if (mapProvider === 'mapbox' && MAPBOX_TOKEN) {
      tileUrl = `https://api.mapbox.com/styles/v1/mapbox/navigation-day-v1/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`;
      attribution = '© <a href="https://mapbox.com/">Mapbox</a>';
    }

    const tileLayer = L.tileLayer(tileUrl, {
      attribution,
      tileSize: mapProvider === 'mapbox' ? 512 : 256,
      zoomOffset: mapProvider === 'mapbox' ? -1 : 0,
      maxZoom: 19,
    });

    tileLayer.addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapProvider, originCoords.lat, originCoords.lng]);

  // Update Route & Markers when endpoints change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers & route
    if (originMarkerRef.current) originMarkerRef.current.remove();
    if (destMarkerRef.current) destMarkerRef.current.remove();
    if (routeLayerRef.current) routeLayerRef.current.remove();

    // 1. Origin Marker (Rider / Courier or Pickup Point)
    const originIcon = L.divIcon({
      className: 'rider-map-icon',
      html: `
        <div style="background-color: ${currentStage === 'to_pickup' ? '#2563eb' : '#059669'}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.3); border: 2.5px solid white;">
          ${
            vehicleType === 'motorcycle'
              ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`
              : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5L9 9l4-3 2 3h3"/></svg>`
          }
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    originMarkerRef.current = L.marker([originCoords.lat, originCoords.lng], { icon: originIcon })
      .addTo(map)
      .bindPopup(`<b style="font-size:12px;">${originName}</b>`);

    // 2. Destination Marker (Pickup or Drop-off)
    const destIcon = L.divIcon({
      className: 'rider-dest-icon',
      html: `
        <div style="background-color: ${currentStage === 'to_pickup' ? '#059669' : '#000000'}; color: white; width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.35); border: 2.5px solid white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    });

    destMarkerRef.current = L.marker([destinationCoords.lat, destinationCoords.lng], { icon: destIcon })
      .addTo(map)
      .bindPopup(`<b style="font-size:12px;">${destinationName}</b>`);

    // 3. Compute road route
    fetchRoadRoute(originCoords, destinationCoords).then((route: RouteResult) => {
      setRouteInfo(route);

      if (mapInstanceRef.current && route.coordinates && route.coordinates.length > 0) {
        const polyline = L.polyline(route.coordinates, {
          color: currentStage === 'to_pickup' ? '#2563eb' : '#000000',
          weight: 5,
          opacity: 0.9,
          lineJoin: 'round',
          lineCap: 'round',
        }).addTo(mapInstanceRef.current);

        routeLayerRef.current = polyline;

        const bounds = polyline.getBounds();
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      }
    });
  }, [currentStage, originCoords, destinationCoords, originName, destinationName, vehicleType]);

  const handleRecenter = () => {
    if (mapInstanceRef.current && routeLayerRef.current) {
      mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds(), {
        padding: [40, 40],
        maxZoom: 16,
      });
    }
  };

  // External Navigation Links (Yandex Maps or Google Maps)
  const yandexNavUrl = `https://yandex.com/maps/?rtext=${originCoords.lat},${originCoords.lng}~${destinationCoords.lat},${destinationCoords.lng}&rtt=auto`;
  const googleNavUrl = `https://www.google.com/maps/dir/?api=1&origin=${originCoords.lat},${originCoords.lng}&destination=${destinationCoords.lat},${destinationCoords.lng}&travelmode=driving`;

  return (
    <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-neutral-300 shadow-inner bg-neutral-100">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Left Navigation Pill */}
      <div className="absolute top-2.5 left-2.5 z-[400] flex items-center gap-2 rounded-xl bg-white/95 px-2.5 py-1.5 shadow-md border border-neutral-200 text-xs font-bold text-neutral-900 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              currentStage === 'to_pickup' ? 'bg-blue-600' : 'bg-black'
            }`}
          />
          <span className="truncate max-w-[140px] sm:max-w-[200px]">
            {currentStage === 'to_pickup' ? `To: ${destinationName}` : `Drop-off: ${destinationName}`}
          </span>
        </div>
        {routeInfo && (
          <>
            <span className="text-neutral-300">•</span>
            <span className="text-neutral-700 font-mono">{routeInfo.distanceKm.toFixed(1)} km</span>
            <span className="text-neutral-300">•</span>
            <span className="text-neutral-700">~{routeInfo.durationMinutes} min</span>
          </>
        )}
      </div>

      {/* Yandex Maps Startup API Integration Badge */}
      <div className="absolute top-2.5 right-2.5 z-[400] hidden sm:flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-neutral-700 shadow-sm border border-neutral-200 backdrop-blur-sm">
        <a
          href="https://yandex.com/maps-api/startup"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-black hover:underline"
          title="Powered by Yandex Maps API Startup Program"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
          <span>Yandex Maps API</span>
          <ExternalLink className="h-2.5 w-2.5 text-neutral-400" />
        </a>
      </div>

      {/* Bottom Floating Navigation Actions */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-[400] flex items-center justify-between pointer-events-none">
        {/* External Turn-by-Turn GPS links */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <a
            href={yandexNavUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg bg-neutral-900/90 text-white px-2.5 py-1.5 text-[10px] font-bold shadow hover:bg-black transition-all"
            title="Open Turn-by-Turn navigation in Yandex Maps"
          >
            <Navigation className="h-3 w-3 text-red-500" />
            <span>Yandex Nav</span>
          </a>
          <a
            href={googleNavUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg bg-white/95 text-neutral-800 px-2.5 py-1.5 text-[10px] font-bold shadow border border-neutral-200 hover:bg-neutral-50 transition-all"
            title="Open Turn-by-Turn navigation in Google Maps"
          >
            <ExternalLink className="h-3 w-3 text-neutral-500" />
            <span>Google Nav</span>
          </a>
        </div>

        {/* Recenter Button */}
        <button
          type="button"
          onClick={handleRecenter}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black shadow-md border border-neutral-200 hover:bg-neutral-50 pointer-events-auto transition-all"
          title="Recenter Route"
        >
          <Locate className="h-4 w-4 text-neutral-800" />
        </button>
      </div>
    </div>
  );
};
