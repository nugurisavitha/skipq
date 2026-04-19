import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../theme/colors';

import DashboardScreen from '../screens/admin/DashboardScreen';
import RestaurantsScreen from '../screens/admin/RestaurantsScreen';
import UsersScreen from '../screens/admin/UsersScreen';
import OrdersScreen from '../screens/admin/OrdersScreen';
import AnalyticsScreen from '../screens/admin/AnalyticsScreen';
import PendingAgentsScreen from '../screens/admin/PendingAgentsScreen';
import SettingsScreen from '../screens/admin/SettingsScreen';
import FoodCourtsScreen from '../screens/admin/FoodCourtsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ManageStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="RestaurantsManage" component={RestaurantsScreen} />
    <Stack.Screen name="UsersManage" component={UsersScreen} />
    <Stack.Screen name="PendingAgents" component={PendingAgentsScreen} />
    <Stack.Screen name="FoodCourts" component={FoodCourtsScreen} />
    <Stack.Screen name="AdminSettings" component={SettingsScreen} />
  </Stack.Navigator>
);

const AdminNavigator = () => (
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
      name="Orders"
      component={OrdersScreen}
      options={{
        tabBarIcon: ({ color, size }) => <Icon name="clipboard" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Analytics"
      component={AnalyticsScreen}
      options={{
        tabBarIcon: ({ color, size }) => <Icon name="bar-chart-2" size={size} color={color} />,
      }}
    />
    <Tab.Screen
      name="Manage"
      component={ManageStack}
      options={{
        tabBarIcon: ({ color, size }) => <Icon name="settings" size={size} color={color} />,
      }}
    />
  </Tab.Navigator>
);

export default AdminNavigator;
