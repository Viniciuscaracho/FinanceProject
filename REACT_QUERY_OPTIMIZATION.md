# Otimizações com React Query (TanStack Query)

## Implementação Realizada

### 1. Configuração do QueryClient

Criado `FrontEnd/src/lib/queryClient.js` com configurações otimizadas:

- **staleTime**: 5 minutos - dados considerados "frescos" por 5 minutos
- **gcTime**: 10 minutos - dados mantidos em cache por 10 minutos
- **retry**: 1 tentativa em caso de erro
- **refetchOnWindowFocus**: false - não refaz requisições ao focar na janela
- **refetchOnReconnect**: false - não refaz requisições ao reconectar

### 2. Hooks Customizados

Criado `FrontEnd/src/hooks/useReports.js` com:

#### `useReports()`
- Busca lista de relatórios disponíveis
- Cache de 30 minutos (dados raramente mudam)
- Evita requisições duplicadas

#### `useReport(reportId, params, options)`
- Busca dados de um relatório específico
- Cache de 2 minutos
- Automaticamente desabilitado se parâmetros obrigatórios faltarem
- Suporta todos os tipos de relatórios

#### `useInvalidateReports()`
- Utilitário para invalidar cache após mutações
- Útil quando transações são criadas/editadas

#### `usePrefetchReport()`
- Prefetch de relatórios para melhorar UX
- Pode ser usado para pré-carregar relatórios prováveis

### 3. Integração no App

Atualizado `FrontEnd/src/App.jsx`:
- Adicionado `QueryClientProvider` envolvendo toda a aplicação
- QueryClient disponível globalmente

### 4. Atualização do Componente FinancialReports

Substituído gerenciamento manual de estado por React Query:

**Antes:**
```jsx
const [reportData, setReportData] = useState(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

useEffect(() => {
  loadReportData()
}, [selectedReport, startDate, endDate])

const loadReportData = async () => {
  setLoading(true)
  try {
    const response = await apiService.getReport(...)
    setReportData(response.data)
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```

**Depois:**
```jsx
const { 
  data: reportData, 
  isLoading: reportLoading, 
  error: reportError,
  refetch: refetchReport
} = useReport(selectedReport, {
  start_date: startDate,
  end_date: endDate,
  // ... outros params
})

// React Query gerencia automaticamente:
// - Cache
// - Loading states
// - Error states
// - Refetch quando parâmetros mudam
// - Deduplicação de requisições
```

## Benefícios

### 1. Cache Inteligente
- **Evita requisições duplicadas**: Se o mesmo relatório for solicitado múltiplas vezes, apenas uma requisição é feita
- **Cache compartilhado**: Dados em cache são compartilhados entre componentes
- **Background refetch**: Pode atualizar dados em background sem mostrar loading

### 2. Performance
- **Menos requisições**: Cache reduz drasticamente o número de requisições ao servidor
- **Loading states otimizados**: Mostra dados em cache imediatamente enquanto busca atualizações
- **Deduplicação**: Múltiplas chamadas simultâneas para o mesmo endpoint são deduplicadas

### 3. UX Melhorada
- **Dados instantâneos**: Dados em cache aparecem imediatamente
- **Loading inteligente**: Só mostra loading se não houver dados em cache
- **Error handling**: Gerenciamento automático de erros com retry

### 4. Manutenibilidade
- **Menos código**: Não precisa gerenciar estados manualmente
- **Padrão consistente**: Todos os componentes usam o mesmo padrão
- **Type safety**: Query keys tipadas facilitam autocomplete

## Exemplo de Uso

```jsx
import { useReport } from '../hooks/useReports'

function MyReportComponent() {
  const { data, isLoading, error, refetch } = useReport('income_expense', {
    start_date: '2024-01-01',
    end_date: '2024-01-31'
  })

  if (isLoading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error.message}</div>

  return (
    <div>
      <h1>Receitas: {data?.income}</h1>
      <button onClick={() => refetch()}>Atualizar</button>
    </div>
  )
}
```

## Próximos Passos Recomendados

1. **Adicionar React Query DevTools** (opcional, apenas desenvolvimento):
```jsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  <App />
  {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
</QueryClientProvider>
```

2. **Invalidar cache após mutações**:
```jsx
import { useInvalidateReports } from '../hooks/useReports'

function CreateTransactionForm() {
  const { invalidateAll } = useInvalidateReports()
  
  const handleSubmit = async (data) => {
    await apiService.createTransaction(data)
    invalidateAll() // Força refetch de todos os relatórios
  }
}
```

3. **Prefetch de relatórios comuns**:
```jsx
import { usePrefetchReport } from '../hooks/useReports'

function Dashboard() {
  const prefetchReport = usePrefetchReport()
  
  const handleHover = () => {
    // Pré-carrega relatório quando usuário passa mouse
    prefetchReport('income_expense', {
      start_date: startDate,
      end_date: endDate
    })
  }
}
```

4. **Otimizar outros componentes**:
   - `Dashboard.jsx` - usar React Query para dados do dashboard
   - `Transactions.jsx` - usar React Query para lista de transações
   - `AppointmentReports.jsx` - usar React Query para relatórios de agendamentos

## Comparação de Performance

### Antes (sem React Query)
- Cada mudança de filtro = nova requisição
- Mesmo relatório carregado múltiplas vezes = múltiplas requisições
- Sem cache = sempre busca do servidor
- Estados manuais = mais código e bugs potenciais

### Depois (com React Query)
- Cache inteligente = menos requisições
- Deduplicação = uma requisição mesmo com múltiplas chamadas
- Background refetch = dados atualizados sem mostrar loading
- Estados automáticos = menos código e menos bugs

## Impacto Esperado

- **Redução de 60-80% nas requisições** para relatórios já visualizados
- **Melhoria de 50-70% no tempo percebido** de carregamento (dados em cache aparecem instantaneamente)
- **Redução de carga no servidor** devido ao cache
- **Melhor UX** com loading states mais inteligentes


