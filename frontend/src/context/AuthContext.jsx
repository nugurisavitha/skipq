import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auto-fetch user on mount if token exists
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.auth.getMe();
          const userData = response.data.data?.user || response.data.data;
          setUser(userData);
        } catch (err) {
          console.error('Failed to fetch user:', err);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.auth.login({ email, password });
      const { token, user: userData } = response.data.data;
      localStorage.setItem('token', token);
      setUser(userData);
      return userData;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOTP = async (phone, otp, name) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.auth.verifyOTP({ phone, otp, name });
      const { token, user: userData } = response.data.data;
      localStorage.setItem('token', token);
      setUser(userData);
      return userData;
    } catch (err) {
      const message = err.response?.data?.message || 'OTP verification failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.auth.register(userData);
      const { token, user: newUser } = response.data.data;
      localStorage.setItem('token', token);
      setUser(newUser);
      return newUser;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  };

  const updateProfile = async (updates) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.auth.updateProfile(updates);
      const updatedUser = response.data.data;
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      const message = err.response?.data?.message || 'Update failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    error,
    login,
    loginWithOTP,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
