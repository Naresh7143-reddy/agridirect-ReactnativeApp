/**
 * AgriDirect — Deep link / Universal link configuration
 *
 * This module exports the linking config so it can be imported into
 * AppNavigator and reused in tests or other entry-points.
 *
 * Supported URL schemes:
 *   agridirect://...           (custom scheme)
 *   https://agridirect.app/... (universal / app links)
 *
 * To test on Android emulator:
 *   adb shell am start -a android.intent.action.VIEW \
 *     -d "agridirect://products/abc123" com.agridirect
 */

import type { LinkingOptions } from '@react-navigation/native';

export const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: [
    'agridirect://',
    'https://agridirect.app',
    'https://www.agridirect.app',
  ],

  config: {
    screens: {
      // ── Auth ──────────────────────────────────────────────────────────────
      Splash:          'splash',
      Onboarding:      'onboarding',
      RoleSelection:   'role',
      PhoneLogin:      'login',
      OTPVerification: 'otp',

      // ── Buyer stack ───────────────────────────────────────────────────────
      BuyerTabs:           {
        screens: {
          HomeTab:     '',
          SearchTab:   'browse',
          OrdersTab:   'my-orders',
          WishlistTab: 'wishlist',
          ProfileTab:  'profile',
        },
      },
      ProductDetail:       'products/:productId',
      Cart:                'cart',
      AddressSelection:    'addresses',
      OrderConfirmation:   'checkout',
      PaymentSuccess:      'payment/success',
      OrderDetail:         'orders/:orderId',
      OrderTracking:       'orders/:orderId/track',
      RateReview:          'orders/:orderId/review',
      FarmerPublicProfile: 'farmers/:farmerId',

      // ── Farmer stack ──────────────────────────────────────────────────────
      FarmerTabs: {
        screens: {
          HomeTab:    'farmer',
          OrdersTab:  'farmer/orders',
          AITab:      'farmer/ai',
          ProfileTab: 'farmer/profile',
        },
      },
      FarmerOrderDetail: 'farmer/orders/:orderId',
      AddProduct:        'farmer/products/new',
      EditProduct:       'farmer/products/:productId/edit',
      FarmerEarnings:    'farmer/earnings',

      // ── Delivery stack ────────────────────────────────────────────────────
      DeliveryTabs: {
        screens: {
          HomeTab:       'delivery',
          DeliveriesTab: 'delivery/list',
          EarningsTab:   'delivery/earnings',
          ProfileTab:    'delivery/profile',
        },
      },
      DeliveryNavigation:  'delivery/navigate/:orderId',
      DeliveryOrderDetail: 'delivery/orders/:orderId',

      // ── Admin stack ───────────────────────────────────────────────────────
      AdminDrawer:    'admin',
      UserDetail:     'admin/users/:userId',
      AdminOrderDetail: 'admin/orders/:orderId',
      FarmerVerificationDetail: 'admin/farmers/:farmerId/verify',

      // ── Common (accessible from any role) ─────────────────────────────────
      Notifications:      'notifications',
      HelpSupport:        'help',
      TermsConditions:    'terms',
      PrivacyPolicy:      'privacy',
    },
  },
};
