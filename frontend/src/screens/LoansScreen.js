import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, LoadingScreen, FilterTabs, Badge } from '../components/UI';
import { api } from '../api/client';
import { COLORS, RADIUS, formatCurrency, formatDate } from '../utils/constants';

export default function LoansScreen({ navigation }) {
  const [loans, setLoans] = useState([]);
  const [filter, setFilter] = useState('active');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.getLoans(filter === 'all' ? undefined : filter);
      setLoans(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [filter]));

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Gold Loan Portfolio</Text>
          <Text style={styles.subtitle}>Pledged jewelry & interest tracking</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddLoan')}>
          <Text style={styles.addBtnText}>+ Issue Loan</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
        <FilterTabs options={['active', 'closed', 'all']} value={filter} onChange={setFilter} />
      </View>

      <FlatList
        data={loans}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 12 }}>
            <View style={styles.rowTop}>
              <View>
                <Text style={styles.loanNumber}>{item.loan_number}</Text>
                <Text style={styles.customerName}>{item.customer?.name}</Text>
                <Text style={styles.loanDate}>Loan Date: {formatDate(item.loan_date)}</Text>
              </View>
              <Badge label={item.status} tone={item.status === 'active' ? 'success' : 'default'} />
            </View>

            <View style={styles.footerRow}>
              <View>
                <Text style={styles.footerLabel}>Principal @ Interest</Text>
                <Text style={styles.footerValue}>{formatCurrency(item.principal_amount)} <Text style={styles.footerAccent}>@ {item.interest_rate}%</Text></Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.waBtn}
                onPress={() => Linking.openURL(`https://wa.me/${item.customer?.whatsapp || item.customer?.phone}`)}
              >
                <Text style={styles.waBtnText}>💬 Send Reminder</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.detailBtn} onPress={() => navigation.navigate('LoanDetail', { loanId: item.id })}>
                <Text style={styles.detailBtnText}>Full Summary</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 0 },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  addBtn: { backgroundColor: COLORS.primary, paddingVertical: 9, paddingHorizontal: 14, borderRadius: RADIUS.md },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  loanNumber: { fontSize: 10, fontWeight: '700', color: '#92400E' },
  customerName: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  loanDate: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  footerRow: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10, marginBottom: 10 },
  footerLabel: { fontSize: 10, color: COLORS.textLight },
  footerValue: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  footerAccent: { fontSize: 12, color: COLORS.primary },
  actionsRow: { flexDirection: 'row', gap: 8 },
  waBtn: { flex: 1, backgroundColor: COLORS.successLight, borderWidth: 1, borderColor: '#A7F3D0', paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center' },
  waBtnText: { fontSize: 12, fontWeight: '700', color: '#065F46' },
  detailBtn: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#F1F5F9', borderRadius: RADIUS.md, alignItems: 'center' },
  detailBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.text },
});