import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

// Query keys para cache
export const reportKeys = {
  all: ['reports'],
  lists: () => [...reportKeys.all, 'list'],
  list: (filters) => [...reportKeys.lists(), filters],
  details: () => [...reportKeys.all, 'detail'],
  detail: (id, params) => [...reportKeys.details(), id, params],
}

// Hook para buscar lista de relatórios disponíveis
export function useReports() {
  const { isAuthenticated } = useAuth()
  
  return useQuery({
    queryKey: reportKeys.lists(),
    queryFn: async () => {
      const response = await apiService.getReports()
      return response.reports || []
    },
    staleTime: 30 * 60 * 1000, // 30 minutos - lista de relatórios muda raramente
    enabled: isAuthenticated, // Só executa se o usuário estiver autenticado
  })
}

// Hook para buscar dados de um relatório específico
export function useReport(reportId, params = {}, options = {}) {
  const { isAuthenticated } = useAuth()
  
  return useQuery({
    queryKey: reportKeys.detail(reportId, params),
    queryFn: async () => {
      if (!reportId) return null
      
      let response
      
      try {
        switch (reportId) {
          case 'dre':
            response = await apiService.getDreReport(params.start_date, params.end_date, params)
            break
          case 'extract':
            response = await apiService.getExtractReport(params.start_date, params.end_date, {
              bank_account_ids: params.bank_account_ids || [],
              page: params.page || 1,
              per_page: params.per_page || 100
            })
            break
          case 'financial_history':
            response = await apiService.getFinancialHistoryReport(params.start_date, params.end_date, params)
            break
          case 'per_category':
            response = await apiService.getPerCategoryReport(
              params.transaction_type || 'expense',
              params.start_date,
              params.end_date,
              params
            )
            break
          case 'per_description':
            response = await apiService.getPerDescriptionReport(
              params.transaction_type || 'expense',
              params.start_date,
              params.end_date,
              params
            )
            break
          case 'per_period':
            response = await apiService.getPerPeriodReport(
              params.transaction_type || 'expense',
              params.start_date,
              params.end_date,
              params
            )
            break
          case 'appointments_integrated':
            response = await apiService.getAppointmentsIntegratedReport(params.start_date, params.end_date)
            break
          case 'financial_with_appointments':
            response = await apiService.getFinancialWithAppointmentsReport(params.start_date, params.end_date)
            break
          default:
            response = await apiService.getReport(reportId, {
              start_date: params.start_date,
              end_date: params.end_date,
              ...params
            })
        }
        
        // Verificar se há erro na resposta
        if (response.error) {
          const error = new Error(response.error)
          error.status = response.status || 500
          error.data = response
          throw error
        }
        
        // Log para debug
        if (import.meta.env.DEV) {
          console.log('📊 Report Response:', {
            reportId,
            hasReport: !!response.report,
            hasData: !!response.report?.data,
            hasDirectData: !!response.data
          })
        }
        
        // Extrair dados do relatório - tentar múltiplas estruturas
        const reportData = response.report?.data || response.data || response
        
        // Se ainda não tiver dados, verificar se a resposta inteira é o dado
        if (!reportData && response) {
          // Para alguns relatórios, a resposta pode estar diretamente nos dados
          return response
        }
        
        return reportData
      } catch (error) {
        // Melhorar mensagem de erro
        const errorMessage = error.message || 'Erro desconhecido ao buscar relatório'
        const errorStatus = error.status || null
        
        // Log detalhado do erro
        const errorDetails = {
          reportId,
          params,
          error: errorMessage,
          status: errorStatus,
          data: error.data
        };
        console.error('❌ Error fetching report:', errorDetails);
        console.error('❌ Error fetching report (JSON):', JSON.stringify(errorDetails, null, 2));
        
        // Criar erro com mais informações
        const enhancedError = new Error(errorMessage)
        enhancedError.status = errorStatus
        enhancedError.data = error.data
        throw enhancedError
      }
    },
    enabled: isAuthenticated && !!reportId && !!params.start_date && !!params.end_date,
    staleTime: 2 * 60 * 1000, // 2 minutos - dados de relatórios podem mudar
    ...options,
  })
}

// Hook para invalidar cache de relatórios (útil após mutações)
export function useInvalidateReports() {
  const queryClient = useQueryClient()
  
  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: reportKeys.all }),
    invalidateReport: (reportId, params) => 
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(reportId, params) }),
    invalidateList: () => 
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() }),
  }
}

// Hook para prefetch de relatórios (útil para melhorar UX)
export function usePrefetchReport() {
  const queryClient = useQueryClient()
  
  return (reportId, params) => {
    queryClient.prefetchQuery({
      queryKey: reportKeys.detail(reportId, params),
      queryFn: async () => {
        const response = await apiService.getReport(reportId, {
          start_date: params.start_date,
          end_date: params.end_date,
          ...params
        })
        return response.report?.data || response.data || null
      },
    })
  }
}


