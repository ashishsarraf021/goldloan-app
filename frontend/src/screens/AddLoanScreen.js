import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Text } from 'react-native';
import { Input, Button } from '../components/UI';
import CustomerSearchInput from '../components/CustomerSearchInput';
import { api } from '../api/client';
import { COLORS } from '../utils/constants';

export default function AddLoanScreen({ navigation }) {
  const [customer, setCustomer] = useState(null);
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('24');
  const [dueDate, setDueDate] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemWeight, setItemWeight] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!customer || !principal) {
      Alert.alert('Error', 'Select a customer and enter principal amount');
      return;
    }
    setLoading(true);
    try {
      await api.createLoan({
        customer_id: customer.id,
        principal_amount: parseFloat(principal),
        interest_rate: parseFloat(interestRate),
        interest_type: 'monthly',
        loan_date: new Date().toISOString().split('T')[0],
        due_date: dueDate || undefined,
        jewelry_items: itemDesc ? [{
          metal_type: 'gold',
          description: itemDesc,
          weight_grams: parseFloat(itemWeight) || 0,
          purity: '22K',
          quantity: 1,
        }] : [],
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={{ marginBottom: 16 }}>
        <CustomerSearchInput selectedCustomer={customer} onSelect={setCustomer} />
      </View>

      <Input label="Principal Amount (₹)" value={principal} onChangeText={setPrincipal} keyboardType="numeric" placeholder="e.g. 50000" />
      <Input label="Interest Rate (%)" value={interestRate} onChangeText={setInterestRate} keyboardType="numeric" />
      <Input label="Due Date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} placeholder="Optional" />

      <Text style={styles.sectionLabel}>Attached Collateral</Text>
      <Input label="Jewelry Description" value={itemDesc} onChangeText={setItemDesc} placeholder="e.g. 22K Gold Chain" />
      <Input label="Weight (grams)" value={itemWeight} onChangeText={setItemWeight} keyboardType="numeric" />

      <Button title="Save & Issue Loan" onPress={handleSave} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#92400E', textTransform: 'uppercase', marginTop: 8, marginBottom: 8 },
});