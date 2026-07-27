import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, LoadingScreen, Badge } from '../components/UI';
import { api } from '../api/client';
import { COLORS, RADIUS, formatCurrency } from '../utils/constants';

const STATUS_TABS = ['ALL', 'Pending', 'In Progress', 'Ready for Delivery', 'Settled'];

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.getOrders(filter);
      setOrders(data || []);
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [filter]));

  const totalPaid = (order) => (order.payments || []).reduce((sum, p) => sum + p.amount_inr, 0);

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Custom & Ready-Made Orders</Text>
          <Text style={styles.subtitle}>Price lock, advances & installments</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddOrder')}>
          <Text style={styles.addBtnText}>+ New Order</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
        {STATUS_TABS.map((st) => (
          <TouchableOpacity
            key={st}
            style={[styles.tab, filter === st && styles.tabActive]}
            onPress={() => setFilter(st)}
          >
            <Text style={[styles.tabText, filter === st && styles.tabTextActive]}>{st}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No orders yet — create one to get started.</Text>}
        renderItem={({ item }) => {
          const paid = totalPaid(item);
          const remaining = (item.final_bill_amount || item.approx_budget) - paid;
          return (
            <Card style={{ marginBottom: 12 }}>
              <View style={styles.rowTop}>
                <View style={styles.rowLeft}>
                  {item.reference_image ? (
                    <Image source={{ uri: item.reference_image }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.thumbPlaceholder]}>
                      <Text>💍</Text>
                    </View>
                  )}
                  <View>
                    <View style={styles.idRow}>
                      <Text style={styles.orderId}>{item.id}</Text>
                      <Badge label={item.type} tone={item.type === 'Pre-Order' ? 'sky' : 'purple'} />
                    </View>
                    <Text style={styles.customerName}>{item.customer_name}</Text>
                    <Text style={styles.categoryText}>{item.category} · ~{item.approx_weight_grams}g approx</Text>
                  </View>
                </View>
                <Badge label={item.status} tone={item.status === 'Settled' ? 'success' : item.status === 'Ready for Delivery' ? 'amber' : 'default'} />
              </View>

              <View style={styles.priceBox}>
                <View style={styles.rowBetween}>
                  <Text style={styles.priceLabel}>🔒 Locked Rate Trigger:</Text>
                  <Text style={styles.priceValue}>{formatCurrency(item.locked_market_rate)}/g</Text>
                </View>
                <View style={[styles.rowBetween, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border }]}>
                  <View>
                    <Text style={styles.smallLabel}>Total Received</Text>
                    <Text style={styles.paidValue}>{formatCurrency(paid)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.smallLabel}>Remaining Due</Text>
                    <Text style={styles.dueValue}>{formatCurrency(remaining > 0 ? remaining : 0)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.paymentBtn}
                  onPress={() => navigation.navigate('OrderPayment', { orderId: item.id })}
                >
                  <Text style={styles.paymentBtnText}>+ Add Payment</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.detailBtn}
                  onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
                >
                  <Text style={styles.detailBtnText}>Details</Text>
                </TouchableOpacity>
                {item.status !== 'Settled' && (
                  <TouchableOpacity
                    style={styles.settleBtn}
                    onPress={() => navigation.navigate('OrderSettlement', { orderId: item.id })}
                  >
                    <Text style={styles.settleBtnText}>Final Bill</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, paddingBottom: 0 },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  addBtn: { backgroundColor: COLORS.primary, paddingVertical: 9, paddingHorizontal: 12, borderRadius: RADIUS.md },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 11 },
  tabsRow: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: RADIUS.md, padding: 4, marginHorizontal: 16, marginTop: 14 },
  tab: { flex: 1, paddingVertical: 7, borderRadius: RADIUS.sm, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.white },
  tabText: { fontSize: 9, fontWeight: '600', color: COLORS.textLight },
  tabTextActive: { color: COLORS.text, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: COLORS.textLight, marginTop: 40, fontSize: 13 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  rowLeft: { flexDirection: 'row', gap: 10, flex: 1 },
  thumb: { width: 48, height: 48, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  thumbPlaceholder: { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderId: { fontSize: 10, fontWeight: '700', color: '#92400E', fontFamily: 'monospace' },
  customerName: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  categoryText: { fontSize: 11, color: COLORS.textLight, marginTop: 1 },
  priceBox: { backgroundColor: '#F8FAFC', borderRadius: RADIUS.md, padding: 10, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '600' },
  priceValue: { fontSize: 12, fontWeight: '800', color: '#92400E' },
  smallLabel: { fontSize: 10, color: COLORS.textMuted },
  paidValue: { fontSize: 13, fontWeight: '700', color: COLORS.success },
  dueValue: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  actionsRow: { flexDirection: 'row', gap: 8 },
  paymentBtn: { flex: 1, backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.amberBorder, paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center' },
  paymentBtnText: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  detailBtn: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#F1F5F9', borderRadius: RADIUS.md, alignItems: 'center' },
  detailBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.text },
  settleBtn: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: COLORS.success, borderRadius: RADIUS.md, alignItems: 'center' },
  settleBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.white },
});