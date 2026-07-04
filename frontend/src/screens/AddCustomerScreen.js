import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button, Input } from '../components/UI';
import { api } from '../api/client';
import { COLORS } from '../utils/constants';

export default function AddCustomerScreen({ navigation, route }) {
  const existing = route.params?.customer;
  const [form, setForm] = useState({
    name: existing?.name || '',
    phone: existing?.phone || '',
    whatsapp: existing?.whatsapp || '',
    address: existing?.address || '',
  });
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.name || !form.phone) {
      Alert.alert('Error', 'Name and phone are required');
      return;
    }
    setLoading(true);
    try {
      if (existing) {
        await api.updateCustomer(existing.id, form);
      } else {
        await api.createCustomer(form);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
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
        <Input label="Customer Name *" value={form.name} onChangeText={(v) => update('name', v)} />
        <Input
          label="Phone *"
          value={form.phone}
          onChangeText={(v) => update('phone', v)}
          keyboardType="phone-pad"
        />
        <Input
          label="WhatsApp Number"
          value={form.whatsapp}
          onChangeText={(v) => update('whatsapp', v)}
          keyboardType="phone-pad"
          placeholder="Same as phone if empty"
        />
        <Input
          label="Address"
          value={form.address}
          onChangeText={(v) => update('address', v)}
          multiline
        />
        <Button title={existing ? 'Update Customer' : 'Save Customer'} onPress={handleSave} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16 },
});
