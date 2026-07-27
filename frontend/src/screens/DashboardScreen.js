import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StatCard, LoadingScreen, Button, Badge, Card } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { COLORS, RADIUS, formatCurrency } from '../utils/constants';

export default function DashboardScreen({ navigation }) {
  const { shopkeeper } = useAuth();
  const [stats, setStats] = useState(null);
  const [liveRates, setLiveRates] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applying, setApplying] = useState(false);

  const load = async () => {
    try {
      const data = await api.getDashboard();
      setStats(data);
      api.getLiveRates().then(setLiveRates).catch(() => {});
      api.getOrders().then((o) => setRecentOrders(o.slice(0, 2))).catch(() => setRecentOrders([]));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyLiveRate = async () => {
    if (!liveRates) return;
    setApplying(true);
    try {
      await api.updateProfile({
        gold_rate_per_gram: liveRates.gold_rate_per_gram,
        silver_rate_per_gram: liveRates.silver_rate_per_gram,
      });
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setApplying(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, {shopkeeper?.name}</Text>
        <Text style={styles.shopName}>{shopkeeper?.shop_name}</Text>
      </View>

      {liveRates && (
        <Card style={styles.rateBanner}>
          <View style={styles.rateBannerHeader}>
            <View style={styles.liveDotRow}>
              <View style={styles.liveDot} />
              <Text style={styles.rateBannerTitle}>Live Market Gold & Silver</Text>
            </View>
          </View>

          <View style={styles.rateGrid}>
            <View style={styles.rateBox}>
              <Text style={styles.rateBoxLabel}>🥇 Gold 24K</Text>
              <Text style={styles.rateBoxValue}>{formatCurrency(liveRates.gold_rate_per_gram)}<Text style={styles.rateUnit}>/g</Text></Text>
            </View>
            <View style={styles.rateBox}>
              <Text style={styles.rateBoxLabel}>🥈 Silver</Text>
              <Text style={styles.rateBoxValue}>{formatCurrency(liveRates.silver_rate_per_gram)}<Text style={styles.rateUnit}>/g</Text></Text>
            </View>
          </View>

          <View style={styles.rateFooter}>
            <Text style={styles.shopRateText}>Shop Rate: <Text style={styles.shopRateBold}>{formatCurrency(stats?.gold_rate_per_gram)}/g</Text></Text>
            <TouchableOpacity onPress={applyLiveRate} disabled={applying} style={styles.syncBtn}>
              <Text style={styles.syncBtnText}>{applying ? 'Syncing...' : '↻ Sync Shop Rate'}</Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Shop Overview</Text>
      </View>
      <View style={styles.grid}>
        <StatCard label="Active Loans" value={String(stats?.active_loans || 0)} icon="🔒" sub={`Principal: ${formatCurrency(stats?.total_principal)}`} />
        <StatCard label="Active Orders" value={String(recentOrders.length)} icon="📦" sub="Pre-orders & Ready-made" accent />
        <StatCard label="Total Borrowers" value={String(stats?.total_customers || 0)} icon="👥" sub="Verified contacts" />
        <StatCard label="Accrued Interest" value={formatCurrency(stats?.total_accrued_interest)} icon="📈" sub="Calculated live" />
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Quick Actions</Text>
      </View>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionPrimary} onPress={() => navigation.navigate('AddOrder')}>
          <Text style={styles.actionPrimaryText}>+ New Custom Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionOutline} onPress={() => navigation.navigate('AddLoan')}>
          <Text style={styles.actionOutlineText}>🤝 Issue Gold Loan</Text>
        </TouchableOpacity>
      </View>

      {recentOrders.length > 0 && (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Recent Custom Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          {recentOrders.map((ord) => (
            <Card key={ord.id} style={{ marginBottom: 10 }}>
              <View style={styles.orderRowTop}>
                <View>
                  <Text style={styles.orderId}>{ord.id}</Text>
                  <Text style={styles.orderTitle}>{ord.customer_name} · {ord.category}</Text>
                </View>
                <Badge label={ord.status} tone={ord.status === 'Ready for Delivery' ? 'success' : 'amber'} />
              </View>
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, paddingTop: 16 },
  greeting: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  shopName: { fontSize: 14, color: COLORS.primary, marginTop: 4, fontWeight: '600' },

  rateBanner: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#FFFBEB', borderColor: COLORS.amberBorder },
  rateBannerHeader: { marginBottom: 10 },
  liveDotRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success },
  rateBannerTitle: { fontSize: 11, fontWeight: '800', color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  rateGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  rateBox: { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: 10, borderWidth: 1, borderColor: COLORS.amberBorder },
  rateBoxLabel: { fontSize: 11, fontWeight: '700', color: '#92400E', marginBottom: 3 },
  rateBoxValue: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  rateUnit: { fontSize: 11, fontWeight: '400', color: COLORS.textLight },
  rateFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shopRateText: { fontSize: 11, color: COLORS.textLight },
  shopRateBold: { color: '#92400E', fontWeight: '700' },
  syncBtn: { backgroundColor: '#FDE68A', paddingVertical: 6, paddingHorizontal: 10, borderRadius: RADIUS.sm },
  syncBtnText: { fontSize: 11, fontWeight: '700', color: '#92400E' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 4, marginBottom: 10 },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  viewAllLink: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 8 },

  actionsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  actionPrimary: { flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: 14, alignItems: 'center' },
  actionPrimaryText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  actionOutline: { flex: 1, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 14, alignItems: 'center' },
  actionOutlineText: { color: COLORS.text, fontWeight: '700', fontSize: 12 },

  orderRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: 10, fontWeight: '700', color: '#92400E', fontFamily: 'monospace' },
  orderTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 2 },
});