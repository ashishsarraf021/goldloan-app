export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const COLORS = {
  primary: '#B8860B',
  primaryDark: '#8B6914',
  secondary: '#1A1A2E',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  textLight: '#666666',
  border: '#E0E0E0',
  success: '#2E7D32',
  error: '#C62828',
  gold: '#FFD700',
  silver: '#C0C0C0',
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
