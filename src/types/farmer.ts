// ─── Profile ──────────────────────────────────────────────────────────────────

export interface FarmerLocation {
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
}

export interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName?: string;
  upiId?: string;
}

export interface FarmerProfile {
  id: string;
  userId: string;
  farmName: string;
  bio?: string;
  photoUrl?: string;
  location: FarmerLocation;
  certifications: string[];       // e.g. ["FSSAI", "Organic India"]
  isVerified: boolean;
  isAvailable: boolean;
  rating: number;
  reviewCount: number;
  totalSales: number;
  totalProducts: number;
  bankDetails?: BankDetails;
  createdAt: string;
  updatedAt: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface RevenueByMonth {
  month: string;   // "2024-06"
  revenue: number;
  orderCount: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  imageUrl?: string;
  totalSold: number;
  revenue: number;
}

export interface FarmerDashboard {
  totalRevenue: number;
  totalOrders: number;
  activeProducts: number;
  pendingOrders: number;
  acceptedOrders: number;
  deliveredOrders: number;
  averageRating: number;
  revenueByMonth: RevenueByMonth[];
  topProducts: TopProduct[];
  pendingPayouts: number;
}

// ─── Earnings ────────────────────────────────────────────────────────────────

export interface EarningEntry {
  date: string;
  orderId: string;
  amount: number;
  status: 'pending' | 'paid';
}

export interface FarmerEarnings {
  totalEarnings: number;
  pendingPayouts: number;
  paidOut: number;
  byDate: EarningEntry[];
}

// ─── Request types ────────────────────────────────────────────────────────────

export interface UpdateFarmerProfileRequest {
  farmName?: string;
  bio?: string;
  location?: Partial<FarmerLocation>;
  certifications?: string[];
}
