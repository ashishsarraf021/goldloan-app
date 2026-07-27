import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { COLORS, RADIUS } from '../utils/constants';

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({ label, tone = 'default' }) {
  const toneStyles = {
    default: { bg: '#F1F5F9', fg: COLORS.textLight, border: COLORS.border },
    amber: { bg: '#FEF3C7', fg: '#92400E', border: '#FDE68A' },
    success: { bg: COLORS.successLight, fg: '#065F46', border: '#A7F3D0' },
    sky: { bg: '#F0F9FF', fg: '#075985', border: '#BAE6FD' },
    purple: { bg: '#FAF5FF', fg: '#6B21A8', border: '#E9D5FF' },
  };
  const t = toneStyles[tone] || toneStyles.default;
  return (
    <View style={[styles.badge, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function Button({ title, onPress, variant = 'primary', loading, disabled, style, icon }) {
  const isOutline = variant === 'outline';
  const isSuccess = variant === 'success';
  const isGhost = variant === 'ghost';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isOutline && styles.buttonOutline,
        isSuccess && styles.buttonSuccess,
        isGhost && styles.buttonGhost,
        !isOutline && !isSuccess && !isGhost && styles.buttonPrimary,
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={isOutline || isGhost ? COLORS.primary : COLORS.white} size="small" />
      ) : (
        <Text
          style={[
            styles.buttonText,
            (isOutline || isGhost) && styles.buttonTextOutline,
          ]}
        >
          {icon ? `${icon}  ` : ''}{title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export function Input({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, multiline }) {
  return (
    <View style={styles.inputWrapper}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize="none"
      />
    </View>
  );
}

export function StatCard({ label, value, icon, sub, accent }) {
  return (
    <View style={[styles.statCard, accent && { borderColor: COLORS.amberBorder }]}>
      <View style={styles.statCardHeader}>
        <Text style={styles.statCardLabel}>{label}</Text>
        {icon && <Text style={styles.statCardIcon}>{icon}</Text>}
      </View>
      <Text style={styles.statCardValue}>{value}</Text>
      {sub && <Text style={styles.statCardSub}>{sub}</Text>}
    </View>
  );
}

export function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

export function FilterTabs({ options, value, onChange }) {
  return (
    <View style={styles.filterTabsWrap}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.filterTab, active && styles.filterTabActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  button: {
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonPrimary: { backgroundColor: COLORS.primary },
  buttonOutline: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.primary },
  buttonSuccess: { backgroundColor: COLORS.success },
  buttonGhost: { backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.amberBorder },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  buttonTextOutline: { color: COLORS.primary },

  inputWrapper: { marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginBottom: 5 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.text,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },

  statCard: {
    flexBasis: '48%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  statCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  statCardLabel: { fontSize: 11, color: COLORS.textLight },
  statCardIcon: { fontSize: 14 },
  statCardValue: { fontSize: 19, fontWeight: '800', color: COLORS.text },
  statCardSub: { fontSize: 10, color: COLORS.textLight, marginTop: 2 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  filterTabsWrap: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: RADIUS.md,
    padding: 4,
  },
  filterTab: { flex: 1, paddingVertical: 8, borderRadius: RADIUS.sm, alignItems: 'center' },
  filterTabActive: { backgroundColor: COLORS.white },
  filterTabText: { fontSize: 11, fontWeight: '600', color: COLORS.textLight },
  filterTabTextActive: { color: COLORS.text, fontWeight: '700' },
});