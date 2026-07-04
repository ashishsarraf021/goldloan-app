import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { EmptyState, LoadingScreen } from '../components/UI';
import { api } from '../api/client';
import { COLORS, formatCurrency, formatDate } from '../utils/constants';

export default function LoansScreen({ navigation }) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('active');

  const load = async () => {
    try {
      const data = await api.getLoans(filter);
      setLoans(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [filter])
  );

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        {['active', 'closed', ''].map((f) => (
          <TouchableOpacity
            key={f || 'all'}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={loans}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
        }
        ListEmptyComponent={<EmptyState message="No loans found." />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('LoanDetail', { loanId: item.id })}
          >
            <View style={styles.row}>
              <Text style={styles.loanNo}>{item.loan_number}</Text>
              <View style={[styles.badge, item.status === 'active' ? styles.badgeActive : styles.badgeClosed]}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.customer}>{item.customer?.name || 'Customer'}</Text>
            <Text style={styles.amount}>{formatCurrency(item.principal_amount)} @ {item.interest_rate}%</Text>
            <Text style={styles.date}>Loan Date: {formatDate(item.loan_date)}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddLoan')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filters: { flexDirection: 'row', padding: 12, gap: 8 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, color: COLORS.text },
  filterTextActive: { color: COLORS.white },
  item: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  loanNo: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeActive: { backgroundColor: '#E8F5E9' },
  badgeClosed: { backgroundColor: '#FFEBEE' },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  customer: { fontSize: 16, fontWeight: '600', marginTop: 6 },
  amount: { fontSize: 14, color: COLORS.text, marginTop: 4 },
  date: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  fabText: { color: COLORS.white, fontSize: 28, fontWeight: '300' },
});
