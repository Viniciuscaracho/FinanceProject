import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Verificar se Supabase está configurado
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env')
  console.warn('⚠️ Funcionalidades do Supabase estarão desabilitadas até a configuração')
}

// Criar cliente Supabase apenas se estiver configurado
let supabaseClient = null

if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  } catch (error) {
    console.error('Erro ao criar cliente Supabase:', error)
  }
} else {
  // Criar um objeto mock para evitar erros quando Supabase não está configurado
  supabaseClient = {
    auth: {
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase não configurado' } }),
      signUp: async () => ({ data: null, error: { message: 'Supabase não configurado' } }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  }
}

export const supabase = supabaseClient

// Flag para verificar se Supabase está disponível
export const isSupabaseAvailable = isSupabaseConfigured

// Helper para obter o usuário atual
export const getCurrentUser = async () => {
  if (!isSupabaseAvailable) {
    return null
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Erro ao obter usuário:', error)
      return null
    }
    return user
  } catch (error) {
    console.error('Erro ao obter usuário:', error)
    return null
  }
}

// Helper para obter a sessão atual
export const getCurrentSession = async () => {
  if (!isSupabaseAvailable) {
    return null
  }
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Erro ao obter sessão:', error)
      return null
    }
    return session
  } catch (error) {
    console.error('Erro ao obter sessão:', error)
    return null
  }
}

