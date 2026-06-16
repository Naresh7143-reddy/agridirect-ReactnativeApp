import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/Ionicons';

import { Colors } from '../theme/colors';
import { useAuth } from '../hooks/useAuth';
import type { AdminStackParamList, AdminDrawerParamList } from '../types/navigation';

// ─── Drawer screens ───────────────────────────────────────────────────────────
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminFarmerVerificationScreen from '../screens/admin/AdminFarmerVerificationScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen';
import AdminCategoriesScreen from '../screens/admin/AdminCategoriesScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import SettingsScreen from '../screens/common/SettingsScreen';

// ─── Stack screens ────────────────────────────────────────────────────────────
import UserDetailScreen from '../screens/admin/UserDetailScreen';
import FarmerVerificationDetailScreen from '../screens/admin/FarmerVerificationDetailScreen';
import AdminOrderDetailScreen from '../screens/admin/AdminOrderDetailScreen';
import AdminAddCategoryScreen from '../screens/admin/AdminAddCategoryScreen';
import AdminEditCategoryScreen from '../screens/admin/AdminEditCategoryScreen';
import SendNotificationScreen from '../screens/admin/SendNotificationScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';

// ─── Drawer item config ───────────────────────────────────────────────────────

interface DrawerItemConfig {
  name: keyof AdminDrawerParamList;
  label: string;
  icon: string;
}

const DRAWER_ITEMS: DrawerItemConfig[] = [
  { name: 'Dashboard',          label: 'Dashboard',           icon: 'grid' },
  { name: 'UsersManagement',    label: 'Users',               icon: 'people' },
  { name: 'FarmerVerification', label: 'Farmer Verification', icon: 'checkmark-shield' },
  { name: 'AdminOrders',        label: 'Orders',              icon: 'receipt' },
  { name: 'Analytics',          label: 'Analytics',           icon: 'bar-chart' },
  { name: 'Categories',         label: 'Categories',          icon: 'layers' },
];

// ─── Custom drawer content ────────────────────────────────────────────────────

const AdminDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { user, logout } = useAuth();

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={drawerStyles.container}
    >
      {/* Header */}
      <View style={drawerStyles.header}>
        <View style={drawerStyles.avatarCircle}>
          <Icon name="shield-checkmark" size={32} color={Colors.white} />
        </View>
        <Text style={drawerStyles.name}>{user?.name ?? 'Admin'}</Text>
        <Text style={drawerStyles.role}>Platform Administrator</Text>
      </View>

      <View style={drawerStyles.divider} />

      {/* Navigation items */}
      <View style={drawerStyles.items}>
        {DRAWER_ITEMS.map(({ name, label, icon }) => {
          const isFocused =
            props.state.routes[props.state.index]?.name === name;
          return (
            <TouchableOpacity
              key={name}
              style={[drawerStyles.item, isFocused && drawerStyles.itemActive]}
              onPress={() => props.navigation.navigate(name)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  drawerStyles.iconWrap,
                  isFocused && drawerStyles.iconWrapActive,
                ]}
              >
                <Icon
                  name={isFocused ? icon : `${icon}-outline`}
                  size={20}
                  color={isFocused ? Colors.white : Colors.textSecondary}
                />
              </View>
              <Text
                style={[
                  drawerStyles.itemLabel,
                  isFocused && drawerStyles.itemLabelActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={drawerStyles.divider} />

      {/* Footer actions */}
      <View style={drawerStyles.footer}>
        <TouchableOpacity
          style={drawerStyles.item}
          onPress={() => props.navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <View style={drawerStyles.iconWrap}>
            <Icon name="person-outline" size={20} color={Colors.textSecondary} />
          </View>
          <Text style={drawerStyles.itemLabel}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={drawerStyles.item}
          onPress={logout}
          activeOpacity={0.7}
        >
          <View style={[drawerStyles.iconWrap, { backgroundColor: Colors.errorLight }]}>
            <Icon name="log-out-outline" size={20} color={Colors.error} />
          </View>
          <Text style={[drawerStyles.itemLabel, { color: Colors.error }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

const drawerStyles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 24 },
  header: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  role: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  divider: { height: 1, backgroundColor: Colors.divider, marginHorizontal: 16, marginVertical: 8 },
  items: { paddingHorizontal: 12, gap: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  itemActive: { backgroundColor: Colors.successLight },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: Colors.primary },
  itemLabel: { fontSize: 15, fontWeight: '500', color: Colors.textSecondary },
  itemLabelActive: { color: Colors.primary, fontWeight: '700' },
  footer: { paddingHorizontal: 12, gap: 4, marginTop: 8 },
});

// ─── Drawer navigator ─────────────────────────────────────────────────────────

const Drawer = createDrawerNavigator<AdminDrawerParamList>();

const AdminDrawer: React.FC = () => (
  <Drawer.Navigator
    drawerContent={(props) => <AdminDrawerContent {...props} />}
    screenOptions={{
      headerShown: false,
      drawerType: Platform.OS === 'ios' ? 'slide' : 'front',
      drawerStyle: { width: 280, backgroundColor: Colors.surface },
      overlayColor: Colors.overlay,
      swipeEdgeWidth: 60,
    }}
  >
    <Drawer.Screen name="Dashboard"          component={AdminDashboardScreen} />
    <Drawer.Screen name="UsersManagement"    component={AdminUsersScreen} />
    <Drawer.Screen name="FarmerVerification" component={AdminFarmerVerificationScreen} />
    <Drawer.Screen name="AdminOrders"        component={AdminOrdersScreen} />
    <Drawer.Screen name="Analytics"          component={AdminAnalyticsScreen} />
    <Drawer.Screen name="Categories"         component={AdminCategoriesScreen} />
    <Drawer.Screen name="Profile"            component={ProfileScreen} />
    <Drawer.Screen name="Settings"           component={SettingsScreen} />
  </Drawer.Navigator>
);

// ─── Root stack navigator ─────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<AdminStackParamList>();

const slide = { animation: 'slide_from_right' } as const;
const modal = { presentation: 'modal', animation: 'slide_from_bottom' } as const;

export const AdminNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
  >
    {/* Drawer container */}
    <Stack.Screen
      name="AdminDrawer"
      component={AdminDrawer}
      options={{ animation: 'none' }}
    />

    {/* Detail screens — slide in from right */}
    <Stack.Screen name="UserDetail"                  component={UserDetailScreen}                  options={slide} />
    <Stack.Screen name="FarmerVerificationDetail"    component={FarmerVerificationDetailScreen}    options={slide} />
    <Stack.Screen name="AdminOrderDetail"            component={AdminOrderDetailScreen}            options={slide} />

    {/* Category management — modal from bottom */}
    <Stack.Screen name="AdminAddCategory"  component={AdminAddCategoryScreen}  options={modal} />
    <Stack.Screen name="AdminEditCategory" component={AdminEditCategoryScreen} options={modal} />

    {/* Broadcast notification */}
    <Stack.Screen name="SendNotification" component={SendNotificationScreen} options={modal} />

    {/* Notifications */}
    <Stack.Screen name="Notifications" component={NotificationsScreen} options={slide} />
  </Stack.Navigator>
);
