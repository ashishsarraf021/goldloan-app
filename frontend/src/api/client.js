import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../utils/constants';

const TOKEN_KEY = 'auth_token';

class ApiClient {
  constructor() {
    this.token = null;
  }

  async init() {
    this.token = await SecureStore.getItemAsync(TOKEN_KEY);
  }

  async setToken(token) {
    this.token = token;
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Request failed (${response.status})`);
    }

    return data;
  }

  // Auth
  register(payload) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  login(payload) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  getProfile() {
    return this.request('/profile');
  }

  updateProfile(payload) {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // Dashboard
  getDashboard() {
    return this.request('/dashboard');
  }

  // Customers
  getCustomers() {
    return this.request('/customers');
  }

  getCustomer(id) {
    return this.request(`/customers/${id}`);
  }

  createCustomer(payload) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  updateCustomer(id, payload) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  deleteCustomer(id) {
    return this.request(`/customers/${id}`, { method: 'DELETE' });
  }

  // Loans
  getLoans(status) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/loans${query}`);
  }

  getLoan(id) {
    return this.request(`/loans/${id}`);
  }

  getLoanSummary(id) {
    return this.request(`/loans/${id}/summary`);
  }

  createLoan(payload) {
    return this.request('/loans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  updateLoan(id, payload) {
    return this.request(`/loans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  sendReminder(id) {
    return this.request(`/loans/${id}/send-reminder`, { method: 'POST' });
  }

  getReminderLogs(id) {
    return this.request(`/loans/${id}/reminders`);
  }
}

export const api = new ApiClient();
