import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [shopkeeper, setShopkeeper] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    try {
      await api.init();
      const profile = await api.getProfile();
      setShopkeeper(profile);
    } catch {
      await api.setToken(null);
      setShopkeeper(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, password) => {
    const data = await api.login({ phone, password });
    await api.setToken(data.token);
    setShopkeeper(data.shopkeeper);
    return data;
  };

  const register = async (payload) => {
    const data = await api.register(payload);
    await api.setToken(data.token);
    setShopkeeper(data.shopkeeper);
    return data;
  };

  const logout = async () => {
    await api.setToken(null);
    setShopkeeper(null);
  };

  const refreshProfile = async () => {
    const profile = await api.getProfile();
    setShopkeeper(profile);
    return profile;
  };

  return (
    <AuthContext.Provider
      value={{ shopkeeper, loading, login, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
