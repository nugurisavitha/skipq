import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../theme/colors';

import DashboardScreen from '../screens/restaurant/DashboardScreen';
import MenuScreen from '../screens/restaurant/MenuScreen';
import OrdersScreen from '../screens/restaurant/OrdersScreen';
import QRCodesScreen from '../screens/restaurant/QRCodesScreen';
import TablesScreen from '../screens/restaurant/TablesScreen';
import SettingsScreen from '../screens/restaurant/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MenuStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MenuList" component={MenuScreen} />
  </Stack.Navigator>
);

const OrdersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OrdersList" component={OrdersScreen} />
  </Stack.Navigator>
);

const MoreStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SettingsMain" component={SettingsScreen} />
    <Stack.Screen name="QRCodes" component={QRCodesScreen} />
    <Stack.Screen name="Tables" component={TablesScreen} />
  </Stack.Navigator>
);

const RestaurantNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textMuted,
      tabBarStyle: {
        backgroundColor: Colors.white,
        borderTopColor: Colors.border,
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarLabelStyle: { fontSize: 11 },
    }}>
    <Tab.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{
        tabBarIcon: ({ color, size }) => <Icon name="grid" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Menu"
      component={MenuStack}
      options={{
        tabBarIcon: ({ color, size }) => <Icon name="book-open" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Orders"
      component={OrdersStack}
      options={{
        tabBarIcon: ({ color, size }) => <Icon name="clipboard" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="More"
      component={MoreStack}
      options={{
        tabBarIcon: ({ color, size }) => <Icon name="settings" size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

export default RestaurantNavigator;
