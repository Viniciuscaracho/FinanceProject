# Documentação dos Filtros de Transações

## 📋 Visão Geral

Esta documentação identifica todos os filtros disponíveis na tela de transações, suas funcionalidades e valores possíveis.

---

## 🔍 Filtros Principais (Sempre Visíveis)

### 1. **Período (Data Inicial e Final)**
- **Tipo**: Input de texto com máscara de data
- **Formato**: `dd/mm/aaaa`
- **Campos**:
  - `startDate`: Data inicial do período
  - `endDate`: Data final do período
- **Funcionalidade**: Filtra transações por intervalo de datas
- **Observação**: O tipo de data usado (pagamento/competência) é controlado pelo filtro "Tipo de data"

### 2. **Categorias**
- **Tipo**: Select dropdown
- **Estado**: `selectedCategoryIds` (array)
- **Valores**: Lista de categorias cadastradas (limitado a 20 primeiras)
- **Opção padrão**: "Todas" (sem filtro)
- **Funcionalidade**: Filtra transações por categoria

### 3. **Contas Bancárias**
- **Tipo**: Select dropdown
- **Estado**: `selectedBankAccountIds` (array)
- **Valores**: Lista de contas bancárias cadastradas
- **Opção padrão**: "Todas" (sem filtro)
- **Funcionalidade**: Filtra transações por conta bancária

### 4. **Status de Pagamento (Checkboxes)**
- **Tipo**: Checkboxes
- **Estados**:
  - `includePaid`: Incluir transações pagas (padrão: `true`)
  - `includeUnpaid`: Incluir transações não pagas (padrão: `true`)
- **Funcionalidade**: Controla quais transações são exibidas baseado no status de pagamento

### 5. **Botão "Limpar"**
- **Tipo**: Botão ghost
- **Funcionalidade**: Reseta todos os filtros para valores padrão

### 6. **Contador de Resultados**
- **Tipo**: Texto informativo
- **Exibição**: `{totalCount} resultado(s)`
- **Funcionalidade**: Mostra quantas transações correspondem aos filtros aplicados

---

## 🔽 Filtros Adicionais (Expandíveis - Botão "Mais Filtros")

### 7. **Centros de Custo**
- **Tipo**: Select dropdown
- **Estado**: `selectedCostCenterIds` (array)
- **Valores**: Lista de centros de custo cadastrados
- **Opção padrão**: "Todos" (sem filtro)
- **Funcionalidade**: Filtra transações por centro de custo

### 8. **Contatos**
- **Tipo**: Select dropdown
- **Estado**: `selectedContactIds` (array)
- **Valores**: Lista de contatos cadastrados (limitado a 20 primeiros)
- **Opção padrão**: "Todos" (sem filtro)
- **Funcionalidade**: Filtra transações por contato (cliente, fornecedor, etc.)

### 9. **Modos de Pagamento**
- **Tipo**: Select dropdown
- **Estado**: `selectedPaymentMethods` (array)
- **Valores** (correspondem aos códigos do backend):
  - `5`: Dinheiro (Cash)
  - `1`: Cartão de Crédito (Credit Card)
  - `2`: Cartão de Débito (Debit Card)
  - `6`: PIX
  - `7`: Transferência (Bank Transfer)
  - `3`: Boleto (Bank Slip)
  - `4`: Cheque (Check)
- **Opção padrão**: "Todos" (sem filtro)
- **Funcionalidade**: Filtra transações pelo método de pagamento utilizado

**✅ CORRIGIDO**: Os valores do frontend agora correspondem aos códigos do backend conforme definido em `Transactions::Constants::PAYMENT_METHOD`.

### 10. **Tipo de Pagamento**
- **Tipo**: Select dropdown
- **Estado**: `selectedPaymentTypes` (array)
- **Valores**:
  - `0`: À vista (On Cash)
  - `1`: Parcelado (Installment)
  - `2`: Recorrente (Recurring)
- **Opção padrão**: "Todos" (sem filtro)
- **Funcionalidade**: Filtra transações pelo tipo de pagamento (à vista, parcelado ou recorrente)

### 11. **Tags**
- **Tipo**: Select dropdown
- **Estado**: `selectedTagIds` (array)
- **Valores**: Lista de tags associadas às transações
- **Opção padrão**: "Todas" (sem filtro)
- **Funcionalidade**: Filtra transações por tags (usando `ActsAsTaggableOn`)

### 12. **Tipo de Data**
- **Tipo**: Select dropdown
- **Estado**: `dateType` (string)
- **Valores**:
  - `payment`: Por pagamento (usa `paid_at` ou `due_date`)
  - `competency`: Por competência (usa `competency_date`)
- **Padrão**: `payment`
- **Funcionalidade**: Define qual campo de data será usado para os filtros de período

---

## 🔄 Estados e Variáveis

### Estados React
```javascript
const [startDate, setStartDate] = useState('')
const [endDate, setEndDate] = useState('')
const [selectedCategoryIds, setSelectedCategoryIds] = useState([])
const [selectedCostCenterIds, setSelectedCostCenterIds] = useState([])
const [selectedBankAccountIds, setSelectedBankAccountIds] = useState([])
const [selectedContactIds, setSelectedContactIds] = useState([])
const [selectedTagIds, setSelectedTagIds] = useState([])
const [selectedPaymentMethods, setSelectedPaymentMethods] = useState([])
const [selectedPaymentTypes, setSelectedPaymentTypes] = useState([])
const [includePaid, setIncludePaid] = useState(true)
const [includeUnpaid, setIncludeUnpaid] = useState(true)
const [dateType, setDateType] = useState('payment')
const [showMoreFilters, setShowMoreFilters] = useState(false)
```

---

## 📡 Parâmetros da API

Os filtros são enviados para o backend através dos seguintes parâmetros:

| Filtro | Parâmetro API | Tipo | Descrição |
|--------|---------------|------|-----------|
| Período Inicial | `start_date` | String (dd/mm/aaaa) | Data inicial |
| Período Final | `end_date` | String (dd/mm/aaaa) | Data final |
| Tipo de Data | `date_type` | String | `payment` ou `competency` |
| Categorias | `category_ids[]` | Array de IDs | IDs das categorias |
| Centros de Custo | `cost_center_ids[]` | Array de IDs | IDs dos centros de custo |
| Contas Bancárias | `bank_account_ids[]` | Array de IDs | IDs das contas bancárias |
| Contatos | `contact_ids[]` | Array de IDs | IDs dos contatos |
| Modos de Pagamento | `payment_methods[]` | Array de Inteiros | Códigos dos métodos |
| Tipos de Pagamento | `payment_types[]` | Array de Inteiros | Códigos dos tipos |
| Status Pago | `paid[]` | Array de Boolean | `true` ou `false` |
| Tags | `tag_ids[]` | Array de IDs | IDs das tags |

---

## ✅ Correções Aplicadas

### 1. Códigos de Payment Method Corrigidos

**Backend (Ruby)**:
```ruby
PAYMENT_METHOD = {
  no_payment_method: 0,
  credit_card: 1,
  debit_card: 2,
  bank_slip: 3,
  check: 4,
  cash: 5,
  pix: 6,
  bank_transfer: 7,
  direct_debit: 8,
  promissory: 9
}
```

**Frontend (Corrigido)**:
```javascript
<SelectItem value="5">Dinheiro</SelectItem>        // cash: 5
<SelectItem value="1">Cartão de Crédito</SelectItem> // credit_card: 1
<SelectItem value="2">Cartão de Débito</SelectItem>  // debit_card: 2
<SelectItem value="6">PIX</SelectItem>              // pix: 6
<SelectItem value="7">Transferência</SelectItem>     // bank_transfer: 7
<SelectItem value="3">Boleto</SelectItem>           // bank_slip: 3
<SelectItem value="4">Cheque</SelectItem>           // check: 4
```

**✅ Status**: Os valores do frontend agora correspondem corretamente aos códigos do backend.

---

## 📝 Notas de Implementação

1. **Aplicação Automática**: Os filtros são aplicados automaticamente quando alterados (sem botão "Aplicar")
2. **Debounce**: A busca por texto usa debounce para evitar muitas requisições
3. **Paginação**: Os resultados são paginados (20 por página por padrão)
4. **Performance**: Usa `React Query` para cache e gerenciamento de estado de requisições
5. **Responsividade**: Os filtros se adaptam a telas mobile e desktop

---

## 🔧 Melhorias Sugeridas

1. Corrigir mapeamento de códigos de payment_method
2. Adicionar suporte a múltiplas seleções em alguns filtros (atualmente apenas um valor por vez)
3. Adicionar filtros salvos/presets
4. Adicionar histórico de filtros recentes
5. Melhorar feedback visual quando filtros estão ativos

