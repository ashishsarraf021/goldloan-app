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
import { COLORS } from '../utils/constants';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    shop_name: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Register Shop</Text>
        <Input label="Your Name *" value={form.name} onChangeText={(v) => update('name', v)} />
        <Input
          label="Shop Name *"
          value={form.shop_name}
          onChangeText={(v) => update('shop_name', v)}
        />
        <Input
          label="Phone *"
          value={form.phone}
          onChangeText={(v) => update('phone', v)}
          keyboardType="phone-pad"
        />
        <Input
          label="Email"
          value={form.email}
          onChangeText={(v) => update('email', v)}
          keyboardType="email-address"
        />
        <Input
          label="Password *"
          value={form.password}
          onChangeText={(v) => update('password', v)}
          secureTextEntry
        />
        <Button title="Register" onPress={handleRegister} loading={loading} />
        <Button title="Back to Login" variant="outline" onPress={() => navigation.goBack()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.secondary, marginBottom: 24 },
});
