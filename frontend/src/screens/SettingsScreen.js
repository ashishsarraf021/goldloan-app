import React, { useState } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { Button, Input } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { COLORS } from '../utils/constants';

export default function SettingsScreen() {
  const { shopkeeper, logout, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    name: shopkeeper?.name || '',
    shop_name: shopkeeper?.shop_name || '',
    gold_rate_per_gram: String(shopkeeper?.gold_rate_per_gram || ''),
    silver_rate_per_gram: String(shopkeeper?.silver_rate_per_gram || ''),
  });
  const [loading, setLoading] = useState(false);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.updateProfile({
        name: form.name,
        shop_name: form.shop_name,
        gold_rate_per_gram: parseFloat(form.gold_rate_per_gram),
        silver_rate_per_gram: parseFloat(form.silver_rate_per_gram),
      });
      await refreshProfile();
      Alert.alert('Success', 'Settings updated');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Input label="Your Name" value={form.name} onChangeText={(v) => update('name', v)} />
      <Input label="Shop Name" value={form.shop_name} onChangeText={(v) => update('shop_name', v)} />
      <Input
        label="Gold Rate (₹/gram)"
        value={form.gold_rate_per_gram}
        onChangeText={(v) => update('gold_rate_per_gram', v)}
        keyboardType="numeric"
      />
      <Input
        label="Silver Rate (₹/gram)"
        value={form.silver_rate_per_gram}
        onChangeText={(v) => update('silver_rate_per_gram', v)}
        keyboardType="numeric"
      />
      <Button title="Save Settings" onPress={handleSave} loading={loading} />
      <Button title="Logout" variant="outline" onPress={handleLogout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: COLORS.background, flexGrow: 1 },
});
