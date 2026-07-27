import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal } from 'react-native';
import { api } from '../api/client';
import { COLORS, RADIUS } from '../utils/constants';

export default function CategoryPicker({ value, onChange }) {
  const [categories, setCategories] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const created = await api.createCategory({ name: newName.trim() });
    setCategories((c) => [...c, created]);
    onChange(created.name);
    setNewName('');
    setShowAdd(false);
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>Category</Text>
      <View style={styles.row}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.chip, value === cat.name && styles.chipSelected]}
            onPress={() => onChange(cat.name)}
          >
            <Text style={[styles.chipText, value === cat.name && styles.chipTextSelected]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.addChip} onPress={() => setShowAdd(true)}>
          <Text style={styles.addChipText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showAdd} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New Category</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Necklace, Ring, Bangle"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowAdd(false)} style={styles.cancelBtn}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleAdd} style={styles.saveBtn}><Text style={styles.saveBtnText}>Add</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginBottom: 5 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.text },
  chipTextSelected: { color: COLORS.white, fontWeight: '600' },
  addChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary, borderStyle: 'dashed' },
  addChipText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalBox: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { padding: 10 },
  saveBtn: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 18, borderRadius: RADIUS.md },
  saveBtnText: { color: COLORS.white, fontWeight: '700' },
});