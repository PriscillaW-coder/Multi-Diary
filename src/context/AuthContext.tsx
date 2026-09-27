import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import type { UserProfile, UserPrivacySettings } from '../types/diary';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePrivacySettings: (settings: Partial<UserPrivacySettings>, themePref?: 'light' | 'dark' | 'system') => Promise<void>;
  changePassword: (curr: string, next: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string, next: string) => Promise<{ success: boolean; message: string }>;
  deleteAccount: () => Promise<void>;
  seedDemoMemories: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('multidiary_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    const savedToken = localStorage.getItem('multidiary_token');
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
      setToken(savedToken);
    } catch (err) {
      console.warn('Session verification failed, logging out:', err);
      localStorage.removeItem('multidiary_token');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, pass);
      localStorage.setItem('multidiary_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.register(name, email, pass);
      localStorage.setItem('multidiary_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
    } catch (e) {
      // ignore logout failure
    } finally {
      localStorage.removeItem('multidiary_token');
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  };

  const updatePrivacySettings = async (settings: Partial<UserPrivacySettings>, themePref?: 'light' | 'dark' | 'system') => {
    const res = await api.updatePrivacySettings(settings, themePref);
    setUser(res.user);
  };

  const changePassword = async (curr: string, next: string) => {
    return api.changePassword(curr, next);
  };

  const resetPassword = async (email: string, next: string) => {
    return api.resetPassword(email, next);
  };

  const deleteAccount = async () => {
    await api.deleteAccount();
    setUser(null);
    setToken(null);
  };

  const seedDemoMemories = async () => {
    await api.seedDemoMemories();
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updatePrivacySettings,
        changePassword,
        resetPassword,
        deleteAccount,
        seedDemoMemories,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
