import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StatCard, LoadingScreen } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { COLORS, formatCurrency } from '../utils/constants';

export default function DashboardScreen() {
  const { shopkeeper } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.getDashboard();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

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

      <View style={styles.grid}>
        <StatCard label="Active Loans" value={String(stats?.active_loans || 0)} />
        <StatCard label="Customers" value={String(stats?.total_customers || 0)} color={COLORS.secondary} />
        <StatCard label="Total Principal" value={formatCurrency(stats?.total_principal)} />
        <StatCard
          label="Accrued Interest"
          value={formatCurrency(stats?.total_accrued_interest)}
          color={COLORS.error}
        />
        <StatCard
          label="Jewelry Value"
          value={formatCurrency(stats?.total_jewelry_value)}
          color={COLORS.success}
        />
      </View>

      <View style={styles.rates}>
        <Text style={styles.ratesTitle}>Current Rates</Text>
        <Text style={styles.rateRow}>🥇 Gold: {formatCurrency(stats?.gold_rate_per_gram)}/g</Text>
        <Text style={styles.rateRow}>🥈 Silver: {formatCurrency(stats?.silver_rate_per_gram)}/g</Text>
        <Text style={styles.hint}>Update rates in Settings</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, paddingTop: 10 },
  greeting: { fontSize: 20, fontWeight: '600', color: COLORS.text },
  shopName: { fontSize: 14, color: COLORS.primary, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  rates: {
    margin: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  ratesTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  rateRow: { fontSize: 15, marginBottom: 6, color: COLORS.text },
  hint: { fontSize: 12, color: COLORS.textLight, marginTop: 8 },
});
