export type SubscriptionFrequency = 'daily' | 'weekly' | 'biweekly';
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export interface SubscriptionItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  imageUrl?: string;
}

export interface Subscription {
  id: string;
  buyerId: string;
  frequency: SubscriptionFrequency;
  status: SubscriptionStatus;
  items: SubscriptionItem[];
  deliveryAddress: string;
  startDate: string;
  nextDeliveryDate: string;
  totalCostPerDelivery: number;
  createdAt: string;
}

export interface CreateSubscriptionRequest {
  frequency: SubscriptionFrequency;
  items: { productId: string; quantity: number }[];
  addressId: string;
  startDate: string;
}
