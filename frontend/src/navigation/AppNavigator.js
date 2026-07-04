import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CustomersScreen from '../screens/CustomersScreen';
import AddCustomerScreen from '../screens/AddCustomerScreen';
import LoansScreen from '../screens/LoansScreen';
import LoanDetailScreen from '../screens/LoanDetailScreen';
import AddLoanScreen from '../screens/AddLoanScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { LoadingScreen } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/constants';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label }) {
  const icons = { Home: '🏠', Customers: '👥', Loans: '💰', Settings: '⚙️' };
  return <Text style={{ fontSize: 20 }}>{icons[label] || '•'}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: () => <TabIcon label={route.name} />,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Customers" component={CustomersScreen} />
      <Tab.Screen name="Loans" component={LoansScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="AddCustomer" component={AddCustomerScreen} options={{ title: 'Customer' }} />
      <Stack.Screen name="AddLoan" component={AddLoanScreen} options={{ title: 'New Loan' }} />
      <Stack.Screen name="LoanDetail" component={LoanDetailScreen} options={{ title: 'Loan Details' }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { shopkeeper, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return shopkeeper ? <AppStack /> : <AuthStack />;
}
