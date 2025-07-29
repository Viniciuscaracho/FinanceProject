import { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await apiService.getCurrentUser();
        setUser(response.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      apiService.clearToken();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await apiService.login(email, password);
      
      if (response.success) {
        setUser(response.user);
        return { success: true };
      } else {
        setError(response.error || 'Login falhou');
        return { success: false, error: response.error };
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const loginSimple = async (email, password) => {
    try {
      setError(null);
      const response = await apiService.loginSimple(email, password);
      
      if (response.success) {
        setUser(response.user);
        return { success: true };
      } else {
        setError(response.error || 'Login falhou');
        return { success: false, error: response.error };
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setError(null);
    }
  };

  const createTestUser = async (userData) => {
    try {
      setError(null);
      const response = await apiService.createTestUser(userData);
      return response;
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    loginSimple,
    logout,
    createTestUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 