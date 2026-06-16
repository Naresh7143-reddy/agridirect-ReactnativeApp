import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import { Colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useAppSelector } from '../store';
import type { BuyerStackParamList, BuyerTabParamList } from '../types/navigation';

// ─── Tab screens ──────────────────────────────────────────────────────────────
import BuyerHomeScreen from '../screens/buyer/BuyerHomeScreen';
import BrowseScreen from '../screens/buyer/BrowseScreen';
import OrdersScreen from '../screens/buyer/OrdersScreen';
import WishlistScreen from '../screens/buyer/WishlistScreen';
import ProfileScreen from '../screens/common/ProfileScreen';

// ─── Stack screens ────────────────────────────────────────────────────────────
import ProductDetailScreen from '../screens/buyer/ProductDetailScreen';
import CartScreen from '../screens/buyer/CartScreen';
import AddressSelectionScreen from '../screens/buyer/AddressSelectionScreen';
import OrderConfirmationScreen from '../screens/buyer/OrderConfirmationScreen';
import PaymentSuccessScreen from '../screens/buyer/PaymentSuccessScreen';
import OrderTrackingScreen from '../screens/buyer/OrderTrackingScreen';
import OrderDetailScreen from '../screens/buyer/OrderDetailScreen';
import RateReviewScreen from '../screens/buyer/RateReviewScreen';
import FarmerPublicProfileScreen from '../screens/buyer/FarmerPublicProfileScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import HelpSupportScreen from '../screens/common/HelpSupportScreen';
import TermsConditionsScreen from '../screens/common/TermsConditionsScreen';
import PrivacyPolicyScreen from '../screens/common/PrivacyPolicyScreen';
import RefundPolicyScreen from '../screens/common/RefundPolicyScreen';
import AboutScreen from '../screens/common/AboutScreen';
import EditProfileScreen from '../screens/common/EditProfileScreen';
import SavedAddressesScreen from '../screens/common/SavedAddressesScreen';
import PaymentMethodsScreen from '../screens/common/PaymentMethodsScreen';
import NotificationSettingsScreen from '../screens/common/NotificationSettingsScreen';
import LanguageSettingsScreen from '../screens/common/LanguageSettingsScreen';
import CategoryBrowseScreen from '../screens/buyer/CategoryBrowseScreen';
import InvoiceScreen from '../screens/common/InvoiceScreen';
import ReferEarnScreen from '../screens/common/ReferEarnScreen';

// ─── Tab configuration ────────────────────────────────────────────────────────

interface TabConfig {
  name: keyof BuyerTabParamList;
  label: string;
  icon: string;           // Ionicons name (outline)
  iconActive: string;     // Ionicons name (filled)
}

const TABS: TabConfig[] = [
  { name: 'HomeTab',    label: 'Home',    icon: 'home-outline',    iconActive: 'home' },
  { name: 'SearchTab',  label: 'Search',  icon: 'search-outline',  iconActive: 'search' },
  { name: 'OrdersTab',  label: 'Orders',  icon: 'receipt-outline', iconActive: 'receipt' },
  { name: 'WishlistTab',label: 'Wishlist',icon: 'heart-outline',   iconActive: 'heart' },
  { name: 'ProfileTab', label: 'Profile', icon: 'person-outline',  iconActive: 'person' },
];

// ─── Custom tab bar ───────────────────────────────────────────────────────────

const BuyerTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <View style={tabStyles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const tab = TABS[index];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={tabStyles.tab}
            activeOpacity={0.7}
          >
            <Icon
              name={isFocused ? tab.iconActive : tab.icon}
              size={24}
              color={isFocused ? Colors.primary : Colors.textHint}
            />
            <Text style={[tabStyles.label, isFocused && tabStyles.labelActive]}>
              {tab.label}
            </Text>
            {isFocused && <View style={tabStyles.indicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 12 },
    }),
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 10, color: Colors.textHint, fontWeight: '500' },
  labelActive: { color: Colors.primary, fontWeight: '700' },
  indicator: {
    position: 'absolute',
    top: -9,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
});

// ─── Tab navigator ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<BuyerTabParamList>();

const BuyerTabs: React.FC = () => (
  <Tab.Navigator
    tabBar={(props) => <BuyerTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="HomeTab"    component={BuyerHomeScreen} />
    <Tab.Screen name="SearchTab"  component={BrowseScreen} />
    <Tab.Screen name="OrdersTab"  component={OrdersScreen} />
    <Tab.Screen name="WishlistTab" component={WishlistScreen} />
    <Tab.Screen name="ProfileTab" component={ProfileScreen} />
  </Tab.Navigator>
);

// ─── Root stack navigator ─────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<BuyerStackParamList>();

/** Standard slide-from-right options */
const slide = { animation: 'slide_from_right' } as const;

/** Bottom-sheet modal options */
const modal = {
  presentation: 'modal',
  animation: 'slide_from_bottom',
  gestureEnabled: true,
} as const;

export const BuyerNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
  >
    {/* Tab container */}
    <Stack.Screen name="BuyerTabs" component={BuyerTabs} options={{ animation: 'none' }} />

    {/* Product */}
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={slide} />

    {/* Cart & checkout — modals slide from bottom */}
    <Stack.Screen name="Cart"                component={CartScreen}                options={modal} />
    <Stack.Screen name="AddressSelection"    component={AddressSelectionScreen}    options={modal} />
    <Stack.Screen name="OrderConfirmation"   component={OrderConfirmationScreen}   options={modal} />
    <Stack.Screen name="PaymentSuccess"      component={PaymentSuccessScreen}
      options={{ ...modal, gestureEnabled: false }} />

    {/* Orders */}
    <Stack.Screen name="OrderDetail"   component={OrderDetailScreen}   options={slide} />
    <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={slide} />
    <Stack.Screen name="RateReview"    component={RateReviewScreen}    options={modal} />

    {/* Farmer profile */}
    <Stack.Screen name="FarmerPublicProfile" component={FarmerPublicProfileScreen} options={slide} />

    {/* Info & legal */}
    <Stack.Screen name="Notifications"        component={NotificationsScreen}        options={slide} />
    <Stack.Screen name="HelpSupport"          component={HelpSupportScreen}          options={slide} />
    <Stack.Screen name="TermsConditions"      component={TermsConditionsScreen}      options={slide} />
    <Stack.Screen name="PrivacyPolicy"        component={PrivacyPolicyScreen}        options={slide} />
    <Stack.Screen name="RefundPolicy"         component={RefundPolicyScreen}         options={slide} />
    <Stack.Screen name="About"                component={AboutScreen}                options={slide} />

    {/* Profile management */}
    <Stack.Screen name="EditProfile"          component={EditProfileScreen}          options={slide} />
    <Stack.Screen name="SavedAddresses"       component={SavedAddressesScreen}       options={slide} />
    <Stack.Screen name="PaymentMethods"       component={PaymentMethodsScreen}       options={slide} />
    <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={slide} />
    <Stack.Screen name="LanguageSettings"     component={LanguageSettingsScreen}     options={slide} />
    <Stack.Screen name="CategoryBrowse"       component={CategoryBrowseScreen}       options={slide} />
    <Stack.Screen name="Invoice"              component={InvoiceScreen}              options={slide} />
    <Stack.Screen name="ReferEarn"            component={ReferEarnScreen}            options={slide} />
  </Stack.Navigator>
);
