import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Input, Button, Card } from '../components/UI';
import { api } from '../api/client';
import { COLORS, formatCurrency } from '../utils/constants';

export default function OrderSettlementScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [finalWeight, setFinalWeight] = useState('');
  const [finalBill, setFinalBill] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api.getOrder(orderId).then((data) => {
      setOrder(data);
      setFinalWeight(String(data.approx_weight_grams || ''));
      setFinalBill(String(data.approx_budget || ''));
    }).catch(console.error).finally(() => setFetching(false));
  }, [orderId]);

  const totalPaid = order ? (order.payments || []).reduce((sum, p) => sum + p.amount_inr, 0) : 0;
  const finalBillNum = parseFloat(finalBill) || 0;
  const netDue = finalBillNum - totalPaid;

  const handleSettle = async () => {
    if (!finalBill) {
      Alert.alert('Error', 'Enter the final agreed bill amount');
      return;
    }
    setLoading(true);
    try {
      await api.settleOrder(orderId, {
        final_actual_weight_grams: parseFloat(finalWeight) || 0,
        final_bill_amount: finalBillNum,
      });
      navigation.navigate('Orders');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching || !order) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Generate Final Bill & Settle</Text>
      <Text style={styles.orderNumber}>{order.order_number}</Text>

      <Input
        label="Final Actual Weight (g)"
        value={finalWeight}
        onChangeText={setFinalWeight}
        keyboardType="numeric"
      />
      <Input
        label="Final Agreed Bill (₹)"
        value={finalBill}
        onChangeText={setFinalBill}
        keyboardType="numeric"
      />

      <Card style={styles.summaryBox}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Total Agreed Price</Text>
          <Text style={styles.rowValue}>{formatCurrency(finalBillNum)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabelPaid}>Less: Advances & Payments</Text>
          <Text style={styles.rowValuePaid}>- {formatCurrency(totalPaid)}</Text>
        </View>
        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.totalLabel}>Final Net Due to Pay</Text>
          <Text style={styles.totalValue}>{formatCurrency(netDue > 0 ? netDue : 0)}</Text>
        </View>
      </Card>

      <Button
        title="Confirm Settlement & Close Order"
        variant="success"
        onPress={handleSettle}
        loading={loading}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  orderNumber: { fontSize: 11, fontWeight: '700', color: '#92400E', marginBottom: 16, fontFamily: 'monospace' },
  summaryBox: { marginVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontSize: 13, color: COLORS.text },
  rowValue: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  rowLabelPaid: { fontSize: 13, color: COLORS.success },
  rowValuePaid: { fontSize: 13, fontWeight: '700', color: COLORS.success },
  totalRow: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  totalValue: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
});