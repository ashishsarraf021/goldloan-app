import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Input, Button } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { COLORS, RADIUS } from '../utils/constants';

export default function SettingsScreen() {
  const { shopkeeper, logout, refreshProfile } = useAuth();
  const [form, setForm] = useState({ name: '', shop_name: '', gold_rate_per_gram: '', silver_rate_per_gram: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (shopkeeper) {
      setForm({
        name: shopkeeper.name || '',
        shop_name: shopkeeper.shop_name || '',
        gold_rate_per_gram: String(shopkeeper.gold_rate_per_gram || ''),
        silver_rate_per_gram: String(shopkeeper.silver_rate_per_gram || ''),
      });
    }
  }, [shopkeeper]);

  const update = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

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
      Alert.alert('Saved', 'Shop settings updated');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Shop Profile & Rate Overrides</Text>
      <Text style={styles.subtitle}>Configure manual metal rates per gram</Text>

      <View style={styles.card}>
        <Input label="Shop Name" value={form.shop_name} onChangeText={update('shop_name')} />
        <Input label="Shopkeeper Name" value={form.name} onChangeText={update('name')} />

        <Text style={styles.sectionLabel}>Shop Metal Rate Overrides</Text>
        <Input label="Gold Rate (₹ / gram)" value={form.gold_rate_per_gram} onChangeText={update('gold_rate_per_gram')} keyboardType="numeric" />
        <Input label="Silver Rate (₹ / gram)" value={form.silver_rate_per_gram} onChangeText={update('silver_rate_per_gram')} keyboardType="numeric" />

        <Button title="Save Settings" onPress={handleSave} loading={loading} />
      </View>

      <Button title="Logout" variant="outline" onPress={logout} style={{ borderColor: COLORS.error, marginTop: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.textLight, marginTop: 4, marginBottom: 16 },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#92400E', textTransform: 'uppercase', marginTop: 8, marginBottom: 8 },
});