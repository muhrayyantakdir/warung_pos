import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('warung_pos_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('warung_pos_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('warung_pos_token');
      if (savedToken) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('warung_pos_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('[Auth] Token invalid or expired, clearing session.');
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    const res = await api.login({ username, password });
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('warung_pos_token', res.token);
      localStorage.setItem('warung_pos_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.message || 'Gagal masuk');
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('warung_pos_token', res.token);
      localStorage.setItem('warung_pos_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.message || 'Gagal mendaftar akun');
  };

  const logout = () => {
    try {
      api.logout();
    } catch (e) {}
    setToken(null);
    setUser(null);
    localStorage.removeItem('warung_pos_token');
    localStorage.removeItem('warung_pos_user');
  };

  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
