import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, LoadingScreen, Badge, Button } from '../components/UI';
import { api } from '../api/client';
import { COLORS, RADIUS, formatCurrency, formatDate } from '../utils/constants';

export default function OrderDetailScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.getOrder(orderId);
      setOrder(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [orderId]));

  if (loading) return <LoadingScreen />;
  if (!order) return null;

  const totalPaid = (order.payments || []).reduce((sum, p) => sum + p.amount_inr, 0);
  const remaining = (order.final_bill_amount || order.approx_budget) - totalPaid;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Card style={{ marginBottom: 12 }}>
        <View style={styles.topRow}>
          {order.reference_image ? (
            <Image source={{ uri: order.reference_image }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={{ fontSize: 28 }}>💍</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.orderNumber}>{order.order_number}</Text>
            <Text style={styles.customerName}>{order.customer_name}</Text>
            <Text style={styles.phone}>📞 {order.customer_phone}</Text>
          </View>
          <Badge label={order.status} tone={order.status === 'Settled' ? 'success' : order.status === 'Ready for Delivery' ? 'amber' : 'default'} />
        </View>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.sectionTitle}>Order Details</Text>
        <Row label="Category" value={order.category} />
        <Row label="Type" value={order.type} />
        <Row label="Order Date" value={formatDate(order.order_date)} />
        <Row label="Promised Delivery" value={order.promised_delivery_date ? formatDate(order.promised_delivery_date) : '—'} />
        <Row label="Approx Weight" value={`${order.approx_weight_grams} g`} />
        <Row label="Approx Budget" value={formatCurrency(order.approx_budget)} />
        <Row label="Locked Market Rate" value={`${formatCurrency(order.locked_market_rate)}/g`} highlight />
      </Card>

      {order.final_bill_amount != null && (
        <Card style={{ marginBottom: 12, backgroundColor: COLORS.successLight, borderColor: '#A7F3D0' }}>
          <Text style={styles.sectionTitle}>Final Bill</Text>
          <Row label="Final Actual Weight" value={`${order.final_actual_weight_grams} g`} />
          <Row label="Final Bill Amount" value={formatCurrency(order.final_bill_amount)} highlight />
        </Card>
      )}

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.sectionTitle}>Payment History</Text>
        {(order.payments || []).length === 0 && (
          <Text style={styles.noPayments}>No payments recorded yet.</Text>
        )}
        {(order.payments || []).map((p) => (
          <View key={p.id} style={styles.paymentRow}>
            <View>
              <Text style={styles.paymentType}>{p.type}</Text>
              <Text style={styles.paymentDate}>{formatDate(p.date)}</Text>
              {p.gold_grams != null && (
                <Text style={styles.paymentNote}>{p.gold_grams}g @ {formatCurrency(p.rate_at_payment_date)}/g</Text>
              )}
              {p.note ? <Text style={styles.paymentNote}>{p.note}</Text> : null}
            </View>
            <Text style={styles.paymentAmount}>{formatCurrency(p.amount_inr)}</Text>
          </View>
        ))}

        <View style={styles.totalsBox}>
          <Row label="Total Received" value={formatCurrency(totalPaid)} />
          <Row label="Remaining Due" value={formatCurrency(remaining > 0 ? remaining : 0)} highlight />
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button
          title="+ Add Payment"
          variant="outline"
          style={{ flex: 1 }}
          onPress={() => navigation.navigate('OrderPayment', { orderId: order.id })}
        />
        {order.status !== 'Settled' && (
          <Button
            title="Final Bill"
            variant="success"
            style={{ flex: 1 }}
            onPress={() => navigation.navigate('OrderSettlement', { orderId: order.id })}
          />
        )}
      </View>
    </ScrollView>
  );
}

function Row({ label, value, highlight }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  image: { width: 56, height: 56, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  imagePlaceholder: { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  orderNumber: { fontSize: 10, fontWeight: '700', color: '#92400E', fontFamily: 'monospace' },
  customerName: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 2 },
  phone: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontSize: 13, color: COLORS.textLight },
  rowValue: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  rowValueHighlight: { color: COLORS.primary, fontWeight: '800' },
  noPayments: { fontSize: 13, color: COLORS.textLight, fontStyle: 'italic' },
  paymentRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  paymentType: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  paymentDate: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  paymentNote: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  paymentAmount: { fontSize: 14, fontWeight: '800', color: COLORS.success },
  totalsBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
});