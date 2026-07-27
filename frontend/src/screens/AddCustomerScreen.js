import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Input, Button } from '../components/UI';
import { api } from '../api/client';
import { COLORS } from '../utils/constants';

export default function AddCustomerScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', phone: '', whatsapp: '', address: '' });
  const [loading, setLoading] = useState(false);
  const update = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.name || !form.phone) {
      Alert.alert('Error', 'Name and phone are required');
      return;
    }
    setLoading(true);
    try {
      await api.createCustomer(form);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Input label="Full Name *" value={form.name} onChangeText={update('name')} placeholder="Customer name" />
      <Input label="Phone *" value={form.phone} onChangeText={update('phone')} keyboardType="phone-pad" placeholder="10-digit mobile" />
      <Input label="WhatsApp" value={form.whatsapp} onChangeText={update('whatsapp')} keyboardType="phone-pad" placeholder="Same as phone if blank" />
      <Input label="Address" value={form.address} onChangeText={update('address')} multiline placeholder="Shop / home address" />
      <Button title="Save Customer" onPress={handleSave} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});