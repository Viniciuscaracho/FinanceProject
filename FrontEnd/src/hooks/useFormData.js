import { useQuery } from '@tanstack/react-query'
import { apiService } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

// Query keys para dados de formulário
export const formDataKeys = {
  categories: ['categories'],
  costCenters: ['cost_centers'],
  bankAccounts: ['bank_accounts'],
  contacts: ['contacts'],
  tags: ['tags'],
}

// Hook para carregar categorias (com cache longo)
export function useCategories() {
  const { isAuthenticated } = useAuth()
  
  return useQuery({
    queryKey: formDataKeys.categories,
    queryFn: () => apiService.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 minutos - dados raramente mudam
    gcTime: 30 * 60 * 1000, // 30 minutos
    enabled: isAuthenticated, // Só executa se o usuário estiver autenticado
  })
}

// Hook para carregar centros de custo
export function useCostCenters() {
  const { isAuthenticated } = useAuth()
  
  return useQuery({
    queryKey: formDataKeys.costCenters,
    queryFn: () => apiService.getCostCenters(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: isAuthenticated, // Só executa se o usuário estiver autenticado
  })
}

// Hook para carregar contas bancárias
export function useBankAccounts() {
  const { isAuthenticated } = useAuth()
  
  return useQuery({
    queryKey: formDataKeys.bankAccounts,
    queryFn: () => apiService.getBankAccounts(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: isAuthenticated, // Só executa se o usuário estiver autenticado
  })
}

// Hook para carregar contatos
export function useContacts() {
  const { isAuthenticated } = useAuth()
  
  return useQuery({
    queryKey: formDataKeys.contacts,
    queryFn: () => apiService.getContacts(1, 1000), // Carregar muitos contatos
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000,
    enabled: isAuthenticated, // Só executa se o usuário estiver autenticado
  })
}

// Hook para carregar tags
export function useTags() {
  const { isAuthenticated } = useAuth()
  
  return useQuery({
    queryKey: formDataKeys.tags,
    queryFn: () => apiService.getTags(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000,
    enabled: isAuthenticated, // Só executa se o usuário estiver autenticado
  })
}

