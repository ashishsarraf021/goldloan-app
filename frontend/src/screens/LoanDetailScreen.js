import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card, LoadingScreen } from '../components/UI';
import { api } from '../api/client';
import { COLORS, formatCurrency, formatDate } from '../utils/constants';

export default function LoanDetailScreen({ route }) {
  const { loanId } = route.params;
  const [loan, setLoan] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [loanData, summaryData] = await Promise.all([
        api.getLoan(loanId),
        api.getLoanSummary(loanId),
      ]);
      setLoan(loanData);
      setSummary(summaryData);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [loanId]));

  const sendWhatsApp = async () => {
    Alert.alert(
      'Send WhatsApp Update',
      'Send current interest and jewelry value update to customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setSending(true);
            try {
              await api.sendReminder(loanId);
              Alert.alert('Success', 'WhatsApp update sent to customer');
              load();
            } catch (err) {
              Alert.alert('Error', err.message);
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  const closeLoan = async () => {
    Alert.alert('Close Loan', 'Mark this loan as closed/repaid?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close',
        onPress: async () => {
          try {
            await api.updateLoan(loanId, { status: 'closed' });
            load();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <Card>
        <Text style={styles.loanNo}>{loan?.loan_number}</Text>
        <Text style={styles.customer}>{loan?.customer?.name}</Text>
        <Text style={styles.phone}>📞 {loan?.customer?.phone}</Text>
        <Text style={styles.status}>Status: {loan?.status}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Loan Summary</Text>
        <Row label="Principal" value={formatCurrency(summary?.principal_amount)} />
        <Row label="Interest Rate" value={`${summary?.interest_rate}% (${summary?.interest_type})`} />
        <Row label="Loan Date" value={formatDate(summary?.loan_date)} />
        <Row label="Months Elapsed" value={String(summary?.months_elapsed?.toFixed(1) || 0)} />
        <Row label="Accrued Interest" value={formatCurrency(summary?.accrued_interest)} highlight />
        <Row label="Total Payable" value={formatCurrency(summary?.total_payable)} highlight />
        <Row label="Jewelry Value" value={formatCurrency(summary?.jewelry_current_value)} highlight />
      </Card>

      {summary?.jewelry_items?.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Jewelry Items</Text>
          {summary.jewelry_items.map((item, i) => (
            <View key={item.id || i} style={styles.jewelryItem}>
              <Text style={styles.jewelryDesc}>{item.description}</Text>
              <Text style={styles.jewelryMeta}>
                {item.metal_type} • {item.weight_grams}g • {item.purity || 'N/A'}
              </Text>
              <Text style={styles.jewelryValue}>{formatCurrency(item.value)}</Text>
            </View>
          ))}
        </Card>
      )}

      {loan?.status === 'active' && (
        <>
          <Button title="Send WhatsApp Update" onPress={sendWhatsApp} loading={sending} />
          <Button title="Close Loan" variant="outline" onPress={closeLoan} />
        </>
      )}
    </ScrollView>
  );
}

function Row({ label, value, highlight }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.highlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  loanNo: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  customer: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  phone: { fontSize: 14, color: COLORS.textLight, marginTop: 2 },
  status: { fontSize: 13, marginTop: 6, textTransform: 'capitalize' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { fontSize: 14, color: COLORS.textLight },
  rowValue: { fontSize: 14, fontWeight: '500' },
  highlight: { color: COLORS.primary, fontWeight: '700' },
  jewelryItem: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingVertical: 10 },
  jewelryDesc: { fontSize: 15, fontWeight: '500' },
  jewelryMeta: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  jewelryValue: { fontSize: 14, fontWeight: '600', color: COLORS.success, marginTop: 4 },
});
