import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../theme/colors';

import DashboardScreen from '../screens/delivery/DashboardScreen';
import OrdersScreen from '../screens/delivery/OrdersScreen';
import HistoryScreen from '../screens/delivery/HistoryScreen';

const Tab = createBottomTabNavigator();

const DeliveryNavigator = () => (
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
        tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Orders"
      component={OrdersScreen}
      options={{
        tabBarIcon: ({ color, size }) => <Icon name="package" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{
        tabBarIcon: ({ color, size }) => <Icon name="clock" size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

export default DeliveryNavigator;
