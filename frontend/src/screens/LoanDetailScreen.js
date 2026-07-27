import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Card, LoadingScreen, Badge } from '../components/UI';
import { api } from '../api/client';
import { COLORS, formatCurrency, formatDate } from '../utils/constants';

export default function LoanDetailScreen({ route }) {
  const { loanId } = route.params;
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLoanSummary(loanId).then(setSummary).catch(console.error).finally(() => setLoading(false));
  }, [loanId]);

  if (loading) return <LoadingScreen />;
  if (!summary) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.loanNumber}>{summary.loan_number}</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Principal</Text>
          <Text style={styles.value}>{formatCurrency(summary.principal_amount)}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Interest Rate</Text>
          <Text style={styles.value}>{summary.interest_rate}% ({summary.interest_type})</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Months Elapsed</Text>
          <Text style={styles.value}>{summary.months_elapsed}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Accrued Interest</Text>
          <Text style={[styles.value, { color: COLORS.success }]}>{formatCurrency(summary.accrued_interest)}</Text>
        </View>
        <View style={[styles.rowBetween, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Payable</Text>
          <Text style={styles.totalValue}>{formatCurrency(summary.total_payable)}</Text>
        </View>
      </Card>

      <Text style={styles.sectionHeader}>Jewelry Items</Text>
      {summary.jewelry_items?.map((item) => (
        <Card key={item.id} style={{ marginBottom: 10 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.itemDesc}>{item.description}</Text>
            <Badge label={item.purity} tone="amber" />
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>{item.weight_grams}g @ {formatCurrency(item.rate_per_gram)}/g</Text>
            <Text style={styles.value}>{formatCurrency(item.value)}</Text>
          </View>
        </Card>
      ))}

      <Card style={{ backgroundColor: COLORS.primaryLight, borderColor: COLORS.amberBorder }}>
        <View style={styles.rowBetween}>
          <Text style={styles.totalLabel}>Current Jewelry Value</Text>
          <Text style={styles.totalValue}>{formatCurrency(summary.jewelry_current_value)}</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loanNumber: { fontSize: 12, fontWeight: '700', color: '#92400E', marginBottom: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 13, color: COLORS.textLight },
  value: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  totalRow: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  totalValue: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', marginBottom: 10, marginTop: 4 },
  itemDesc: { fontSize: 14, fontWeight: '700', color: COLORS.text },
});