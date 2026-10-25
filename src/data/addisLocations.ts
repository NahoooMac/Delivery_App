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

// Simplified pilot distance matrix (in km) between sub-city centers for accurate pilot estimations
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
  weightKg: number
): PricingQuote {
  const distanceKm = calculateEstimatedDistance(pickupSubcity, dropoffSubcity);

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
      isCentroidEstimate: true,
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
      isCentroidEstimate: true,
      maxWeightAllowedKg: maxWeight,
      maxDistanceAllowedKm: maxDist,
      exceedsLimit: limitErr,
    };
  }
}
