export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const COLORS = {
  primary: '#D97706',
  primaryDark: '#B45309',
  primaryLight: '#FEF3C7',
  secondary: '#1A1A2E',
  background: '#F1F5F9',
  white: '#FFFFFF',
  text: '#0F172A',
  textLight: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  success: '#059669',
  successLight: '#D1FAE5',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  gold: '#B8860B',
  silver: '#94A3B8',
  amberBorder: '#FDE68A',
  whatsapp: '#059669',
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return '₹0.00';
  return `₹${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};