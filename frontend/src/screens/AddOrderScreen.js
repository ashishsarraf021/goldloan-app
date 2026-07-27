import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Text } from 'react-native';
import { Input, Button } from '../components/UI';
import CustomerSearchInput from '../components/CustomerSearchInput';
import CategoryPicker from '../components/CategoryPicker';
import { api } from '../api/client';
import { COLORS, RADIUS, formatCurrency } from '../utils/constants';

export default function AddOrderScreen({ navigation }) {
  const [customer, setCustomer] = useState(null);
  const [category, setCategory] = useState('');
  const [orderType, setOrderType] = useState('Pre-Order');
  const [approxWeight, setApproxWeight] = useState('');
  const [approxBudget, setApproxBudget] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [advanceCash, setAdvanceCash] = useState('');
  const [liveRate, setLiveRate] = useState(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    api.getLiveRates().then(setLiveRate).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!customer || !category) {
      Alert.alert('Error', 'Select a customer and category');
      return;
    }
    setLoading(true);
    try {
      await api.createOrder({
        customer_id: customer.id,
        category,
        type: orderType,
        approx_weight_grams: parseFloat(approxWeight) || 0,
        approx_budget: parseFloat(approxBudget) || 0,
        promised_delivery_date: deliveryDate || undefined,
        initial_advance_cash: parseFloat(advanceCash) || 0,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={{ marginBottom: 16 }}>
        <CustomerSearchInput selectedCustomer={customer} onSelect={setCustomer} />
      </View>

      <CategoryPicker value={category} onChange={setCategory} />

      <Text style={styles.label}>Order Type</Text>
      <View style={styles.typeRow}>
        {['Pre-Order', 'Ready-Made'].map((t) => (
          <Text
            key={t}
            onPress={() => setOrderType(t)}
            style={[styles.typeChip, orderType === t && styles.typeChipActive]}
          >
            {t}
          </Text>
        ))}
      </View>

      {liveRate && (
        <View style={styles.lockBanner}>
          <Text style={styles.lockText}>🔒 Price Lock Trigger Rate:</Text>
          <Text style={styles.lockValue}>{formatCurrency(liveRate.gold_rate_per_gram)}/g</Text>
        </View>
      )}

      <Input label="Approx Weight (g)" value={approxWeight} onChangeText={setApproxWeight} keyboardType="numeric" />
      <Input label="Approx Budget (₹)" value={approxBudget} onChangeText={setApproxBudget} keyboardType="numeric" />
      <Input label="Promised Delivery Date (YYYY-MM-DD)" value={deliveryDate} onChangeText={setDeliveryDate} />
      <Input label="Initial Cash Advance (₹)" value={advanceCash} onChangeText={setAdvanceCash} keyboardType="numeric" />

      <Button title="Lock Price & Save Order" onPress={handleSave} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeChip: {
    flex: 1, textAlign: 'center', paddingVertical: 10, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white, fontSize: 12, fontWeight: '600', color: COLORS.text,
    overflow: 'hidden',
  },
  typeChipActive: { backgroundColor: COLORS.primary, color: COLORS.white, borderColor: COLORS.primary },
  lockBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.amberBorder,
    borderRadius: RADIUS.md, padding: 12, marginBottom: 16,
  },
  lockText: { fontSize: 12, color: '#92400E', fontWeight: '600' },
  lockValue: { fontSize: 13, fontWeight: '800', color: '#92400E' },
});