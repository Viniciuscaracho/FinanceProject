import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos por padrão
      staleTime: 5 * 60 * 1000, // 5 minutos
      // Manter dados em cache por 10 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
      // Retry automático em caso de erro
      retry: 1,
      // Refetch quando a janela ganha foco (útil para dados atualizados)
      refetchOnWindowFocus: false,
      // Não refetch automaticamente em reconexão (evita requisições desnecessárias)
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry em mutações
      retry: 1,
    },
  },
})


