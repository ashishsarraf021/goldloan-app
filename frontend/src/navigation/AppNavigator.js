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
import OrdersScreen from '../screens/OrderScreen'; 
import AddOrderScreen from '../screens/AddOrderScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import OrderPaymentScreen from '../screens/OrderPaymentScreen';
import OrderSettlementScreen from '../screens/OrderSettlementScreen';
import { LoadingScreen } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/constants';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label }) {
  const icons = { Home: '📊', Orders: '📦', Loans: '🔒', Customers: '👥', Settings: '⚙️' };
  return <Text style={{ fontSize: 20 }}>{icons[label] || '•'}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: () => <TabIcon label={route.name} />,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        headerStyle: { backgroundColor: COLORS.white },
        headerTintColor: COLORS.text,
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Loans" component={LoansScreen} />
      <Tab.Screen name="Customers" component={CustomersScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.white },
        headerTintColor: COLORS.text,
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="AddCustomer" component={AddCustomerScreen} options={{ title: 'Customer' }} />
      <Stack.Screen name="AddLoan" component={AddLoanScreen} options={{ title: 'New Loan' }} />
      <Stack.Screen name="LoanDetail" component={LoanDetailScreen} options={{ title: 'Loan Details' }} />
      <Stack.Screen name="AddOrder" component={AddOrderScreen} options={{ title: 'New Order' }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Details' }} />
      <Stack.Screen name="OrderPayment" component={OrderPaymentScreen} options={{ title: 'Add Payment' }} />
      <Stack.Screen name="OrderSettlement" component={OrderSettlementScreen} options={{ title: 'Final Bill' }} />
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