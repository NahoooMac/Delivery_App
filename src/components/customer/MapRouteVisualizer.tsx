import React from 'react';
import { Navigation, Compass } from 'lucide-react';
import { SubCity } from '../../types/delivery';

interface MapRouteVisualizerProps {
  pickupSubcity: SubCity;
  pickupLandmark: string;
  dropoffSubcity: SubCity;
  dropoffLandmark: string;
  distanceKm: number;
  vehicleType: 'motorcycle' | 'bicycle';
}

// Normalized coordinate lookup for Addis Ababa sub-cities for realistic SVG placement
const SUBCITY_COORDINATES: Record<SubCity, { x: number; y: number }> = {
  Gullele: { x: 380, y: 110 },
  Arada: { x: 420, y: 210 },
  'Addis Ketema': { x: 330, y: 220 },
  Lideta: { x: 350, y: 290 },
  Kirkos: { x: 440, y: 310 },
  Yeka: { x: 570, y: 190 },
  Bole: { x: 560, y: 340 },
  'Nifas Silk-Lafto': { x: 380, y: 410 },
  'Kolfe Keranio': { x: 230, y: 270 },
  'Lemi Kura': { x: 670, y: 270 },
  'Akaky Kaliti': { x: 490, y: 520 },
};

export const MapRouteVisualizer: React.FC<MapRouteVisualizerProps> = ({
  pickupSubcity,
  pickupLandmark,
  dropoffSubcity,
  dropoffLandmark,
  distanceKm,
  vehicleType,
}) => {
  const pCoord = SUBCITY_COORDINATES[pickupSubcity] || { x: 440, y: 310 };
  const dCoord = SUBCITY_COORDINATES[dropoffSubcity] || { x: 560, y: 340 };

  // Calculate midpoint for route badge
  const midX = (pCoord.x + dCoord.x) / 2;
  const midY = (pCoord.y + dCoord.y) / 2 - 20;

  // Curvature control point
  const ctrlX = midX + (dCoord.y - pCoord.y) * 0.2;
  const ctrlY = midY - (dCoord.x - pCoord.x) * 0.2;

  const estMinutes = vehicleType === 'motorcycle' 
    ? Math.max(12, Math.round(distanceKm * 2.8 + 8))
    : Math.max(18, Math.round(distanceKm * 4.5 + 10));

  return (
    <div className="relative w-full h-full min-h-[280px] sm:min-h-[340px] md:min-h-[420px] rounded-2xl overflow-hidden border border-slate-800 bg-[#0d131f] select-none">
      {/* SVG Canvas Map of Addis Ababa */}
      <svg
        viewBox="100 50 650 520"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <pattern id="streetGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" opacity="0.45" />
          </pattern>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Street Grid pattern */}
        <rect x="0" y="0" width="800" height="600" fill="url(#streetGrid)" />

        {/* Addis Ring Road Loop (Stylized Expressway) */}
        <ellipse
          cx="440"
          cy="310"
          rx="210"
          ry="170"
          fill="none"
          stroke="#334155"
          strokeWidth="3.5"
          strokeDasharray="6 4"
          opacity="0.4"
        />

        {/* Major Radial Arteries (Bole Road, Churchill Ave, Debre Zeit Rd, Megenagna-CMC) */}
        <path d="M 440 310 L 660 380" stroke="#334155" strokeWidth="2.5" opacity="0.4" />
        <path d="M 440 310 L 420 120" stroke="#334155" strokeWidth="2.5" opacity="0.4" />
        <path d="M 440 310 L 220 250" stroke="#334155" strokeWidth="2.5" opacity="0.4" />
        <path d="M 440 310 L 500 560" stroke="#334155" strokeWidth="2.5" opacity="0.4" />
        <path d="M 440 310 L 690 240" stroke="#334155" strokeWidth="2.5" opacity="0.4" />

        {/* Sub-city Node Labels (Selected key hubs) */}
        {Object.entries(SUBCITY_COORDINATES).map(([name, pt]) => (
          <g key={name} opacity={name === pickupSubcity || name === dropoffSubcity ? 0.9 : 0.35}>
            <circle cx={pt.x} cy={pt.y} r="3" fill="#64748b" />
            <text
              x={pt.x}
              y={pt.y - 7}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="9"
              fontFamily="sans-serif"
              fontWeight="500"
            >
              {name}
            </text>
          </g>
        ))}

        {/* Route Shadow / Glow */}
        <path
          d={`M ${pCoord.x} ${pCoord.y} Q ${ctrlX} ${ctrlY} ${dCoord.x} ${dCoord.y}`}
          fill="none"
          stroke="#0f766e"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* Active Route Polyline */}
        <path
          d={`M ${pCoord.x} ${pCoord.y} Q ${ctrlX} ${ctrlY} ${dCoord.x} ${dCoord.y}`}
          fill="none"
          stroke="url(#routeGradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="8 4"
        />

        {/* Pickup Pin Marker (A) */}
        <g transform={`translate(${pCoord.x}, ${pCoord.y})`} filter="url(#glow)">
          <circle cx="0" cy="0" r="14" fill="#10b981" opacity="0.25" />
          <circle cx="0" cy="0" r="8" fill="#10b981" />
          <circle cx="0" cy="0" r="4" fill="#ffffff" />
        </g>

        {/* Drop-off Pin Marker (B) */}
        <g transform={`translate(${dCoord.x}, ${dCoord.y})`} filter="url(#glow)">
          <circle cx="0" cy="0" r="14" fill="#f59e0b" opacity="0.25" />
          <circle cx="0" cy="0" r="8" fill="#f59e0b" />
          <circle cx="0" cy="0" r="4" fill="#ffffff" />
        </g>
      </svg>

      {/* Floating Route Distance & ETA Pill */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/85 px-3 py-2 text-xs shadow-lg backdrop-blur-md">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
          <Navigation className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2 font-mono font-bold text-white">
            <span>~{distanceKm.toFixed(1)} km</span>
            <span className="text-slate-500">•</span>
            <span className="text-amber-400">~{estMinutes} mins</span>
          </div>
          <p className="text-[10px] text-slate-400">
            {pickupSubcity} $\rightarrow$ {dropoffSubcity}
          </p>
        </div>
      </div>

      {/* Bottom Route Legend Overlay */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/85 px-3 py-1.5 text-[11px] shadow-md backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300 font-medium truncate max-w-[120px] sm:max-w-[180px]">
              {pickupLandmark || pickupSubcity}
            </span>
          </div>
          <span className="text-slate-600">→</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-300 font-medium truncate max-w-[120px] sm:max-w-[180px]">
              {dropoffLandmark || dropoffSubcity}
            </span>
          </div>
        </div>

        {/* Clear Notice: No paid API / Vector simulation */}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-800/80 bg-slate-950/70 px-2 py-1 text-[10px] text-slate-400 backdrop-blur-sm">
          <Compass className="h-3 w-3 text-slate-500" />
          <span>Vector Route Preview (Addis Centroids)</span>
        </div>
      </div>
    </div>
  );
};
