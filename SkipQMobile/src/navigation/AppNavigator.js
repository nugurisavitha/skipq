import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '../theme/colors';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OTPLoginScreen from '../screens/auth/OTPLoginScreen';
import RestaurantRegisterScreen from '../screens/auth/RestaurantRegisterScreen';
import DeliverySignupScreen from '../screens/delivery/SignupScreen';

// Role navigators
import CustomerNavigator from './CustomerNavigator';
import RestaurantNavigator from './RestaurantNavigator';
import DeliveryNavigator from './DeliveryNavigator';
import AdminNavigator from './AdminNavigator';

const Stack = createNativeStackNavigator();

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: Colors.background },
    }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="OTPLogin" component={OTPLoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="RestaurantRegister" component={RestaurantRegisterScreen} />
    <Stack.Screen name="DeliverySignup" component={DeliverySignupScreen} />
  </Stack.Navigator>
);

const getRoleNavigator = (role) => {
  switch (role) {
    case 'restaurant_admin':
      return RestaurantNavigator;
    case 'delivery_admin':
      return DeliveryNavigator;
    case 'admin':
    case 'super_admin':
      return AdminNavigator;
    default:
      return CustomerNavigator;
  }
};

const AppNavigator = () => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const RoleNavigator = isAuthenticated ? getRoleNavigator(user?.role) : null;

  return (
    <NavigationContainer>
      {isAuthenticated ? <RoleNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
