/**
 * AgriDirect — Navigation Param Lists
 *
 * One ParamList per navigator. Import the specific list + NativeStackScreenProps
 * in each screen file to get fully-typed route params and navigation prop.
 *
 * Usage in a screen:
 *   import type { NativeStackScreenProps } from '@react-navigation/native-stack';
 *   import type { BuyerStackParamList } from '../../types/navigation';
 *   type Props = NativeStackScreenProps<BuyerStackParamList, 'ProductDetail'>;
 */

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DrawerScreenProps } from '@react-navigation/drawer';
import type { CompositeScreenProps } from '@react-navigation/native';

// ─── Auth Navigator ───────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  AuthChoice: undefined;
  RoleSelection: { phone?: string; idToken?: string } | undefined;
  PhoneLogin: { role?: 'FARMER' | 'BUYER' | 'DELIVERY' } | undefined;
  OTPVerification: {
    phone: string;
    role?: 'FARMER' | 'BUYER' | 'DELIVERY';
    isLogin?: boolean;
  };
  FarmerRegistration: { phone: string; idToken: string };
  BuyerRegistration: { phone: string; idToken: string };
  DeliveryRegistration: { phone: string; idToken: string };
  RegistrationSuccess: { role: 'FARMER' | 'BUYER' | 'DELIVERY'; name: string };
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

// ─── Buyer Tab Navigator ──────────────────────────────────────────────────────

export type BuyerTabParamList = {
  HomeTab: undefined;
  SearchTab: { query?: string; categoryId?: string } | undefined;
  OrdersTab: undefined;
  WishlistTab: undefined;
  ProfileTab: undefined;
};

export type BuyerTabScreenProps<T extends keyof BuyerTabParamList> =
  BottomTabScreenProps<BuyerTabParamList, T>;

// ─── Buyer Root Stack (tabs + modal screens) ──────────────────────────────────

export type BuyerStackParamList = {
  // Tab container — do not navigate to this directly
  BuyerTabs: undefined;

  // Product
  ProductDetail: { productId: string; fromSearch?: boolean };

  // Cart & checkout
  Cart: undefined;
  AddressSelection: { onSelect?: 'checkout' | 'manage' } | undefined;
  OrderConfirmation: {
    addressId: string;
    paymentMethod: 'RAZORPAY' | 'COD';
  };
  PaymentSuccess: {
    orderId: string;
    amount: number;
    orderNumber: string;
  };

  // Orders
  OrderDetail: { orderId: string; showRating?: boolean };
  OrderTracking: { orderId: string };
  RateReview: { orderId: string; productId?: string; farmerId?: string };

  // Farmer public
  FarmerPublicProfile: { farmerId: string; farmerName?: string };

  // Category browse
  CategoryBrowse: { categoryId: string; categoryName?: string } | undefined;

  // Invoice
  Invoice: { orderId: string };

  // Refer & Earn
  ReferEarn: undefined;

  // Info & legal
  Notifications: undefined;
  HelpSupport: undefined;
  TermsConditions: undefined;
  PrivacyPolicy: undefined;
  RefundPolicy: undefined;
  About: undefined;

  // Profile management
  EditProfile: undefined;
  SavedAddresses: undefined;
  PaymentMethods: undefined;
  NotificationSettings: undefined;
  LanguageSettings: undefined;
};

export type BuyerScreenProps<T extends keyof BuyerStackParamList> =
  NativeStackScreenProps<BuyerStackParamList, T>;

// ─── Farmer Tab Navigator ─────────────────────────────────────────────────────

export type FarmerTabParamList = {
  HomeTab: undefined;
  OrdersTab: undefined;
  AddProductTab: undefined; // FAB — navigates to AddProduct stack screen
  AITab: undefined;
  ProfileTab: undefined;
};

export type FarmerTabScreenProps<T extends keyof FarmerTabParamList> =
  BottomTabScreenProps<FarmerTabParamList, T>;

// ─── Farmer Root Stack ────────────────────────────────────────────────────────

export type FarmerStackParamList = {
  FarmerTabs: undefined;

  // Product management
  AddProduct: undefined;
  EditProduct: { productId: string };
  ProductPreview: { productId: string };
  MyProducts: undefined;

  // Orders
  FarmerOrderDetail: { orderId: string };

  // Finance
  FarmerEarnings: undefined;
  FarmerBankDetails: undefined;

  // Profile & settings
  EditProfile: undefined;
  Notifications: undefined;
  NotificationSettings: undefined;
  LanguageSettings: undefined;

  // Legal
  TermsConditions: undefined;
  PrivacyPolicy: undefined;
  HelpSupport: undefined;
  About: undefined;
};

export type FarmerScreenProps<T extends keyof FarmerStackParamList> =
  NativeStackScreenProps<FarmerStackParamList, T>;

// ─── Delivery Tab Navigator ───────────────────────────────────────────────────

export type DeliveryTabParamList = {
  HomeTab: undefined;
  DeliveriesTab: undefined;
  EarningsTab: undefined;
  ProfileTab: undefined;
};

export type DeliveryTabScreenProps<T extends keyof DeliveryTabParamList> =
  BottomTabScreenProps<DeliveryTabParamList, T>;

// ─── Delivery Root Stack ──────────────────────────────────────────────────────

export type DeliveryStackParamList = {
  DeliveryTabs: undefined;

  // Full-screen map navigation
  DeliveryNavigation: {
    orderId: string;
    pickupLat: number;
    pickupLng: number;
    dropLat: number;
    dropLng: number;
  };

  DeliveryOrderDetail: { orderId: string };

  // Profile & settings
  EditProfile: undefined;
  Notifications: undefined;
  DeliveryEarningsDetail: { month?: string };
  TermsConditions: undefined;
  HelpSupport: undefined;
};

export type DeliveryScreenProps<T extends keyof DeliveryStackParamList> =
  NativeStackScreenProps<DeliveryStackParamList, T>;

// ─── Admin Drawer Navigator ───────────────────────────────────────────────────

export type AdminDrawerParamList = {
  Dashboard: undefined;
  UsersManagement: undefined;
  FarmerVerification: undefined;
  AdminOrders: undefined;
  Analytics: undefined;
  Categories: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type AdminDrawerScreenProps<T extends keyof AdminDrawerParamList> =
  DrawerScreenProps<AdminDrawerParamList, T>;

// ─── Admin Root Stack ─────────────────────────────────────────────────────────

export type AdminStackParamList = {
  AdminDrawer: undefined;
  UserDetail: { userId: string };
  FarmerVerificationDetail: { farmerId: string };
  AdminOrderDetail: { orderId: string };
  AdminProductDetail: { productId: string };
  AdminAddCategory: undefined;
  AdminEditCategory: { categoryId: string };
  SendNotification: undefined;
  Notifications: undefined;
};

export type AdminScreenProps<T extends keyof AdminStackParamList> =
  NativeStackScreenProps<AdminStackParamList, T>;

// ─── Global React Navigation type augmentation ────────────────────────────────
// Merges all screen names into a single global namespace so useNavigation()
// and navigation.navigate() work without explicit generics in most cases.

declare global {
  namespace ReactNavigation {
    interface RootParamList
      extends AuthStackParamList,
        BuyerStackParamList,
        FarmerStackParamList,
        DeliveryStackParamList,
        AdminStackParamList {}
  }
}
