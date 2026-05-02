import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

// Query keys
export const transactionKeys = {
  all: ['transactions'],
  lists: () => [...transactionKeys.all, 'list'],
  list: (filters) => [...transactionKeys.lists(), filters],
  details: () => [...transactionKeys.all, 'detail'],
  detail: (id) => [...transactionKeys.details(), id],
}

// Hook para listar transações
export function useTransactions(page = 1, perPage = 20, filters = {}) {
  const { isAuthenticated } = useAuth()
  
  return useQuery({
    queryKey: transactionKeys.list({ page, perPage, ...filters }),
    queryFn: () => apiService.getTransactions(page, perPage, filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    enabled: isAuthenticated, // Só executa se o usuário estiver autenticado
  })
}

// Hook para uma transação específica
export function useTransaction(id) {
  const { isAuthenticated } = useAuth()
  
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => apiService.getTransaction(id),
    enabled: isAuthenticated && !!id, // Só executa se o usuário estiver autenticado e tiver um ID
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Hook para criar transação
export function useCreateTransaction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (transactionData) => apiService.createTransaction(transactionData),
    onSuccess: async () => {
      // Invalidar apenas a lista atual (mais rápido)
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      // Invalidar dashboard para atualizar os valores lá também
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      
      // Invalidar e refetch imediatamente - o backend já atualiza o saldo síncronamente
      await queryClient.invalidateQueries({ queryKey: ['bank_accounts'] })
      await queryClient.refetchQueries({ queryKey: ['bank_accounts'] })
    },
  })
}

// Hook para atualizar transação
export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }) => apiService.updateTransaction(id, data),
    onSuccess: async (data, variables) => {
      // Atualizar cache da transação específica
      queryClient.setQueryData(transactionKeys.detail(variables.id), data)
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      // Invalidar dashboard para atualizar os valores lá também
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      
      // Invalidar e refetch imediatamente - o backend já atualiza o saldo síncronamente
      await queryClient.invalidateQueries({ queryKey: ['bank_accounts'] })
      await queryClient.refetchQueries({ queryKey: ['bank_accounts'] })
    },
  })
}

// Hook para deletar transação
export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id) => apiService.deleteTransaction(id),
    onSuccess: async () => {
      // Invalidar todas as listas
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() })
      // Invalidar dashboard para atualizar os valores lá também
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      
      // Invalidar e refetch imediatamente - o backend já atualiza o saldo síncronamente
      await queryClient.invalidateQueries({ queryKey: ['bank_accounts'] })
      await queryClient.refetchQueries({ queryKey: ['bank_accounts'] })
    },
  })
}

