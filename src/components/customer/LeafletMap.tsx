import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Locate, Loader2, Navigation, Info } from 'lucide-react';
import { SubCity, GeoPoint } from '../../types/delivery';
import { findNearestLandmark } from '../../data/addisLocations';
import { RouteResult } from '../../services/routingService';

interface LeafletMapProps {
  pickupCoords: GeoPoint;
  pickupSubcity: SubCity;
  pickupLandmark: string;
  onSelectPickup: (subcity: SubCity, landmark: string, coords: GeoPoint) => void;
  dropoffCoords: GeoPoint;
  dropoffSubcity: SubCity;
  dropoffLandmark: string;
  onSelectDropoff: (subcity: SubCity, landmark: string, coords: GeoPoint) => void;
  vehicleType: 'motorcycle' | 'bicycle';
  currentRoute: RouteResult | null;
  isLoadingRoute: boolean;
  userLocation?: GeoPoint | null;
  onRequestLocation?: () => void;
  isLocating?: boolean;
}

const MAPBOX_TOKEN =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAPBOX_TOKEN) ||
  (typeof window !== 'undefined' && (window as unknown as { __MAPBOX_TOKEN__?: string }).__MAPBOX_TOKEN__) ||
  '';

export const LeafletMap: React.FC<LeafletMapProps> = ({
  pickupCoords,
  pickupSubcity,
  pickupLandmark,
  onSelectPickup,
  dropoffCoords,
  dropoffSubcity,
  dropoffLandmark,
  onSelectDropoff,
  vehicleType,
  currentRoute,
  isLoadingRoute,
  userLocation,
  onRequestLocation,
  isLocating = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const routeCasingRef = useRef<L.Polyline | null>(null);
  const routeCoreRef = useRef<L.Polyline | null>(null);
  const mockRidersRef = useRef<L.Marker[]>([]);

  const [pinMode, setPinMode] = useState<'pickup' | 'dropoff'>('dropoff');
  const [clickNotice, setClickNotice] = useState<string | null>(null);

  // Keep references to latest callbacks and state to avoid stale closures in Leaflet events
  const onSelectPickupRef = useRef(onSelectPickup);
  const onSelectDropoffRef = useRef(onSelectDropoff);
  const pinModeRef = useRef(pinMode);

  useEffect(() => {
    onSelectPickupRef.current = onSelectPickup;
    onSelectDropoffRef.current = onSelectDropoff;
    pinModeRef.current = pinMode;
  }, [onSelectPickup, onSelectDropoff, pinMode]);

  // 1. Initialize Full-Screen Map with Mapbox Navigation Day Tiles
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center of Addis Ababa (Bole / Meskel Square corridor)
    const addisCenter: L.LatLngExpression = [9.0108, 38.7613];

    const map = L.map(mapContainerRef.current, {
      center: addisCenter,
      zoom: 14,
      minZoom: 10,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: true,
    });

    // Add clean zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Mapbox Navigation Day Retina Tiles (Clean street geography matching Yango/Uber)
    const tileUrl = MAPBOX_TOKEN
      ? `https://api.mapbox.com/styles/v1/mapbox/navigation-day-v1/tiles/512/{z}/{x}/{y}@2x?access_token=${MAPBOX_TOKEN}`
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      attribution: MAPBOX_TOKEN
        ? '© <a href="https://www.mapbox.com/about/maps/" target="_blank">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
        : '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
      tileSize: MAPBOX_TOKEN ? 512 : 256,
      zoomOffset: MAPBOX_TOKEN ? -1 : 0,
      maxZoom: 19,
    });

    tileLayer.addTo(map);

    // Map click handler: preserves exact coordinates while looking up nearest landmark
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const nearest = findNearestLandmark(lat, lng);

      if (pinModeRef.current === 'pickup') {
        onSelectPickupRef.current(nearest.subcity, nearest.landmark, { lat, lng });
        setClickNotice(`Pickup pinned: ${nearest.landmark}`);
      } else {
        onSelectDropoffRef.current(nearest.subcity, nearest.landmark, { lat, lng });
        setClickNotice(`Destination pinned: ${nearest.landmark}`);
      }

      setTimeout(() => setClickNotice(null), 3500);
    });

    // ResizeObserver ensures full viewport canvas on mobile orientation or window resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    mapInstanceRef.current = map;

    return () => {
      resizeObserver.disconnect();
      if (routeCasingRef.current) {
        routeCasingRef.current.remove();
        routeCasingRef.current = null;
      }
      if (routeCoreRef.current) {
        routeCoreRef.current.remove();
        routeCoreRef.current = null;
      }
      if (pickupMarkerRef.current) {
        pickupMarkerRef.current.remove();
        pickupMarkerRef.current = null;
      }
      if (dropoffMarkerRef.current) {
        dropoffMarkerRef.current.remove();
        dropoffMarkerRef.current = null;
      }
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }
      mockRidersRef.current.forEach((m) => m.remove());
      mockRidersRef.current = [];
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Real User Location Marker (Pulsing Blue GPS Dot)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!userLocation) {
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }
      return;
    }

    const gpsIcon = L.divIcon({
      className: 'user-gps-marker',
      html: `
        <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: rgba(59, 130, 246, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 14px; height: 14px; border-radius: 50%; background: #2563eb; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    if (!userLocationMarkerRef.current) {
      const marker = L.marker([userLocation.lat, userLocation.lng], {
        icon: gpsIcon,
        zIndexOffset: 100,
      }).addTo(map);

      marker.bindPopup(
        `<div style="font-size: 11px; font-weight: bold; color: #111827; padding: 2px;">
          📍 Your Real GPS Location<br/>
          <span style="font-size: 10px; color: #6b7280; font-weight: normal;">Lat: ${userLocation.lat.toFixed(5)}, Lng: ${userLocation.lng.toFixed(5)}</span>
        </div>`
      );

      userLocationMarkerRef.current = marker;
    } else {
      userLocationMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  // 3. Dynamic ETA for drop-off marker
  const estMinutes = currentRoute
    ? vehicleType === 'motorcycle'
      ? Math.max(3, Math.round(currentRoute.durationMinutes * 0.9))
      : Math.max(5, Math.round(currentRoute.distanceKm * 4.5 + 8))
    : 12;

  // 4. Draggable Pickup and Drop-off Markers with Exact Coordinates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const shortPickup = (pickupLandmark || pickupSubcity).split(',')[0].trim();
    const shortDropoff = (dropoffLandmark || dropoffSubcity).split(',')[0].trim();

    // Pickup Icon (Yango / Uber Green Square Pin)
    const pickupIcon = L.divIcon({
      className: 'uber-map-pin',
      html: `
        <div class="uber-marker-container">
          <div class="uber-pill" style="border-left: 3px solid #10b981;">
            <span class="uber-pill-square" style="background-color: #10b981;"></span>
            <span class="uber-pill-text">${shortPickup}</span>
            <span class="uber-pill-chevron">›</span>
          </div>
          <div class="uber-pill-stem" style="background-color: #10b981;"></div>
          <div class="uber-pill-base-dot" style="background-color: #10b981;"></div>
        </div>
      `,
      iconSize: [150, 42],
      iconAnchor: [75, 42],
      popupAnchor: [0, -42],
    });

    // Dropoff Icon (Black/Gold ETA Pin)
    const dropoffIcon = L.divIcon({
      className: 'uber-map-pin',
      html: `
        <div class="uber-marker-container">
          <div class="uber-pill" style="border-left: 3px solid #000000;">
            <span class="uber-pill-eta">${estMinutes}<br/><span style="font-size:7px;font-weight:700;">MIN</span></span>
            <span class="uber-pill-text">${shortDropoff}</span>
            <span class="uber-pill-chevron">›</span>
          </div>
          <div class="uber-pill-stem"></div>
          <div class="uber-pill-base-dot"></div>
        </div>
      `,
      iconSize: [160, 42],
      iconAnchor: [80, 42],
      popupAnchor: [0, -42],
    });

    // Update / Create Pickup Marker
    if (!pickupMarkerRef.current) {
      const marker = L.marker([pickupCoords.lat, pickupCoords.lng], {
        icon: pickupIcon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        const nearest = findNearestLandmark(pos.lat, pos.lng);
        onSelectPickupRef.current(nearest.subcity, nearest.landmark, { lat: pos.lat, lng: pos.lng });
      });

      pickupMarkerRef.current = marker;
    } else {
      pickupMarkerRef.current.setIcon(pickupIcon);
      const currentPos = pickupMarkerRef.current.getLatLng();
      if (currentPos.lat !== pickupCoords.lat || currentPos.lng !== pickupCoords.lng) {
        pickupMarkerRef.current.setLatLng([pickupCoords.lat, pickupCoords.lng]);
      }
    }

    // Update / Create Dropoff Marker
    if (!dropoffMarkerRef.current) {
      const marker = L.marker([dropoffCoords.lat, dropoffCoords.lng], {
        icon: dropoffIcon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        const nearest = findNearestLandmark(pos.lat, pos.lng);
        onSelectDropoffRef.current(nearest.subcity, nearest.landmark, { lat: pos.lat, lng: pos.lng });
      });

      dropoffMarkerRef.current = marker;
    } else {
      dropoffMarkerRef.current.setIcon(dropoffIcon);
      const currentPos = dropoffMarkerRef.current.getLatLng();
      if (currentPos.lat !== dropoffCoords.lat || currentPos.lng !== dropoffCoords.lng) {
        dropoffMarkerRef.current.setLatLng([dropoffCoords.lat, dropoffCoords.lng]);
      }
    }
  }, [
    pickupCoords.lat,
    pickupCoords.lng,
    dropoffCoords.lat,
    dropoffCoords.lng,
    pickupLandmark,
    dropoffLandmark,
    pickupSubcity,
    dropoffSubcity,
    estMinutes,
  ]);

  // 5. Render Authentic Road Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentRoute) return;

    if (routeCasingRef.current) {
      map.removeLayer(routeCasingRef.current);
      routeCasingRef.current = null;
    }
    if (routeCoreRef.current) {
      map.removeLayer(routeCoreRef.current);
      routeCoreRef.current = null;
    }

    const isRealRoad = currentRoute.isRealRoad && (currentRoute.source === 'mapbox_road' || currentRoute.source === 'osrm_road');

    // Casing line (clean white outer halo for high road visibility)
    const casingPolyline = L.polyline(currentRoute.coordinates, {
      color: '#ffffff',
      weight: 8,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Core route line (Solid Pure Black)
    const corePolyline = L.polyline(currentRoute.coordinates, {
      color: '#000000',
      weight: 5,
      opacity: 1.0,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: isRealRoad ? undefined : '7, 8',
    }).addTo(map);

    routeCasingRef.current = casingPolyline;
    routeCoreRef.current = corePolyline;

    if (pickupMarkerRef.current && dropoffMarkerRef.current) {
      const group = L.featureGroup([pickupMarkerRef.current, dropoffMarkerRef.current, corePolyline]);
      map.fitBounds(group.getBounds(), {
        paddingTopLeft: [60, 30],
        paddingBottomRight: [30, 240], // Room for the compact bottom sheet
        maxZoom: 16,
      });
    }
  }, [currentRoute]);

  // 6. Distinct Nearby Rider Markers (Motorcycle & Bicycle) with Honest Demo Data Transparency
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    mockRidersRef.current.forEach((m) => m.remove());
    mockRidersRef.current = [];

    // Realistic coordinates distributed near Central Addis (Bole / Kirkos / Kazanchis corridor)
    const mockRiders = [
      {
        id: 'rider-moto-1',
        type: 'motorcycle' as const,
        name: 'Yonas (Motorcycle)',
        plate: 'AA-2-B48192',
        lat: pickupCoords.lat + 0.0028,
        lng: pickupCoords.lng - 0.0035,
        rating: 4.95,
      },
      {
        id: 'rider-bike-1',
        type: 'bicycle' as const,
        name: 'Kidus (Bicycle Eco)',
        plate: 'Bicycle Eco',
        lat: pickupCoords.lat - 0.0022,
        lng: pickupCoords.lng + 0.0032,
        rating: 4.88,
      },
      {
        id: 'rider-moto-2',
        type: 'motorcycle' as const,
        name: 'Biruk (Motorcycle)',
        plate: 'AA-2-B31940',
        lat: pickupCoords.lat + 0.0042,
        lng: pickupCoords.lng + 0.0018,
        rating: 4.82,
      },
    ];

    mockRiders.forEach((rider) => {
      const isMotorcycle = rider.type === 'motorcycle';

      // Distinct Motorcycle vs Bicycle Icon
      const icon = L.divIcon({
        className: 'demo-rider-marker',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="background-color: ${isMotorcycle ? '#000000' : '#059669'}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid #ffffff;">
              ${
                isMotorcycle
                  ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="18.5" cy="17.5" r="3.5"/>
                      <circle cx="5.5" cy="17.5" r="3.5"/>
                      <circle cx="15" cy="5" r="1"/>
                      <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
                    </svg>`
                  : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="5.5" cy="17.5" r="3.5"/>
                      <circle cx="18.5" cy="17.5" r="3.5"/>
                      <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5L9 9l4-3 2 3h3"/>
                    </svg>`
              }
            </div>
            <span style="font-size: 8px; font-weight: 800; background: rgba(0,0,0,0.85); color: #ffffff; padding: 1px 4px; border-radius: 4px; margin-top: 2px; white-space: nowrap;">
              ${isMotorcycle ? 'Moto' : 'Bike'} (Demo)
            </span>
          </div>
        `,
        iconSize: [36, 48],
        iconAnchor: [18, 44],
      });

      const marker = L.marker([rider.lat, rider.lng], { icon }).addTo(map);

      // Honest popup stating this is demo simulation
      marker.bindPopup(`
        <div style="font-size: 11px; padding: 2px; color: #111827; max-width: 180px;">
          <div style="font-weight: 800; font-size: 12px; margin-bottom: 2px;">
            ${rider.name}
          </div>
          <div style="font-size: 10px; color: #4b5563; margin-bottom: 4px;">
            ${isMotorcycle ? 'Motorcycle' : 'Bicycle Eco'} • ★ ${rider.rating}
          </div>
          <div style="background: #fef3c7; border: 1px solid #fde68a; color: #92400e; padding: 3px 5px; border-radius: 6px; font-size: 9px; font-weight: 600;">
            ⚠️ Simulated courier marker (Demo data — live telemetry requires backend dispatch).
          </div>
        </div>
      `);

      mockRidersRef.current.push(marker);
    });
  }, [pickupCoords.lat, pickupCoords.lng]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      if (routeCoreRef.current) {
        mapInstanceRef.current.fitBounds(routeCoreRef.current.getBounds(), {
          paddingTopLeft: [60, 30],
          paddingBottomRight: [30, 240],
          maxZoom: 16,
        });
      } else if (pickupMarkerRef.current && dropoffMarkerRef.current) {
        const group = L.featureGroup([pickupMarkerRef.current, dropoffMarkerRef.current]);
        mapInstanceRef.current.fitBounds(group.getBounds(), {
          paddingTopLeft: [60, 30],
          paddingBottomRight: [30, 240],
          maxZoom: 16,
        });
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-[100dvh] bg-neutral-100 overflow-hidden select-none">
      {/* Map DOM Container - Full Viewport */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[100dvh]" />

      {/* Top Floating Routing Info Pill */}
      <div className="absolute top-16 sm:top-20 left-4 z-[400] flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 shadow-md border border-neutral-200/90 backdrop-blur-md">
        {isLoadingRoute ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
            <span>Calculating road route...</span>
          </div>
        ) : currentRoute ? (
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-black"></span>
              <span>{currentRoute.distanceKm.toFixed(1)} km</span>
            </span>
            <span className="text-neutral-300">•</span>
            <span className="text-neutral-700">~{estMinutes} min</span>
            {currentRoute.source === 'mapbox_road' && (
              <span className="rounded bg-black text-white px-1.5 py-0.2 text-[9px] font-bold">
                Mapbox
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-neutral-500 font-medium">Addis Ababa Delivery Zone</span>
        )}
      </div>

      {/* Honest Demo Riders Disclaimer Pill on Map */}
      <div className="absolute top-16 sm:top-20 right-4 z-[400] hidden sm:flex items-center gap-1.5 rounded-full bg-amber-50/95 border border-amber-200/80 px-2.5 py-1 text-[10px] font-semibold text-amber-900 shadow-sm backdrop-blur-md">
        <Info className="h-3 w-3 text-amber-700 shrink-0" />
        <span>Rider icons are simulated demo data</span>
      </div>

      {/* Pin Mode Pill */}
      <div className="absolute top-28 left-4 z-[400] hidden sm:flex items-center gap-1 rounded-full bg-white/95 p-1 shadow-md border border-neutral-200 text-xs">
        <span className="text-[10px] text-neutral-500 px-1.5 font-medium">Click map to set:</span>
        <button
          type="button"
          onClick={() => setPinMode('pickup')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
            pinMode === 'pickup'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-neutral-600 hover:text-black'
          }`}
        >
          <span>Pickup</span>
        </button>
        <button
          type="button"
          onClick={() => setPinMode('dropoff')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
            pinMode === 'dropoff'
              ? 'bg-black text-white shadow-sm'
              : 'text-neutral-600 hover:text-black'
          }`}
        >
          <span>Drop-off</span>
        </button>
      </div>

      {/* Click Notice Toast */}
      {clickNotice && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-[450] flex items-center gap-1.5 rounded-full bg-black text-white px-3.5 py-1.5 text-xs font-semibold shadow-lg animate-in fade-in">
          <span>{clickNotice}</span>
        </div>
      )}

      {/* Floating Map Actions (Recenter & Real GPS Locate) */}
      <div className="absolute bottom-20 sm:bottom-8 right-4 z-[400] flex flex-col gap-2">
        {/* Real GPS Locate Button */}
        {onRequestLocation && (
          <button
            type="button"
            onClick={onRequestLocation}
            disabled={isLocating}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-lg border border-neutral-200 hover:bg-neutral-50 active:scale-95 transition-all"
            title="Detect My Location (GPS)"
          >
            {isLocating ? (
              <Loader2 className="h-5 w-5 animate-spin text-black" />
            ) : (
              <Navigation className="h-5 w-5 text-neutral-900" />
            )}
          </button>
        )}

        {/* Fit Route Button */}
        <button
          type="button"
          onClick={handleRecenter}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-lg border border-neutral-200 hover:bg-neutral-50 active:scale-95 transition-all"
          title="Fit Route"
        >
          <Locate className="h-5 w-5 text-neutral-800" />
        </button>
      </div>
    </div>
  );
};
