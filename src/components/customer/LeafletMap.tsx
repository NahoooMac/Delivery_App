import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Navigation, Compass, Check, Locate, Loader2 } from 'lucide-react';
import { SubCity, GeoPoint } from '../../types/delivery';
import { getCoordinatesForLandmark, findNearestLandmark } from '../../data/addisLocations';
import { fetchRoadRoute, RouteResult } from '../../services/routingService';

interface LeafletMapProps {
  pickupSubcity: SubCity;
  pickupLandmark: string;
  onSelectPickup: (subcity: SubCity, landmark: string, coords: GeoPoint) => void;
  dropoffSubcity: SubCity;
  dropoffLandmark: string;
  onSelectDropoff: (subcity: SubCity, landmark: string, coords: GeoPoint) => void;
  vehicleType: 'motorcycle' | 'bicycle';
  onRouteCalculated: (route: RouteResult) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  pickupSubcity,
  pickupLandmark,
  onSelectPickup,
  dropoffSubcity,
  dropoffLandmark,
  onSelectDropoff,
  vehicleType,
  onRouteCalculated,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [pinMode, setPinMode] = useState<'pickup' | 'dropoff'>('dropoff');
  const [currentRoute, setCurrentRoute] = useState<RouteResult | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [clickNotice, setClickNotice] = useState<string | null>(null);

  // Derive coordinates
  const pickupCoords = getCoordinatesForLandmark(pickupSubcity, pickupLandmark);
  const dropoffCoords = getCoordinatesForLandmark(dropoffSubcity, dropoffLandmark);

  // Keep references to latest callbacks and state to avoid stale closures in Leaflet events
  const onSelectPickupRef = useRef(onSelectPickup);
  const onSelectDropoffRef = useRef(onSelectDropoff);
  const pinModeRef = useRef(pinMode);

  useEffect(() => {
    onSelectPickupRef.current = onSelectPickup;
    onSelectDropoffRef.current = onSelectDropoff;
    pinModeRef.current = pinMode;
  }, [onSelectPickup, onSelectDropoff, pinMode]);

  // 1. Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center of Addis Ababa
    const addisCenter: L.LatLngExpression = [9.0108, 38.7613];

    const map = L.map(mapContainerRef.current, {
      center: addisCenter,
      zoom: 13,
      minZoom: 10,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: true,
    });

    // CartoDB Voyager tiles (OpenStreetMap based, high clarity and free for development)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Map click handler: allows clicking anywhere on the map to set pickup or drop-off
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const nearest = findNearestLandmark(lat, lng);

      if (pinModeRef.current === 'pickup') {
        onSelectPickupRef.current(nearest.subcity, nearest.landmark, { lat, lng });
        setClickNotice(`Pickup set: ${nearest.landmark} (${nearest.subcity})`);
      } else {
        onSelectDropoffRef.current(nearest.subcity, nearest.landmark, { lat, lng });
        setClickNotice(`Drop-off set: ${nearest.landmark} (${nearest.subcity})`);
      }

      setTimeout(() => setClickNotice(null), 3500);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Update Markers and Real Road Route when coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Create custom DivIcons for A (Pickup) and B (Dropoff)
    const pickupIcon = L.divIcon({
      className: 'custom-pin-pickup',
      html: `
        <div style="background-color: #10b981; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5); border: 2.5px solid white;">
          A
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });

    const dropoffIcon = L.divIcon({
      className: 'custom-pin-dropoff',
      html: `
        <div style="background-color: #f59e0b; color: #0f172a; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.5); border: 2.5px solid white;">
          B
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
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
      pickupMarkerRef.current.setLatLng([pickupCoords.lat, pickupCoords.lng]);
    }

    pickupMarkerRef.current.bindPopup(
      `<div style="font-size: 12px; font-weight: bold; color: #0f172a;">
        🟢 Pickup: ${pickupLandmark}<br/>
        <span style="font-size: 10px; color: #64748b;">${pickupSubcity} Sub-City</span>
      </div>`
    );

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
      dropoffMarkerRef.current.setLatLng([dropoffCoords.lat, dropoffCoords.lng]);
    }

    dropoffMarkerRef.current.bindPopup(
      `<div style="font-size: 12px; font-weight: bold; color: #0f172a;">
        📍 Drop-off: ${dropoffLandmark}<br/>
        <span style="font-size: 10px; color: #64748b;">${dropoffSubcity} Sub-City</span>
      </div>`
    );

    // 3. Fetch Road Route (OSRM)
    let isCancelled = false;
    setIsLoadingRoute(true);

    fetchRoadRoute(pickupCoords, dropoffCoords).then((route) => {
      if (isCancelled) return;
      setIsLoadingRoute(false);
      setCurrentRoute(route);
      onRouteCalculated(route);

      // Draw / update polyline on map
      if (routePolylineRef.current) {
        map.removeLayer(routePolylineRef.current);
      }

      const polyline = L.polyline(route.coordinates, {
        color: '#f59e0b',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: route.isRealRoad ? undefined : '8, 6',
      }).addTo(map);

      routePolylineRef.current = polyline;

      // Fit bounds to show entire route with padding
      const group = L.featureGroup([
        pickupMarkerRef.current!,
        dropoffMarkerRef.current!,
        polyline,
      ]);
      map.fitBounds(group.getBounds(), { padding: [40, 40] });
    });

    return () => {
      isCancelled = true;
    };
  }, [pickupCoords.lat, pickupCoords.lng, dropoffCoords.lat, dropoffCoords.lng, pickupLandmark, dropoffLandmark, pickupSubcity, dropoffSubcity, onRouteCalculated]);

  const handleRecenter = () => {
    if (mapInstanceRef.current && routePolylineRef.current) {
      mapInstanceRef.current.fitBounds(routePolylineRef.current.getBounds(), { padding: [40, 40] });
    }
  };

  const estMinutes = currentRoute
    ? vehicleType === 'motorcycle'
      ? Math.max(10, Math.round(currentRoute.durationMinutes * 0.9))
      : Math.max(15, Math.round(currentRoute.distanceKm * 4.5 + 8))
    : 15;

  return (
    <div className="relative w-full h-full min-h-[300px] sm:min-h-[380px] md:min-h-[460px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl">
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px] sm:min-h-[380px] md:min-h-[460px]" />

      {/* Top Floating Route Distance & ETA Pill */}
      <div className="absolute top-4 left-4 z-[500] flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/90 px-3 py-2 text-xs shadow-lg backdrop-blur-md">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
          {isLoadingRoute ? (
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white">
            <span>~{currentRoute ? currentRoute.distanceKm.toFixed(1) : '...'} km</span>
            <span className="text-slate-500">•</span>
            <span className="text-amber-400">~{estMinutes} mins</span>
            <span className="text-[10px] font-sans font-normal text-emerald-400">
              {currentRoute?.isRealRoad ? '(Real Road)' : '(Approx. Estimate)'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            {pickupSubcity} → {dropoffSubcity}
          </p>
        </div>
      </div>

      {/* Top Right: Pin Placement Mode Switcher */}
      <div className="absolute top-4 right-4 z-[500] flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/90 p-1 text-[11px] shadow-lg backdrop-blur-md">
        <span className="text-[10px] text-slate-400 px-1.5 font-medium hidden sm:inline">
          Tap Map to set:
        </span>
        <button
          type="button"
          onClick={() => setPinMode('pickup')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
            pinMode === 'pickup'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Click on the map to set pickup point"
        >
          <span className="h-2 w-2 rounded-full bg-current"></span>
          <span>Pickup (A)</span>
        </button>
        <button
          type="button"
          onClick={() => setPinMode('dropoff')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
            pinMode === 'dropoff'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Click on the map to set drop-off destination"
        >
          <span className="h-2 w-2 rounded-full bg-current"></span>
          <span>Drop-off (B)</span>
        </button>
      </div>

      {/* Map Click Feedback Toast */}
      {clickNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-slate-900/95 px-3 py-1.5 text-xs font-semibold text-emerald-300 shadow-xl backdrop-blur-md animate-in fade-in">
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          <span>{clickNotice}</span>
        </div>
      )}

      {/* Bottom Route Legend & Controls */}
      <div className="absolute bottom-4 left-4 right-4 z-[500] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Recenter button */}
        <button
          type="button"
          onClick={handleRecenter}
          className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/90 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:border-slate-700 shadow-md backdrop-blur-md transition-all active:scale-95"
        >
          <Locate className="h-3.5 w-3.5 text-amber-400" />
          <span>Fit Route</span>
        </button>

        {/* Real OpenStreetMap attribution pill */}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-800/80 bg-slate-950/85 px-2.5 py-1 text-[10px] text-slate-400 backdrop-blur-sm">
          <Compass className="h-3 w-3 text-amber-400 shrink-0" />
          <span>OpenStreetMap & OSRM Road Routing • Free Dev Tier</span>
        </div>
      </div>
    </div>
  );
};
