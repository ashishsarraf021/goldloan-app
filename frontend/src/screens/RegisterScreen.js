import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Button, Input } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS } from '../utils/constants';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '', shop_name: '', password: '' });
  const [loading, setLoading] = useState(false);

  const update = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.name || !form.phone || !form.shop_name || !form.password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Register Shop</Text>

        <View style={styles.card}>
          <Input label="Your Name *" value={form.name} onChangeText={update('name')} placeholder="Ashish" />
          <Input label="Shop Name *" value={form.shop_name} onChangeText={update('shop_name')} placeholder="Demo1 Jewels" />
          <Input label="Phone *" value={form.phone} onChangeText={update('phone')} keyboardType="phone-pad" placeholder="9876543210" />
          <Input label="Email" value={form.email} onChangeText={update('email')} keyboardType="email-address" placeholder="you@shop.com" />
          <Input label="Password *" value={form.password} onChangeText={update('password')} secureTextEntry placeholder="Choose a password" />

          <Button title="Register" onPress={handleRegister} loading={loading} />
          <Button title="Back to Login" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.secondary, marginBottom: 20, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
  },
});