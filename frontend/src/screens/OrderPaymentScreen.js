import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Input, Button, Card } from '../components/UI';
import { api } from '../api/client';
import { COLORS, RADIUS, formatCurrency } from '../utils/constants';

export default function OrderPaymentScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [paymentType, setPaymentType] = useState('Cash'); // 'Cash' | 'Gold'
  const [amountINR, setAmountINR] = useState('');
  const [goldGrams, setGoldGrams] = useState('');
  const [note, setNote] = useState('');
  const [liveRate, setLiveRate] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getLiveRates().then(setLiveRate).catch(() => {});
  }, []);

  const estimatedGoldValue =
    paymentType === 'Gold' && liveRate && goldGrams
      ? parseFloat(goldGrams) * liveRate.gold_rate_per_gram
      : null;

  const handleSave = async () => {
    if (paymentType === 'Cash' && !amountINR) {
      Alert.alert('Error', 'Enter the cash amount');
      return;
    }
    if (paymentType === 'Gold' && !goldGrams) {
      Alert.alert('Error', 'Enter the gold weight in grams');
      return;
    }
    setLoading(true);
    try {
      await api.addOrderPayment(orderId, {
        type: paymentType,
        amount_inr: parseFloat(amountINR) || 0,
        gold_grams: parseFloat(goldGrams) || 0,
        note,
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
      <Text style={styles.label}>Payment Event Type</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeChip, paymentType === 'Cash' && styles.typeChipActive]}
          onPress={() => setPaymentType('Cash')}
        >
          <Text style={[styles.typeChipText, paymentType === 'Cash' && styles.typeChipTextActive]}>
            Cash Installment (₹)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeChip, paymentType === 'Gold' && styles.typeChipActive]}
          onPress={() => setPaymentType('Gold')}
        >
          <Text style={[styles.typeChipText, paymentType === 'Gold' && styles.typeChipTextActive]}>
            Gold Advance (grams)
          </Text>
        </TouchableOpacity>
      </View>

      {paymentType === 'Cash' ? (
        <Input
          label="Amount (₹)"
          value={amountINR}
          onChangeText={setAmountINR}
          keyboardType="numeric"
          placeholder="e.g. 15000"
        />
      ) : (
        <>
          <Input
            label="Gold Weight (grams)"
            value={goldGrams}
            onChangeText={setGoldGrams}
            keyboardType="numeric"
            placeholder="e.g. 2.5"
          />
          {liveRate && (
            <Card style={styles.infoBox}>
              <Text style={styles.infoText}>
                🛈 Gold advances are valued using the live market rate at the moment this payment is
                recorded (₹{liveRate.gold_rate_per_gram}/g) — not the original order date.
              </Text>
              {estimatedGoldValue != null && (
                <Text style={styles.estimateText}>
                  Estimated value: {formatCurrency(estimatedGoldValue)}
                </Text>
              )}
            </Card>
          )}
        </>
      )}

      <Input label="Note" value={note} onChangeText={setNote} placeholder="Optional note" multiline />

      <Button title="Save Payment Record" onPress={handleSave} loading={loading} variant="success" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeChip: {
    flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: COLORS.border, backgroundColor: COLORS.white, alignItems: 'center',
  },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  typeChipTextActive: { color: COLORS.white },
  infoBox: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.amberBorder, marginBottom: 12 },
  infoText: { fontSize: 11, color: '#92400E', lineHeight: 16 },
  estimateText: { fontSize: 13, fontWeight: '800', color: '#92400E', marginTop: 8 },
});