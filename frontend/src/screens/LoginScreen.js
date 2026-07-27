import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Button, Input } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS } from '../utils/constants';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Error', 'Please enter phone and password');
      return;
    }
    setLoading(true);
    try {
      await login(phone, password);
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandIcon}>💎</Text>
        </View>

        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Aureus</Text>
            <View style={styles.shopTag}>
              <Text style={styles.shopTagText}>GOLD SHOP</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Secure Loan & Custom Orders</Text>
        </View>

        <View style={styles.card}>
          <Input
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="9876543210"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter password"
          />

          <Button title="Login" onPress={handleLogin} loading={loading} />

          <Button
            title="Create New Account"
            variant="outline"
            onPress={() => navigation.navigate('Register')}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  brandBadge: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandIcon: { fontSize: 28 },
  header: { alignItems: 'center', marginBottom: 28 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.secondary, letterSpacing: -0.5 },
  shopTag: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: COLORS.amberBorder,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  shopTagText: { fontSize: 9, fontWeight: '800', color: '#92400E' },
  subtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 6 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
});