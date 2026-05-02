import { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../lib/api';
import { supabase, getCurrentUser, getCurrentSession, isSupabaseAvailable, mfaEnroll, mfaChallenge, mfaVerify, mfaUnenroll, mfaListFactors } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);

  // Evitar quebra da aplicação caso o provider não esteja montado (por exemplo, em rotas públicas
  // ou renderizações isoladas). Retorna um objeto seguro com valores padrão e funções no-op.
  if (!context) {
    return {
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      isImpersonating: false,
      login: async () => ({ success: false, error: 'AuthProvider ausente' }),
      loginSimple: async () => ({ success: false, error: 'AuthProvider ausente' }),
      loginWithSupabase: async () => ({ success: false, error: 'AuthProvider ausente' }),
      signUpWithSupabase: async () => ({ success: false, error: 'AuthProvider ausente' }),
      register: async () => ({ success: false, error: 'AuthProvider ausente' }),
      enrollMfa: async () => ({ success: false, error: 'AuthProvider ausente' }),
      verifyMfa: async () => ({ success: false, error: 'AuthProvider ausente' }),
      unenrollMfa: async () => ({ success: false, error: 'AuthProvider ausente' }),
      listMfaFactors: async () => ({ factors: [] }),
      logout: async () => {},
      createTestUser: async () => ({ success: false, error: 'AuthProvider ausente' }),
      impersonate: async () => ({ success: false, error: 'AuthProvider ausente' }),
      stopImpersonating: async () => ({ success: false, error: 'AuthProvider ausente' })
    };
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
    
    // Listener para mudanças de autenticação do Supabase (apenas se configurado)
    if (isSupabaseAvailable) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Fazer login no backend com o token do Supabase
          try {
            const response = await apiService.supabaseLogin(session.access_token);
            if (response.success) {
              setUser(response.user);
            }
          } catch (error) {
            console.error('Erro ao fazer login no backend:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          apiService.clearToken();
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const checkAuth = async () => {
    try {
      // Primeiro, verificar se há sessão do Supabase (apenas se configurado)
      if (isSupabaseAvailable) {
        try {
          const session = await getCurrentSession();
          if (session?.access_token) {
            // Tentar fazer login no backend com o token do Supabase
            try {
              const response = await apiService.supabaseLogin(session.access_token);
              if (response.success) {
                setUser(response.user);
                setLoading(false);
                return;
              }
            } catch (error) {
              console.error('Erro ao fazer login no backend:', error);
              // Continuar para verificar token local
            }
          }
        } catch (error) {
          console.error('Erro ao verificar sessão Supabase:', error);
          // Continuar para verificar token local
        }
      }
      
      // Fallback: verificar token local
      const token = localStorage.getItem('auth_token');
      if (token) {
        console.log('🔑 Token encontrado no localStorage, verificando autenticação...');
        try {
          const response = await apiService.getCurrentUser();
          if (response.user) {
            setUser(response.user);
            console.log('✅ Usuário autenticado:', response.user.email);
          }
        } catch (error) {
          console.error('❌ Erro ao verificar autenticação:', error);
          // Se o token estiver inválido ou houver erro de conexão, limpar
          if (error.status === 401 || error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
            console.log('Token inválido ou erro de conexão, limpando...');
            apiService.clearToken();
          }
        }
      } else {
        console.log('⚠️ Nenhum token encontrado');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Não limpar token em caso de erro genérico, apenas logar
      setError(error.message || 'Erro ao verificar autenticação');
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
        // Garantir que o token está sendo salvo
        if (response.token) {
          apiService.setToken(response.token);
          console.log('Token salvo após login:', response.token.substring(0, 20) + '...');
        }
        setUser(response.user);
        return { success: true };
      } else {
        const errorMessage = response.error || response.message || 'Login falhou';
        setError(errorMessage);
        console.error('Login failed:', { response, errorMessage });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error.message || error.data?.message || error.data?.error || 'Erro ao fazer login';
      setError(errorMessage);
      console.error('Login error:', { 
        error, 
        message: errorMessage,
        status: error.status,
        data: error.data 
      });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Fazer logout do Supabase (apenas se configurado)
      if (isSupabaseAvailable) {
        await supabase.auth.signOut();
      }
      // Fazer logout do backend
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setError(null);
      apiService.clearToken();
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

  // Login via Supabase
  const loginWithSupabase = async (email, password) => {
    if (!isSupabaseAvailable) {
      setError('Supabase não está configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
      return { success: false, error: 'Supabase não configurado' };
    }

    try {
      setError(null);
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (supabaseError) {
        setError(supabaseError.message);
        return { success: false, error: supabaseError.message };
      }

      if (data.session) {
        // Fazer login no backend com o token do Supabase
        const response = await apiService.supabaseLogin(data.session.access_token);
        if (response.success) {
          setUser(response.user);
          return { success: true };
        } else {
          setError(response.error || 'Erro ao fazer login no backend');
          return { success: false, error: response.error };
        }
      }

      return { success: false, error: 'Sessão não criada' };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const register = async ({ name, accountName, email, password }) => {
    try {
      setError(null);
      const response = await apiService.register({ name, accountName, email, password });

      if (response.success) {
        setUser(response.user);
        return { success: true };
      } else {
        const errorMessage = response.error || 'Erro ao criar conta';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error.message || error.data?.error || 'Erro ao criar conta';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Sign up via Supabase
  const signUpWithSupabase = async (email, password, metadata = {}) => {
    if (!isSupabaseAvailable) {
      setError('Supabase não está configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
      return { success: false, error: 'Supabase não configurado' };
    }

    try {
      setError(null);
      const { data, error: supabaseError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (supabaseError) {
        setError(supabaseError.message);
        return { success: false, error: supabaseError.message };
      }

      return { success: true, user: data.user };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const impersonate = async (accountId) => {
    try {
      setError(null);
      const response = await apiService.impersonateAccount(accountId);
      
      if (response.success) {
        apiService.setToken(response.token);
        setUser(response.user);
        return { success: true, admin: response.admin };
      } else {
        setError(response.error || 'Erro ao entrar como usuário');
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.message || error.data?.error || 'Erro ao entrar como usuário';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const enrollMfa = async () => {
    const { data, error } = await mfaEnroll()
    if (error) return { success: false, error: error.message }
    return { success: true, totp: data.totp, factorId: data.id }
  }

  const verifyMfa = async (factorId, code) => {
    const { data: challengeData, error: challengeError } = await mfaChallenge(factorId)
    if (challengeError) return { success: false, error: challengeError.message }

    const { data, error } = await mfaVerify(factorId, challengeData.id, code)
    if (error) return { success: false, error: error.message }
    return { success: true, data }
  }

  const unenrollMfa = async (factorId) => {
    const { error } = await mfaUnenroll(factorId)
    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  const listMfaFactors = async () => {
    const { data, error } = await mfaListFactors()
    if (error) return { factors: [] }
    return { factors: data?.totp ?? [] }
  }

  const stopImpersonating = async () => {
    try {
      setError(null);
      const response = await apiService.stopImpersonating();
      
      if (response.success) {
        apiService.setToken(response.token);
        setUser(response.user);
        return { success: true };
      } else {
        setError(response.error || 'Erro ao sair do modo de suporte');
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.message || error.data?.error || 'Erro ao sair do modo de suporte';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    loginSimple,
    loginWithSupabase,
    signUpWithSupabase,
    register,
    enrollMfa,
    verifyMfa,
    unenrollMfa,
    listMfaFactors,
    logout,
    createTestUser,
    impersonate,
    stopImpersonating,
    isAuthenticated: !!user,
    isImpersonating: user?.impersonating === true,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 