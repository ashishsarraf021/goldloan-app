import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button, Input } from '../components/UI';
import { api } from '../api/client';
import { COLORS } from '../utils/constants';

const emptyJewelry = () => ({
  metal_type: 'gold',
  description: '',
  weight_grams: '',
  purity: '22K',
  quantity: '1',
});

export default function AddLoanScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState(null);
  const [form, setForm] = useState({
    principal_amount: '',
    interest_rate: '',
    interest_type: 'monthly',
    loan_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [jewelryItems, setJewelryItems] = useState([emptyJewelry()]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getCustomers().then(setCustomers).catch(console.error);
  }, []);

  const updateForm = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const updateJewelry = (index, key, value) => {
    setJewelryItems((items) => {
      const copy = [...items];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const addJewelry = () => setJewelryItems((items) => [...items, emptyJewelry()]);

  const handleSave = async () => {
    if (!customerId) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }
    if (!form.principal_amount || !form.interest_rate) {
      Alert.alert('Error', 'Principal and interest rate are required');
      return;
    }

    const items = jewelryItems.filter((j) => j.description && j.weight_grams);
    if (items.length === 0) {
      Alert.alert('Error', 'Add at least one jewelry item');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer_id: customerId,
        principal_amount: parseFloat(form.principal_amount),
        interest_rate: parseFloat(form.interest_rate),
        interest_type: form.interest_type,
        loan_date: form.loan_date,
        notes: form.notes,
        jewelry_items: items.map((j) => ({
          metal_type: j.metal_type,
          description: j.description,
          weight_grams: parseFloat(j.weight_grams),
          purity: j.purity,
          quantity: parseInt(j.quantity, 10) || 1,
        })),
      };
      const loan = await api.createLoan(payload);
      navigation.replace('LoanDetail', { loanId: loan.id });
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>Customer</Text>
        {customers.length === 0 ? (
          <Text style={styles.hint}>No customers. Add a customer first.</Text>
        ) : (
          customers.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.customerChip, customerId === c.id && styles.customerSelected]}
              onPress={() => setCustomerId(c.id)}
            >
              <Text style={[styles.chipText, customerId === c.id && styles.chipTextSelected]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))
        )}

        <Text style={styles.section}>Loan Details</Text>
        <Input
          label="Principal Amount (₹) *"
          value={form.principal_amount}
          onChangeText={(v) => updateForm('principal_amount', v)}
          keyboardType="numeric"
        />
        <Input
          label="Interest Rate (% per year) *"
          value={form.interest_rate}
          onChangeText={(v) => updateForm('interest_rate', v)}
          keyboardType="numeric"
        />
        <Input
          label="Interest Type"
          value={form.interest_type}
          onChangeText={(v) => updateForm('interest_type', v)}
          placeholder="monthly or yearly"
        />
        <Input
          label="Loan Date (YYYY-MM-DD)"
          value={form.loan_date}
          onChangeText={(v) => updateForm('loan_date', v)}
        />
        <Input label="Notes" value={form.notes} onChangeText={(v) => updateForm('notes', v)} multiline />

        <Text style={styles.section}>Jewelry Items</Text>
        {jewelryItems.map((item, index) => (
          <View key={index} style={styles.jewelryBlock}>
            <Text style={styles.jewelryTitle}>Item {index + 1}</Text>
            <Input
              label="Metal (gold/silver)"
              value={item.metal_type}
              onChangeText={(v) => updateJewelry(index, 'metal_type', v)}
            />
            <Input
              label="Description *"
              value={item.description}
              onChangeText={(v) => updateJewelry(index, 'description', v)}
              placeholder="e.g. Gold chain"
            />
            <Input
              label="Weight (grams) *"
              value={item.weight_grams}
              onChangeText={(v) => updateJewelry(index, 'weight_grams', v)}
              keyboardType="numeric"
            />
            <Input
              label="Purity"
              value={item.purity}
              onChangeText={(v) => updateJewelry(index, 'purity', v)}
              placeholder="22K, 24K, 925"
            />
          </View>
        ))}
        <Button title="+ Add Another Item" variant="outline" onPress={addJewelry} />
        <Button title="Create Loan" onPress={handleSave} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 40 },
  section: { fontSize: 16, fontWeight: '700', color: COLORS.secondary, marginTop: 16, marginBottom: 10 },
  hint: { color: COLORS.textLight, marginBottom: 12 },
  customerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  customerSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 14, color: COLORS.text },
  chipTextSelected: { color: COLORS.white },
  jewelryBlock: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  jewelryTitle: { fontWeight: '600', marginBottom: 8 },
});
