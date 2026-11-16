import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('ner_token'));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ner_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('ner_token');
      if (storedToken) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
          localStorage.setItem('ner_user', JSON.stringify(userData));
        } catch (err) {
          console.warn('Session verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleAuthChanged = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('ner-auth-changed', handleAuthChanged);
    return () => window.removeEventListener('ner-auth-changed', handleAuthChanged);
  }, []);

  const login = async (username, password, loginType = 'user') => {
    // Basic client-side pre-validation
    const cleanUser = (username || '').trim();
    if (loginType === 'user' && !cleanUser.toLowerCase().endsWith('@ner.com')) {
      throw new Error('Login failed: username must end with @NER.com');
    }
    if (loginType === 'admin' && !cleanUser.toLowerCase().endsWith('@adm.com')) {
      throw new Error('Login failed: admin username must end with @adm.com');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    try {
      const data = await authService.login(cleanUser, password, loginType);
      if (data && data.access_token) {
        localStorage.setItem('ner_token', data.access_token);
        const userInfo = {
          username: data.username,
          role: data.role,
        };
        localStorage.setItem('ner_user', JSON.stringify(userInfo));
        setToken(data.access_token);
        setUser(userInfo);
        return { success: true, user: userInfo, message: data.message };
      }
      return { success: false, message: data?.message || 'Login failed' };
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Authentication error';
      throw new Error(detail);
    }
  };

  const logout = () => {
    localStorage.removeItem('ner_token');
    localStorage.removeItem('ner_user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'owner');
  const isOwner = isAuthenticated && user?.role === 'owner';

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated,
        isAdmin,
        isOwner,
        login,
        logout,
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
