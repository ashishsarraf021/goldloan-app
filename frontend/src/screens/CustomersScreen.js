import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, LoadingScreen } from '../components/UI';
import { api } from '../api/client';
import { COLORS, RADIUS } from '../utils/constants';

export default function CustomersScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Customer Directory</Text>
          <Text style={styles.subtitle}>{customers.length} registered borrowers & buyers</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddCustomer')}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={customers}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 10 }}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.substring(0, 2).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.phone}>📞 {item.phone}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.waBtn}
                onPress={() => Linking.openURL(`https://wa.me/${item.whatsapp || item.phone}`)}
              >
                <Text style={styles.waIcon}>💬</Text>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.amberBorder, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: '800', color: '#92400E' },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  phone: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  waBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.successLight, borderWidth: 1, borderColor: '#A7F3D0', alignItems: 'center', justifyContent: 'center' },
  waIcon: { fontSize: 15 },
});