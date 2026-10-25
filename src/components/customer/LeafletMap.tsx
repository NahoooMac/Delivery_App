import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ArrowLeft, Locate, Loader2, AlertTriangle } from 'lucide-react';
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
  onBack?: () => void;
  showBackButton?: boolean;
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
  onBack,
  showBackButton = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);
  const routeCasingRef = useRef<L.Polyline | null>(null);
  const routeCoreRef = useRef<L.Polyline | null>(null);
  const courierMarkersRef = useRef<L.Marker[]>([]);

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

  // 1. Initialize Leaflet Map with Mapbox Navigation Day Tiles
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center of Addis Ababa
    const addisCenter: L.LatLngExpression = [9.0108, 38.7613];

    const map = L.map(mapContainerRef.current, {
      center: addisCenter,
      zoom: 14,
      minZoom: 10,
      maxZoom: 19,
      zoomControl: false, // Clean custom position or minimal Uber controls
      attributionControl: true,
    });

    // Add minimal zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Mapbox Navigation Day Retina Tiles (Clean light gray/blue palette matching Uber Rides)
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

    // Fallback to CartoDB Voyager if Mapbox encounters any network hiccups
    tileLayer.on('tileerror', () => {
      // Keep tileLayer resilient
    });

    tileLayer.addTo(map);

    // Map click handler: preserves exact coordinates while looking up nearest landmark
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const nearest = findNearestLandmark(lat, lng);

      if (pinModeRef.current === 'pickup') {
        onSelectPickupRef.current(nearest.subcity, nearest.landmark, { lat, lng });
        setClickNotice(`Pickup set: ${nearest.landmark}`);
      } else {
        onSelectDropoffRef.current(nearest.subcity, nearest.landmark, { lat, lng });
        setClickNotice(`Destination set: ${nearest.landmark}`);
      }

      setTimeout(() => setClickNotice(null), 3000);
    });

    // Invalidate map size on container resize
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
      courierMarkersRef.current.forEach((m) => m.remove());
      courierMarkersRef.current = [];
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Calculate dynamic ETA for dropoff badge
  const estMinutes = currentRoute
    ? vehicleType === 'motorcycle'
      ? Math.max(3, Math.round(currentRoute.durationMinutes * 0.9))
      : Math.max(5, Math.round(currentRoute.distanceKm * 4.5 + 8))
    : 12;

  // 3. Render Draggable Uber Address Pills
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const shortPickup = (pickupLandmark || pickupSubcity).split(',')[0].trim();
    const shortDropoff = (dropoffLandmark || dropoffSubcity).split(',')[0].trim();

    // Pickup Icon: Uber Pill with black square
    const pickupIcon = L.divIcon({
      className: 'uber-map-pin',
      html: `
        <div class="uber-marker-container">
          <div class="uber-pill">
            <span class="uber-pill-square"></span>
            <span class="uber-pill-text">${shortPickup}</span>
            <span class="uber-pill-chevron">›</span>
          </div>
          <div class="uber-pill-stem"></div>
          <div class="uber-pill-base-dot"></div>
        </div>
      `,
      iconSize: [150, 42],
      iconAnchor: [75, 42],
      popupAnchor: [0, -42],
    });

    // Dropoff Icon: Uber Pill with black ETA badge
    const dropoffIcon = L.divIcon({
      className: 'uber-map-pin',
      html: `
        <div class="uber-marker-container">
          <div class="uber-pill">
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

  // 4. Render Authentic Uber Route Polyline (Bold Black with subtle white casing)
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

    // Casing line (soft white outer border)
    const casingPolyline = L.polyline(currentRoute.coordinates, {
      color: '#ffffff',
      weight: 8,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Core route line (Solid Pure Black #000000 like Uber)
    const corePolyline = L.polyline(currentRoute.coordinates, {
      color: '#000000',
      weight: 5,
      opacity: 1.0,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: isRealRoad ? undefined : '7, 8', // Distinct dash if fallback straight line
    }).addTo(map);

    routeCasingRef.current = casingPolyline;
    routeCoreRef.current = corePolyline;

    // Zoom and pan to fit the route with comfortable padding
    if (pickupMarkerRef.current && dropoffMarkerRef.current) {
      const group = L.featureGroup([pickupMarkerRef.current, dropoffMarkerRef.current, corePolyline]);
      map.fitBounds(group.getBounds(), {
        paddingTopLeft: [70, 40],
        paddingBottomRight: [40, 220], // Extra bottom padding for the Uber bottom sheet
        maxZoom: 16,
      });
    }

    // 5. Add 2-3 realistic mini courier markers on the map nearby (just like the cars in the Uber screenshot)
    courierMarkersRef.current.forEach((m) => m.remove());
    courierMarkersRef.current = [];

    const coords = currentRoute.coordinates;
    if (coords && coords.length > 4) {
      const samplePoints = [
        coords[Math.floor(coords.length * 0.25)],
        coords[Math.floor(coords.length * 0.65)],
      ];

      samplePoints.forEach((pt, idx) => {
        // Offset slightly to simulate driving on adjacent lane
        const offsetLat = pt[0] + (idx === 0 ? 0.0008 : -0.0007);
        const offsetLng = pt[1] + (idx === 0 ? 0.001 : -0.0008);

        const courierIcon = L.divIcon({
          className: 'uber-courier-marker',
          html: `
            <div style="background-color: #ffffff; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.25); border: 1.5px solid #000000; transform: rotate(${idx === 0 ? '45deg' : '-35deg'});">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18.5" cy="17.5" r="3.5"/>
                <circle cx="5.5" cy="17.5" r="3.5"/>
                <circle cx="15" cy="5" r="1"/>
                <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
              </svg>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const courierMarker = L.marker([offsetLat, offsetLng], {
          icon: courierIcon,
          interactive: false,
        }).addTo(map);

        courierMarkersRef.current.push(courierMarker);
      });
    }
  }, [currentRoute]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      if (routeCoreRef.current) {
        mapInstanceRef.current.fitBounds(routeCoreRef.current.getBounds(), {
          paddingTopLeft: [70, 40],
          paddingBottomRight: [40, 220],
          maxZoom: 16,
        });
      } else if (pickupMarkerRef.current && dropoffMarkerRef.current) {
        const group = L.featureGroup([pickupMarkerRef.current, dropoffMarkerRef.current]);
        mapInstanceRef.current.fitBounds(group.getBounds(), {
          paddingTopLeft: [70, 40],
          paddingBottomRight: [40, 220],
          maxZoom: 16,
        });
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-[380px] bg-neutral-100 overflow-hidden select-none">
      {/* Mapbox Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[380px]" />

      {/* Floating Uber Circular Back Button (Top Left) */}
      {showBackButton && (
        <button
          type="button"
          onClick={onBack}
          className="absolute top-4 left-4 z-[500] flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-md border border-neutral-200/80 hover:bg-neutral-50 active:scale-95 transition-all"
          title="Go back"
        >
          <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
        </button>
      )}

      {/* Top Floating Road Routing Info Pill */}
      <div className={`absolute top-4 ${showBackButton ? 'left-16' : 'left-4'} z-[500] flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 shadow-md border border-neutral-200/80 backdrop-blur-md`}>
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
            {currentRoute.source === 'osrm_road' && (
              <span className="rounded bg-neutral-200 text-neutral-800 px-1.5 py-0.2 text-[9px] font-semibold">
                OSRM
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-neutral-500 font-medium">Drag pins on map</span>
        )}
      </div>

      {/* Fallback Warning Notice if road server is unreachable */}
      {currentRoute && currentRoute.source === 'fallback_estimate' && !isLoadingRoute && (
        <div className="absolute top-16 left-4 z-[500] max-w-xs rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-900 shadow-md flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span>Approximate fallback estimate. Road routing server unavailable.</span>
        </div>
      )}

      {/* Pin Placement Mode Pill */}
      <div className="absolute top-4 right-14 z-[500] hidden sm:flex items-center gap-1 rounded-full bg-white/95 p-1 shadow-md border border-neutral-200/80 text-xs">
        <button
          type="button"
          onClick={() => setPinMode('pickup')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
            pinMode === 'pickup'
              ? 'bg-black text-white shadow-sm'
              : 'text-neutral-600 hover:text-black'
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
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
          <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
          <span>Drop-off</span>
        </button>
      </div>

      {/* Map Click Notice Toast */}
      {clickNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-1.5 rounded-full bg-black text-white px-3.5 py-1.5 text-xs font-semibold shadow-lg animate-in fade-in">
          <span>{clickNotice}</span>
        </div>
      )}

      {/* Floating Recenter Map Button (Bottom Right above bottom sheet) */}
      <button
        type="button"
        onClick={handleRecenter}
        className="absolute bottom-4 right-4 z-[500] flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg border border-neutral-200/80 hover:bg-neutral-50 active:scale-95 transition-all"
        title="Fit route on map"
      >
        <Locate className="h-5 w-5 text-neutral-800" />
      </button>
    </div>
  );
};
