import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAuthenticated = !!user;

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const res = await authAPI.getMe();
          const d = res.data;
          setUser(d?.user || d);
        }
      } catch (err) {
        await AsyncStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const res = await authAPI.login({ email, password });
      const data = res.data;
      await AsyncStorage.setItem('token', data.token);
      setUser(data.user || data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      throw err;
    }
  }, []);

  const loginWithOTP = useCallback(async (phone, otp) => {
    try {
      setError(null);
      const res = await authAPI.verifyOTP({ phone, otp });
      const data = res.data;
      await AsyncStorage.setItem('token', data.token);
      setUser(data.user || data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP verification failed';
      setError(msg);
      throw err;
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      setError(null);
      const res = await authAPI.register(userData);
      const data = res.data;
      await AsyncStorage.setItem('token', data.token);
      setUser(data.user || data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['token', 'skipq_cart', 'skipq_notifications']);
    setUser(null);
    setError(null);
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    const res = await authAPI.updateProfile(profileData);
    const updated = res.data?.user || res.data;
    setUser(updated);
    return updated;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        error,
        login,
        loginWithOTP,
        register,
        logout,
        updateProfile,
        setError,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
