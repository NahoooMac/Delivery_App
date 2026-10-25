export type SubCity =
  | 'Bole'
  | 'Kirkos'
  | 'Yeka'
  | 'Arada'
  | 'Lideta'
  | 'Nifas Silk-Lafto'
  | 'Gullele'
  | 'Addis Ketema'
  | 'Kolfe Keranio'
  | 'Akaky Kaliti'
  | 'Lemi Kura';

export type VehicleType = 'motorcycle' | 'bicycle';

export type PayerType = 'sender' | 'receiver';

export type DeliveryStatus =
  | 'requested'
  | 'assigned'
  | 'arrived_pickup'
  | 'picked_up'
  | 'arrived_dropoff'
  | 'delivered'
  | 'failed'
  | 'returned'
  | 'cancelled';

export type PackageCategory =
  | 'documents'
  | 'food_perishables'
  | 'electronics'
  | 'clothing'
  | 'fragile_goods'
  | 'other';

export type PaymentMethod = 'cash' | 'telebirr' | 'cbe_birr';

export type PaymentStatus =
  | 'pending'
  | 'collected_cash_rider_confirmed'
  | 'collected_unverified'
  | 'verified'
  | 'failed'
  | 'disputed';

export interface Delivery {
  id: string;
  trackingNumber: string;
  vehicleType: VehicleType;
  status: DeliveryStatus;
  pickupAddress: string;
  pickupLandmark: string;
  pickupSubcity: SubCity;
  pickupContactName: string;
  pickupContactPhone: string;
  dropoffAddress: string;
  dropoffLandmark: string;
  dropoffSubcity: SubCity;
  dropoffContactName: string;
  dropoffContactPhone: string;
  packageCategory: PackageCategory;
  packageDescription: string;
  packageWeightKg: number;
  isFragile: boolean;
  payerType: PayerType;
  fareBase: number;
  fareDistance: number;
  fareTotal: number;
  commissionAmount: number;
  estimatedDistanceKm: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  riderName?: string;
  riderPhone?: string;
  riderPlate?: string;
}

export interface EstimateInput {
  pickupSubcity: SubCity;
  dropoffSubcity: SubCity;
  vehicleType: VehicleType;
  packageWeightKg: number;
}

export interface PricingQuote {
  estimatedDistanceKm: number;
  baseFare: number;
  distanceFare: number;
  totalFare: number;
  commissionAmount: number;
  commissionRatePct: number;
  vehicleType: VehicleType;
  isCentroidEstimate: boolean;
  maxWeightAllowedKg: number;
  maxDistanceAllowedKm: number;
  exceedsLimit?: string;
}
