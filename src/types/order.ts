// ─── Enums ────────────────────────────────────────────────────────────────────

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PACKED = 'PACKED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// ─── Sub-entities ─────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  total: number;
  farmerId: string;
  farmerName?: string;
}

export interface DeliveryAddress {
  label?: string;       // "Home", "Office", etc.
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
}

export interface TrackingEvent {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  location?: { lat: number; lng: number };
}

// ─── Core order entity ────────────────────────────────────────────────────────

export interface Order {
  id: string;
  orderNumber: string;    // human-readable e.g. "ORD-20240601-0042"
  buyerId: string;
  buyerName?: string;
  buyerPhone?: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
  deliveryAddress: DeliveryAddress | string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  paymentId?: string;     // Razorpay payment ID after successful payment
  razorpayOrderId?: string;
  deliveryAgentId?: string;
  deliveryAgentName?: string;
  deliveryAgentPhone?: string;
  trackingEvents?: TrackingEvent[];
  notes?: string;
  cancelReason?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  fromDate?: string;
  toDate?: string;
  farmerId?: string;
  buyerId?: string;
}

// ─── Request types ────────────────────────────────────────────────────────────

export interface PlaceOrderRequest {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  deliveryAddressId?: string;
  deliveryAddress?: Omit<DeliveryAddress, 'lat' | 'lng'>;
  paymentMethod: 'RAZORPAY' | 'COD';
  couponCode?: string;
  notes?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  note?: string;
}

export interface RateOrderRequest {
  rating: number;       // 1–5
  review?: string;
  productId?: string;
}
