import { SubCity, VehicleType, PricingQuote } from '../types/delivery';

export const ADDIS_SUBCITIES: SubCity[] = [
  'Bole',
  'Kirkos',
  'Yeka',
  'Arada',
  'Lideta',
  'Nifas Silk-Lafto',
  'Gullele',
  'Addis Ketema',
  'Kolfe Keranio',
  'Akaky Kaliti',
  'Lemi Kura',
];

export interface GeoPoint {
  lat: number;
  lng: number;
}

export const SUBCITY_CENTROIDS: Record<SubCity, GeoPoint> = {
  Bole: { lat: 8.9950, lng: 38.7880 },
  Kirkos: { lat: 9.0116, lng: 38.7670 },
  Yeka: { lat: 9.0305, lng: 38.8020 },
  Arada: { lat: 9.0350, lng: 38.7525 },
  Lideta: { lat: 9.0125, lng: 38.7350 },
  'Nifas Silk-Lafto': { lat: 8.9830, lng: 38.7380 },
  Gullele: { lat: 9.0620, lng: 38.7380 },
  'Addis Ketema': { lat: 9.0310, lng: 38.7360 },
  'Kolfe Keranio': { lat: 9.0180, lng: 38.7080 },
  'Akaky Kaliti': { lat: 8.8920, lng: 38.7680 },
  'Lemi Kura': { lat: 9.0250, lng: 38.8620 },
};

export const LANDMARK_COORDINATES: Record<string, GeoPoint> = {
  // Bole
  'Bole Medhanealem Cathedral': { lat: 8.9984, lng: 38.7869 },
  'Edna Mall area, Cameroun St': { lat: 8.9972, lng: 38.7877 },
  'Atlas Hotel Junction, Namibia St': { lat: 9.0142, lng: 38.7825 },
  'Dembel City Center, Africa Ave': { lat: 9.0094, lng: 38.7675 },
  'Bole Airport Cargo Terminal': { lat: 8.9806, lng: 38.7994 },
  'Rwanda Embassy area': { lat: 8.9930, lng: 38.7780 },

  // Kirkos
  'Kazanchis, ECA / UNECA Headquarters': { lat: 9.0177, lng: 38.7686 },
  'Meskel Square / Museum': { lat: 9.0108, lng: 38.7613 },
  'Mexico Square (Commercial Bank HQ)': { lat: 9.0107, lng: 38.7454 },
  'Gotera Interchange / Pepsi Area': { lat: 8.9870, lng: 38.7565 },
  'Olympia / Beklo Bet Junction': { lat: 9.0020, lng: 38.7660 },

  // Yeka
  'Megenagna Roundabout (Zefmesh Mall)': { lat: 9.0205, lng: 38.8020 },
  'Signal / Signal Telecom area': { lat: 9.0285, lng: 38.7950 },
  'Shola Traditional Market': { lat: 9.0230, lng: 38.7910 },
  'CMC St. Michael Church': { lat: 9.0185, lng: 38.8520 },
  'Ayat Real Estate Roundabout': { lat: 9.0210, lng: 38.8750 },

  // Arada
  'Piazza Post Office / De Gaulle Square': { lat: 9.0350, lng: 38.7520 },
  '4 Kilo (Parliament / AAU Campus)': { lat: 9.0325, lng: 38.7625 },
  '5 Kilo (AAU Technology Campus)': { lat: 9.0435, lng: 38.7610 },
  'Churchill Avenue (Tewodros Square)': { lat: 9.0210, lng: 38.7510 },
  'Ras Mekonnen Bridge / Arogew Kera': { lat: 9.0270, lng: 38.7540 },

  // Lideta
  'Lideta High Court area': { lat: 9.0135, lng: 38.7360 },
  'Balcha Hospital Junction': { lat: 9.0145, lng: 38.7420 },
  'Abinet Square': { lat: 9.0195, lng: 38.7390 },
  'Federal Police HQ area': { lat: 9.0110, lng: 38.7330 },

  // Nifas Silk-Lafto
  'Sarbet (Adams Pavilion / OAU Area)': { lat: 8.9980, lng: 38.7350 },
  'Kera Livestock Market Junction': { lat: 8.9930, lng: 38.7480 },
  'Jemo 1 Condominium Gate': { lat: 8.9550, lng: 38.7180 },
  'German Square / Lebu Mebrathail': { lat: 8.9730, lng: 38.7290 },
  'Bisrate Gabriel Church': { lat: 8.9910, lng: 38.7370 },

  // Gullele
  'Shiro Meda Textile Market': { lat: 9.0550, lng: 38.7620 },
  'Semien Hotel / St. Paul Hospital': { lat: 9.0510, lng: 38.7350 },
  'Addis Ababa Zoo Park / Entoto Gate': { lat: 9.0850, lng: 38.7650 },
  'Wingate Junction': { lat: 9.0580, lng: 38.7180 },

  // Addis Ketema
  'Mercato (Military Tera / Cinema Ras)': { lat: 9.0320, lng: 38.7380 },
  'Autobus Tera (Main Bus Terminal)': { lat: 9.0345, lng: 38.7340 },
  'Sebategna Commercial Center': { lat: 9.0280, lng: 38.7420 },

  // Kolfe Keranio
  'Tor Hailoch Hospital Junction': { lat: 9.0120, lng: 38.7250 },
  'Total / Keranio Roundabout': { lat: 9.0150, lng: 38.7050 },
  'Zenebework Square': { lat: 9.0170, lng: 38.7120 },
  'Alem Bank Junction': { lat: 9.0210, lng: 38.6950 },

  // Akaky Kaliti
  'Kaliti Drivers Training Center': { lat: 8.8980, lng: 38.7620 },
  'Kality Customs Depot': { lat: 8.8920, lng: 38.7680 },
  'Koye Feche Condominiums': { lat: 8.8750, lng: 38.7950 },
  'Tuludimtu Interchange': { lat: 8.8650, lng: 38.7850 },

  // Lemi Kura
  'Summit Pepsi Factory': { lat: 9.0280, lng: 38.8550 },
  'Goro Junction (Bole-Lemi Expressway)': { lat: 9.0080, lng: 38.8650 },
  'Ayat Zone 3 Condominium': { lat: 9.0210, lng: 38.8820 },
  'Figa Roundabout': { lat: 9.0140, lng: 38.8350 },
};

export const POPULAR_LANDMARKS: Record<SubCity, string[]> = {
  Bole: [
    'Bole Medhanealem Cathedral',
    'Edna Mall area, Cameroun St',
    'Atlas Hotel Junction, Namibia St',
    'Dembel City Center, Africa Ave',
    'Bole Airport Cargo Terminal',
    'Rwanda Embassy area',
  ],
  Kirkos: [
    'Kazanchis, ECA / UNECA Headquarters',
    'Meskel Square / Museum',
    'Mexico Square (Commercial Bank HQ)',
    'Gotera Interchange / Pepsi Area',
    'Olympia / Beklo Bet Junction',
  ],
  Yeka: [
    'Megenagna Roundabout (Zefmesh Mall)',
    'Signal / Signal Telecom area',
    'Shola Traditional Market',
    'CMC St. Michael Church',
    'Ayat Real Estate Roundabout',
  ],
  Arada: [
    'Piazza Post Office / De Gaulle Square',
    '4 Kilo (Parliament / AAU Campus)',
    '5 Kilo (AAU Technology Campus)',
    'Churchill Avenue (Tewodros Square)',
    'Ras Mekonnen Bridge / Arogew Kera',
  ],
  Lideta: [
    'Lideta High Court area',
    'Balcha Hospital Junction',
    'Abinet Square',
    'Federal Police HQ area',
  ],
  'Nifas Silk-Lafto': [
    'Sarbet (Adams Pavilion / OAU Area)',
    'Kera Livestock Market Junction',
    'Jemo 1 Condominium Gate',
    'German Square / Lebu Mebrathail',
    'Bisrate Gabriel Church',
  ],
  Gullele: [
    'Shiro Meda Textile Market',
    'Semien Hotel / St. Paul Hospital',
    'Addis Ababa Zoo Park / Entoto Gate',
    'Wingate Junction',
  ],
  'Addis Ketema': [
    'Mercato (Military Tera / Cinema Ras)',
    'Autobus Tera (Main Bus Terminal)',
    'Sebategna Commercial Center',
  ],
  'Kolfe Keranio': [
    'Tor Hailoch Hospital Junction',
    'Total / Keranio Roundabout',
    'Zenebework Square',
    'Alem Bank Junction',
  ],
  'Akaky Kaliti': [
    'Kaliti Drivers Training Center',
    'Kality Customs Depot',
    'Koye Feche Condominiums',
    'Tuludimtu Interchange',
  ],
  'Lemi Kura': [
    'Summit Pepsi Factory',
    'Goro Junction (Bole-Lemi Expressway)',
    'Ayat Zone 3 Condominium',
    'Figa Roundabout',
  ],
};

// Simplified pilot distance matrix (in km) between sub-city centers for fallback estimations
const SUBCITY_DISTANCES: Record<string, number> = {
  'Bole-Kirkos': 4.2,
  'Bole-Yeka': 6.5,
  'Bole-Arada': 7.8,
  'Bole-Lideta': 8.5,
  'Bole-Nifas Silk-Lafto': 6.8,
  'Bole-Gullele': 11.2,
  'Bole-Addis Ketema': 9.8,
  'Bole-Kolfe Keranio': 13.5,
  'Bole-Akaky Kaliti': 10.4,
  'Bole-Lemi Kura': 7.2,
  'Kirkos-Yeka': 5.8,
  'Kirkos-Arada': 3.5,
  'Kirkos-Lideta': 2.8,
  'Kirkos-Nifas Silk-Lafto': 4.5,
  'Kirkos-Gullele': 8.2,
  'Kirkos-Addis Ketema': 5.6,
  'Kirkos-Kolfe Keranio': 9.1,
  'Kirkos-Akaky Kaliti': 12.0,
  'Kirkos-Lemi Kura': 9.5,
  'Yeka-Arada': 5.1,
  'Yeka-Lemi Kura': 4.8,
  'Yeka-Gullele': 7.6,
  'Arada-Lideta': 3.2,
  'Arada-Addis Ketema': 2.5,
  'Arada-Gullele': 4.8,
  'Lideta-Nifas Silk-Lafto': 3.8,
  'Lideta-Addis Ketema': 2.1,
  'Nifas Silk-Lafto-Akaky Kaliti': 8.2,
};

export function getCoordinatesForLandmark(subcity: SubCity, landmark: string): GeoPoint {
  if (LANDMARK_COORDINATES[landmark]) {
    return LANDMARK_COORDINATES[landmark];
  }
  return SUBCITY_CENTROIDS[subcity] || { lat: 9.0108, lng: 38.7613 };
}

// Haversine distance in km between two GPS coordinates
export function calculateHaversineDistance(pt1: GeoPoint, pt2: GeoPoint): number {
  const R = 6371; // Earth radius in km
  const dLat = ((pt2.lat - pt1.lat) * Math.PI) / 180;
  const dLng = ((pt2.lng - pt1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((pt1.lat * Math.PI) / 180) *
      Math.cos((pt2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Snaps a clicked point on the map to the nearest known Addis Ababa landmark
export function findNearestLandmark(
  lat: number,
  lng: number
): { subcity: SubCity; landmark: string; distanceKm: number } {
  let nearestSubcity: SubCity = 'Bole';
  let nearestLandmark = 'Bole Medhanealem Cathedral';
  let minDistance = Infinity;

  // Search through all landmarks
  Object.entries(POPULAR_LANDMARKS).forEach(([subcity, landmarks]) => {
    landmarks.forEach((lm) => {
      const coord = LANDMARK_COORDINATES[lm] || SUBCITY_CENTROIDS[subcity as SubCity];
      if (coord) {
        const dist = calculateHaversineDistance({ lat, lng }, coord);
        if (dist < minDistance) {
          minDistance = dist;
          nearestSubcity = subcity as SubCity;
          nearestLandmark = lm;
        }
      }
    });
  });

  return {
    subcity: nearestSubcity,
    landmark: nearestLandmark,
    distanceKm: Math.round(minDistance * 10) / 10,
  };
}

export function calculateEstimatedDistance(from: SubCity, to: SubCity): number {
  if (from === to) return 3.2; // Intrasubcity average trip
  const key1 = `${from}-${to}`;
  const key2 = `${to}-${from}`;
  if (SUBCITY_DISTANCES[key1]) return SUBCITY_DISTANCES[key1];
  if (SUBCITY_DISTANCES[key2]) return SUBCITY_DISTANCES[key2];
  return 7.5; // Default representative distance across Addis
}

export function calculateFareQuote(
  pickupSubcity: SubCity,
  dropoffSubcity: SubCity,
  vehicleType: VehicleType,
  weightKg: number,
  actualRoadDistanceKm?: number
): PricingQuote {
  // Use real road distance when available, otherwise fall back to centroid table
  const hasRealRoadDistance = typeof actualRoadDistanceKm === 'number' && actualRoadDistanceKm > 0;
  const distanceKm = hasRealRoadDistance
    ? Math.round(actualRoadDistanceKm * 10) / 10
    : calculateEstimatedDistance(pickupSubcity, dropoffSubcity);

  if (vehicleType === 'bicycle') {
    const maxWeight = 5.0;
    const maxDist = 7.0;
    let limitErr: string | undefined;

    if (weightKg > maxWeight) {
      limitErr = `Weight (${weightKg} kg) exceeds maximum 5.0 kg for bicycle delivery. Please select motorcycle.`;
    } else if (distanceKm > maxDist) {
      limitErr = `Trip distance (~${distanceKm} km) exceeds 7.0 km bicycle range. Please select motorcycle.`;
    }

    // Bicycle Pricing Rules from spec:
    // Base: 45 ETB (includes first 1.5 km), 15 ETB/km thereafter, Min: 60 ETB, Commission: 10%
    const baseFare = 45.0;
    const billableExtraKm = Math.max(0, distanceKm - 1.5);
    const distanceFare = billableExtraKm * 15.0;
    const rawTotal = baseFare + distanceFare;
    const totalFare = Math.max(60.0, Math.round(rawTotal));
    const commissionRatePct = 10.0;
    const commissionAmount = Math.round((totalFare * commissionRatePct) / 100);

    return {
      estimatedDistanceKm: distanceKm,
      baseFare,
      distanceFare: Math.round(distanceFare),
      totalFare,
      commissionAmount,
      commissionRatePct,
      vehicleType,
      isCentroidEstimate: !hasRealRoadDistance,
      maxWeightAllowedKg: maxWeight,
      maxDistanceAllowedKm: maxDist,
      exceedsLimit: limitErr,
    };
  } else {
    // Motorcycle Pricing Rules from spec:
    // Base: 85 ETB (includes first 2.0 km), 22 ETB/km thereafter, Min: 100 ETB, Commission: 15%, Max: 30kg, Max: 30km
    const maxWeight = 30.0;
    const maxDist = 30.0;
    let limitErr: string | undefined;

    if (weightKg > maxWeight) {
      limitErr = `Weight (${weightKg} kg) exceeds maximum 30.0 kg for motorcycle delivery.`;
    } else if (distanceKm > maxDist) {
      limitErr = `Trip distance (~${distanceKm} km) exceeds 30.0 km motorcycle pilot perimeter.`;
    }

    const baseFare = 85.0;
    const billableExtraKm = Math.max(0, distanceKm - 2.0);
    const distanceFare = billableExtraKm * 22.0;
    const rawTotal = baseFare + distanceFare;
    const totalFare = Math.max(100.0, Math.round(rawTotal));
    const commissionRatePct = 15.0;
    const commissionAmount = Math.round((totalFare * commissionRatePct) / 100);

    return {
      estimatedDistanceKm: distanceKm,
      baseFare,
      distanceFare: Math.round(distanceFare),
      totalFare,
      commissionAmount,
      commissionRatePct,
      vehicleType,
      isCentroidEstimate: !hasRealRoadDistance,
      maxWeightAllowedKg: maxWeight,
      maxDistanceAllowedKm: maxDist,
      exceedsLimit: limitErr,
    };
  }
}
