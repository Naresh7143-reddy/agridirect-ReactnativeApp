import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../types/navigation';

// ─── Screen imports ───────────────────────────────────────────────────────────
import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import AuthChoiceScreen from '../screens/auth/AuthChoiceScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import PhoneLoginScreen from '../screens/auth/PhoneLoginScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import FarmerRegistrationScreen from '../screens/auth/FarmerRegistrationScreen';
import BuyerRegistrationScreen from '../screens/auth/BuyerRegistrationScreen';
import DeliveryRegistrationScreen from '../screens/auth/DeliveryRegistrationScreen';
import RegistrationSuccessScreen from '../screens/auth/RegistrationSuccessScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  const onboardingDone = require('../utils/storage').isOnboardingDone();
  const initialRoute = onboardingDone ? 'AuthChoice' : 'Splash';

  return (
  <Stack.Navigator
    initialRouteName={initialRoute}
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
      contentStyle: { backgroundColor: 'transparent' },
    }}
  >
    {/* No header, no back gesture — entry point */}
    <Stack.Screen
      name="Splash"
      component={SplashScreen}
      options={{ gestureEnabled: false }}
    />

    {/* Swipe-back locked on onboarding so users can't accidentally exit */}
    <Stack.Screen
      name="Onboarding"
      component={OnboardingScreen}
      options={{ gestureEnabled: false, animation: 'fade' }}
    />

    <Stack.Screen name="AuthChoice" component={AuthChoiceScreen} />

    <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />

    <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />

    <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />

    {/* Role-specific registration flows */}
    <Stack.Screen
      name="FarmerRegistration"
      component={FarmerRegistrationScreen}
    />
    <Stack.Screen
      name="BuyerRegistration"
      component={BuyerRegistrationScreen}
    />
    <Stack.Screen
      name="DeliveryRegistration"
      component={DeliveryRegistrationScreen}
    />

    {/* Success — no back gesture, replaces the registration stack */}
    <Stack.Screen
      name="RegistrationSuccess"
      component={RegistrationSuccessScreen}
      options={{ gestureEnabled: false, animation: 'fade_from_bottom' }}
    />
  </Stack.Navigator>
  );
};
