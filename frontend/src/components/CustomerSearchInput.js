import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { api } from '../api/client';
import { COLORS, RADIUS } from '../utils/constants';

export default function CustomerSearchInput({ onSelect, selectedCustomer }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);

  useEffect(() => {
    api.getCustomers().then(setAllCustomers).catch(() => {});
  }, []);

  useEffect(() => {
    if (!query) return setResults([]);
    const q = query.toLowerCase();
    setResults(allCustomers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)));
  }, [query, allCustomers]);

  if (selectedCustomer) {
    return (
      <View style={styles.selectedBox}>
        <View>
          <Text style={styles.selectedName}>{selectedCustomer.name}</Text>
          <Text style={styles.selectedPhone}>{selectedCustomer.phone}</Text>
        </View>
        <TouchableOpacity onPress={() => onSelect(null)}>
          <Text style={styles.changeLink}>Change</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.label}>Customer *</Text>
      <TextInput
        style={styles.input}
        placeholder="Search by name or phone"
        placeholderTextColor={COLORS.textMuted}
        value={query}
        onChangeText={setQuery}
      />
      {results.length > 0 && (
        <View style={styles.dropdown}>
            {results.length > 0 && (
            <View style={styles.dropdown}>
                {results.map((item) => (
                <TouchableOpacity
                    key={item.id}
                    style={styles.resultRow}
                    onPress={() => { onSelect(item); setQuery(''); setResults([]); }}
                >
                    <Text style={styles.resultName}>{item.name}</Text>
                    <Text style={styles.resultPhone}>{item.phone}</Text>
                </TouchableOpacity>
                ))}
            </View>
            )}
        </View>
      )}
      {query.length > 0 && results.length === 0 && (
        <Text style={styles.noResults}>No match — add this customer first via the Customers tab.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginBottom: 5 },
  input: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1',
    borderRadius: RADIUS.md, padding: 12, fontSize: 14, color: COLORS.text,
  },
  dropdown: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, marginTop: 4, maxHeight: 180, backgroundColor: COLORS.white },
  resultRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  resultName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  resultPhone: { fontSize: 12, color: COLORS.textLight },
  noResults: { fontSize: 12, color: COLORS.textLight, marginTop: 6 },
  selectedBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.md, padding: 12, backgroundColor: COLORS.primaryLight,
  },
  selectedName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  selectedPhone: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  changeLink: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
});