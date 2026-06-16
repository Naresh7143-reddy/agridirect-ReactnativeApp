import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import { Colors } from '../theme/colors';
import type { DeliveryStackParamList, DeliveryTabParamList } from '../types/navigation';

// ─── Tab screens ──────────────────────────────────────────────────────────────
import DeliveryHomeScreen from '../screens/delivery/DeliveryHomeScreen';
import DeliveriesScreen from '../screens/delivery/DeliveriesScreen';
import DeliveryEarningsScreen from '../screens/delivery/DeliveryEarningsScreen';
import ProfileScreen from '../screens/common/ProfileScreen';

// ─── Stack screens ────────────────────────────────────────────────────────────
import DeliveryNavigationScreen from '../screens/delivery/DeliveryNavigationScreen';
import DeliveryOrderDetailScreen from '../screens/delivery/DeliveryOrderDetailScreen';
import EditProfileScreen from '../screens/common/EditProfileScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import TermsConditionsScreen from '../screens/common/TermsConditionsScreen';
import HelpSupportScreen from '../screens/common/HelpSupportScreen';

// ─── Tab configuration ────────────────────────────────────────────────────────

interface TabConfig {
  name: keyof DeliveryTabParamList;
  label: string;
  icon: string;
  iconActive: string;
}

const TABS: TabConfig[] = [
  { name: 'HomeTab',      label: 'Home',       icon: 'map-outline',     iconActive: 'map' },
  { name: 'DeliveriesTab',label: 'Deliveries', icon: 'cube-outline',    iconActive: 'cube' },
  { name: 'EarningsTab',  label: 'Earnings',   icon: 'wallet-outline',  iconActive: 'wallet' },
  { name: 'ProfileTab',   label: 'Profile',    icon: 'person-outline',  iconActive: 'person' },
];

// ─── Custom tab bar ───────────────────────────────────────────────────────────

const DeliveryTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => (
  <View style={tabStyles.container}>
    {state.routes.map((route, index) => {
      const tab = TABS[index];
      const isFocused = state.index === index;

      const onPress = () => {
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });
        if (!isFocused && !event.defaultPrevented) {
          navigation.navigate(route.name);
        }
      };

      return (
        <TouchableOpacity
          key={route.key}
          onPress={onPress}
          style={tabStyles.tab}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={isFocused ? { selected: true } : {}}
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

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
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

const Tab = createBottomTabNavigator<DeliveryTabParamList>();

const DeliveryTabs: React.FC = () => (
  <Tab.Navigator
    tabBar={(props) => <DeliveryTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="HomeTab"       component={DeliveryHomeScreen} />
    <Tab.Screen name="DeliveriesTab" component={DeliveriesScreen} />
    <Tab.Screen name="EarningsTab"   component={DeliveryEarningsScreen} />
    <Tab.Screen name="ProfileTab"    component={ProfileScreen} />
  </Tab.Navigator>
);

// ─── Root stack navigator ─────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<DeliveryStackParamList>();

const slide = { animation: 'slide_from_right' } as const;

export const DeliveryNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
  >
    {/* Tab container */}
    <Stack.Screen
      name="DeliveryTabs"
      component={DeliveryTabs}
      options={{ animation: 'none' }}
    />

    {/* Full-screen live map — hides tab bar entirely */}
    <Stack.Screen
      name="DeliveryNavigation"
      component={DeliveryNavigationScreen}
      options={{
        animation: 'slide_from_bottom',
        presentation: 'fullScreenModal',
        gestureEnabled: false, // driver must not accidentally swipe away
      }}
    />

    {/* Order detail */}
    <Stack.Screen
      name="DeliveryOrderDetail"
      component={DeliveryOrderDetailScreen}
      options={slide}
    />

    {/* Profile & settings */}
    <Stack.Screen name="EditProfile"    component={EditProfileScreen}    options={slide} />
    <Stack.Screen name="Notifications"  component={NotificationsScreen}  options={slide} />
    <Stack.Screen name="DeliveryEarningsDetail" component={DeliveryEarningsScreen} options={slide} />

    {/* Legal */}
    <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} options={slide} />
    <Stack.Screen name="HelpSupport"     component={HelpSupportScreen}     options={slide} />
  </Stack.Navigator>
);
