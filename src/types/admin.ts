import type { UserRole } from './auth';

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface RevenueEntry {
  month: string;    // "2024-06"
  revenue: number;
  orderCount: number;
}

export interface AdminAnalytics {
  totalUsers: number;
  totalFarmers: number;
  totalBuyers: number;
  totalDeliveryAgents: number;
  totalRevenue: number;
  totalOrders: number;
  activeProducts: number;
  pendingFarmerApprovals: number;
  pendingProductApprovals: number;
  todayRevenue: number;
  todayOrders: number;
  revenueByMonth: RevenueEntry[];
  ordersByStatus: Record<string, number>;
  newUsersThisMonth: number;
}

// ─── Pending farmer ───────────────────────────────────────────────────────────

export interface PendingFarmer {
  id: string;
  userId: string;
  name: string;
  phone: string;
  farmName: string;
  location: string;
  certifications: string[];
  submittedAt: string;
  documentsUrl?: string[];
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  /** Target specific user IDs, OR target by role(s) */
  userIds?: string[];
  roles?: UserRole[];
  imageUrl?: string;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface AdminOrderFilters {
  status?: string;
  paymentStatus?: string;
  farmerId?: string;
  buyerId?: string;
  deliveryAgentId?: string;
  fromDate?: string;
  toDate?: string;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export type ReportType = 'revenue' | 'orders' | 'users' | 'products' | 'deliveries';

export interface Report {
  id: string;
  type: ReportType;
  generatedAt: string;
  from: string;
  to: string;
  data: unknown;
  downloadUrl?: string;
}
