import type { DeliveryAddress } from './order';

// ─── Enums ────────────────────────────────────────────────────────────────────

export type DeliveryStatus =
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed';

// ─── Profile ──────────────────────────────────────────────────────────────────

export type VehicleType = 'BIKE' | 'BICYCLE' | 'AUTO' | 'VAN';

export interface DeliveryProfile {
  id: string;
  userId: string;
  name: string;
  phone: string;
  photoUrl?: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  licenseNumber?: string;
  isAvailable: boolean;
  isVerified: boolean;
  currentLat?: number;
  currentLng?: number;
  rating: number;
  totalDeliveries: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDeliveryProfileRequest {
  name?: string;
  vehicleType?: VehicleType;
  vehicleNumber?: string;
  licenseNumber?: string;
}

// ─── Delivery order ───────────────────────────────────────────────────────────

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: string;
}

export interface DeliveryOrder {
  id: string;
  orderId: string;
  orderNumber: string;
  deliveryAgentId: string;
  status: DeliveryStatus;
  buyerName: string;
  buyerPhone: string;
  farmerName: string;
  farmerPhone: string;
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  dropAddress: string | DeliveryAddress;
  dropLat?: number;
  dropLng?: number;
  estimatedDelivery: string;
  actualDelivery?: string;
  distance?: number;           // km
  deliveryFee: number;
  route?: RoutePoint[];
  proofImageUrl?: string;
  notes?: string;
  assignedAt: string;
  updatedAt: string;
}

// ─── Location ─────────────────────────────────────────────────────────────────

export interface LocationUpdate {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp?: string;
}

// ─── Earnings ─────────────────────────────────────────────────────────────────

export interface EarningEntry {
  date: string;
  deliveries: number;
  amount: number;
}

export interface DeliveryEarnings {
  total: number;
  pending: number;
  paid: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byDate: EarningEntry[];
}
