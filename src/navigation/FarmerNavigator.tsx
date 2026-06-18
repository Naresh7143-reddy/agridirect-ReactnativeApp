import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text,
  Pressable,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import { Colors } from '../theme/colors';
import { shadow } from '../theme/spacing';
import type { FarmerStackParamList, FarmerTabParamList } from '../types/navigation';

// ─── Tab screens ──────────────────────────────────────────────────────────────
import FarmerHomeScreen from '../screens/farmer/FarmerHomeScreen';
import FarmerOrdersScreen from '../screens/farmer/FarmerOrdersScreen';
import AIAssistantScreen from '../screens/farmer/AIAssistantScreen';
import FarmerProfileScreen from '../screens/farmer/FarmerProfileScreen';

// ─── Stack screens ────────────────────────────────────────────────────────────
import AddProductScreen from '../screens/farmer/AddProductScreen';
import EditProductScreen from '../screens/farmer/EditProductScreen';
import ProductPreviewScreen from '../screens/farmer/ProductPreviewScreen';
import MyProductsScreen from '../screens/farmer/MyProductsScreen';
import FarmerOrderDetailScreen from '../screens/farmer/FarmerOrderDetailScreen';
import FarmerEarningsScreen from '../screens/farmer/FarmerEarningsScreen';
import FarmerBankDetailsScreen from '../screens/farmer/FarmerBankDetailsScreen';
import EditProfileScreen from '../screens/common/EditProfileScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import NotificationSettingsScreen from '../screens/common/NotificationSettingsScreen';
import LanguageSettingsScreen from '../screens/common/LanguageSettingsScreen';
import TermsConditionsScreen from '../screens/common/TermsConditionsScreen';
import PrivacyPolicyScreen from '../screens/common/PrivacyPolicyScreen';
import HelpSupportScreen from '../screens/common/HelpSupportScreen';
import AboutScreen from '../screens/common/AboutScreen';

// ─── Tab configuration ────────────────────────────────────────────────────────

interface TabConfig {
  name: keyof FarmerTabParamList;
  label: string;
  icon: string;
  iconActive: string;
  isFAB?: boolean;
}

const TABS: TabConfig[] = [
  { name: 'HomeTab',        label: 'Home',    icon: 'grid-outline',      iconActive: 'grid' },
  { name: 'OrdersTab',      label: 'Orders',  icon: 'list-outline',      iconActive: 'list' },
  { name: 'AddProductTab',  label: 'Add',     icon: 'add',               iconActive: 'add', isFAB: true },
  { name: 'AITab',          label: 'AI',      icon: 'sparkles-outline',  iconActive: 'sparkles' },
  { name: 'ProfileTab',     label: 'Profile', icon: 'person-outline',    iconActive: 'person' },
];

// ─── Custom tab bar with centre FAB ──────────────────────────────────────────

const FarmerTabBar: React.FC<BottomTabBarProps & { onAddPress: () => void }> = ({
  state, descriptors, navigation, onAddPress,
}) => (
  <View style={tabStyles.container}>
    {state.routes.map((route, index) => {
      const tab = TABS[index];
      const isFocused = state.index === index;

      // Centre FAB button
      if (tab.isFAB) {
        return (
          <View key={route.key} style={tabStyles.fabWrapper}>
            <Pressable
              onPress={onAddPress}
              style={({ pressed }) => [tabStyles.fab, pressed && tabStyles.fabPressed]}
              android_ripple={{ color: Colors.primaryLight, radius: 28 }}
            >
              <Icon name="add" size={32} color={Colors.white} />
            </Pressable>
          </View>
        );
      }

      const onPress = () => {
        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
      };

      return (
        <TouchableOpacity
          key={route.key}
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

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    alignItems: 'center',
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
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,      // lifts FAB above the tab bar
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lg,
  },
  fabPressed: { opacity: 0.85 },
});

// ─── Placeholder for FAB tab (never rendered — FAB navigates to stack screen) ─

const AddProductTabPlaceholder: React.FC = () => <View />;

// ─── Tab navigator ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<FarmerTabParamList>();

// We need a reference to the root stack navigate function so the FAB can push
// AddProduct as a stack screen (over the tab bar), not a tab screen.
// Passed down via React context.
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const FarmerTabs: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<FarmerStackParamList>>();

  return (
    <Tab.Navigator
      tabBar={(props) => (
        <FarmerTabBar
          {...props}
          onAddPress={() => navigation.navigate('AddProduct')}
        />
      )}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab"       component={FarmerHomeScreen} />
      <Tab.Screen name="OrdersTab"     component={FarmerOrdersScreen} />
      <Tab.Screen name="AddProductTab" component={AddProductTabPlaceholder} />
      <Tab.Screen name="AITab"         component={AIAssistantScreen} />
      <Tab.Screen name="ProfileTab"    component={FarmerProfileScreen} />
    </Tab.Navigator>
  );
};

// ─── Root stack navigator ─────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<FarmerStackParamList>();

const slide = { animation: 'slide_from_right' } as const;
const modal = { presentation: 'modal', animation: 'slide_from_bottom' } as const;

export const FarmerNavigator: React.FC = () => (
  <Stack.Navigator
    screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
  >
    <Stack.Screen name="FarmerTabs" component={FarmerTabs} options={{ animation: 'none' }} />

    {/* Product management */}
    <Stack.Screen name="AddProduct"     component={AddProductScreen}     options={modal} />
    <Stack.Screen name="EditProduct"    component={EditProductScreen}    options={slide} />
    <Stack.Screen name="ProductPreview" component={ProductPreviewScreen} options={slide} />
    <Stack.Screen name="MyProducts"     component={MyProductsScreen}     options={slide} />

    {/* Orders */}
    <Stack.Screen name="FarmerOrderDetail" component={FarmerOrderDetailScreen} options={slide} />

    {/* Finance */}
    <Stack.Screen name="FarmerEarnings"   component={FarmerEarningsScreen}   options={slide} />
    <Stack.Screen name="FarmerBankDetails" component={FarmerBankDetailsScreen} options={slide} />

    {/* Profile & settings */}
    <Stack.Screen name="EditProfile"          component={EditProfileScreen}          options={slide} />
    <Stack.Screen name="Notifications"        component={NotificationsScreen}        options={slide} />
    <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={slide} />
    <Stack.Screen name="LanguageSettings"     component={LanguageSettingsScreen}     options={slide} />

    {/* Legal */}
    <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} options={slide} />
    <Stack.Screen name="PrivacyPolicy"   component={PrivacyPolicyScreen}   options={slide} />
    <Stack.Screen name="HelpSupport"     component={HelpSupportScreen}     options={slide} />
    <Stack.Screen name="About"           component={AboutScreen}           options={slide} />
  </Stack.Navigator>
);
