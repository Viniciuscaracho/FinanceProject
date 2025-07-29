# Integração Frontend-Backend

Este documento descreve a integração entre o frontend React e o backend Rails.

## 🏗️ Arquitetura

### Backend (Rails)
- **Porta**: 3000
- **API**: `/api/v1/*`
- **Banco de dados**: PostgreSQL (porta 9999)
- **Cache**: Redis

### Frontend (React)
- **Porta**: 5173
- **Framework**: React + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Proxy**: Configurado para `/api/*` → `localhost:3000`

## 🚀 Iniciando o Ambiente

### Opção 1: Script Automático
```bash
./start-dev.sh
```

### Opção 2: Manual
```bash
# Terminal 1 - Backend
./bin/dev

# Terminal 2 - Frontend
cd FrontEnd
npm run dev
```

## 📡 Endpoints da API

### Autenticação
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/login_simple` - Login simples
- `GET /api/v1/auth/me` - Usuário atual
- `POST /api/v1/auth/logout` - Logout

### Dashboard
- `GET /api/v1/dashboard` - Dados do dashboard
- `GET /api/v1/dashboard/recent_transactions` - Transações recentes
- `GET /api/v1/dashboard/statistics` - Estatísticas

### Transações
- `GET /api/v1/transactions` - Listar transações
- `POST /api/v1/transactions` - Criar transação
- `GET /api/v1/transactions/:id` - Ver transação
- `PUT /api/v1/transactions/:id` - Atualizar transação
- `DELETE /api/v1/transactions/:id` - Excluir transação

### Contatos
- `GET /api/v1/contacts` - Listar contatos
- `POST /api/v1/contacts` - Criar contato
- `GET /api/v1/contacts/:id` - Ver contato
- `PUT /api/v1/contacts/:id` - Atualizar contato
- `DELETE /api/v1/contacts/:id` - Excluir contato

### Categorias
- `GET /api/v1/categories` - Listar categorias
- `POST /api/v1/categories` - Criar categoria
- `PUT /api/v1/categories/:id` - Atualizar categoria
- `DELETE /api/v1/categories/:id` - Excluir categoria

### Centros de Custo
- `GET /api/v1/cost_centers` - Listar centros de custo
- `POST /api/v1/cost_centers` - Criar centro de custo
- `PUT /api/v1/cost_centers/:id` - Atualizar centro de custo
- `DELETE /api/v1/cost_centers/:id` - Excluir centro de custo

### Contas Bancárias
- `GET /api/v1/bank_accounts` - Listar contas bancárias
- `POST /api/v1/bank_accounts` - Criar conta bancária
- `GET /api/v1/bank_accounts/:id` - Ver conta bancária
- `PUT /api/v1/bank_accounts/:id` - Atualizar conta bancária
- `DELETE /api/v1/bank_accounts/:id` - Excluir conta bancária

## 🔧 Configuração

### Backend
O backend está configurado para:
- Aceitar requisições CORS do frontend
- Usar autenticação JWT
- Retornar dados formatados para o frontend

### Frontend
O frontend está configurado para:
- Usar proxy para requisições API
- Gerenciar estado de autenticação
- Formatar dados para exibição

## 📊 Estrutura de Dados

### Transação
```json
{
  "id": 1,
  "name": "Venda de produtos",
  "description": "Venda de produtos diversos",
  "amount_cents": 150000,
  "formatted_amount": 1500.00,
  "transaction_type": "revenue",
  "transaction_type_name": "Receita",
  "due_date": "2025-07-29",
  "formatted_due_date": "29/07/2025",
  "paid": false,
  "payment_method_cd": 1,
  "payment_method_name": "Dinheiro",
  "category": { "id": 1, "name": "Vendas" },
  "contact": { "id": 1, "name": "João Silva" },
  "cost_center": { "id": 1, "name": "Vendas" }
}
```

### Contato
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "(11) 99999-9999",
  "document": "123.456.789-00",
  "notes": "Cliente importante",
  "created_at": "2025-07-29T10:00:00Z"
}
```

## 🎨 Interface

### Páginas Implementadas
- **Dashboard**: Visão geral com gráficos e estatísticas
- **Transações**: Lista, criação, edição e exclusão
- **Contatos**: Lista, criação, edição e exclusão
- **Login**: Autenticação de usuários

### Componentes
- **Layout**: Estrutura principal com navegação
- **Cards**: Exibição de dados em cards
- **Tables**: Tabelas para listagem
- **Forms**: Formulários para criação/edição
- **Modals**: Diálogos para ações

## 🔐 Autenticação

O sistema usa autenticação JWT:
1. Usuário faz login
2. Backend retorna token JWT
3. Frontend armazena token no localStorage
4. Token é enviado em todas as requisições
5. Backend valida token e retorna dados

## 🚨 Tratamento de Erros

### Frontend
- Exibição de mensagens de erro
- Estados de loading
- Retry automático em falhas
- Fallback para dados mock

### Backend
- Validação de dados
- Mensagens de erro estruturadas
- Logs detalhados
- Status HTTP apropriados

## 📈 Melhorias Implementadas

1. **Dados Reais**: Frontend conectado ao backend real
2. **Formatação**: Dados formatados adequadamente
3. **Proxy**: Configuração de proxy para desenvolvimento
4. **Estados**: Loading, error e success states
5. **Validação**: Validação de formulários
6. **Responsividade**: Interface responsiva
7. **UX**: Melhor experiência do usuário

## 🔄 Próximos Passos

1. **Testes**: Implementar testes automatizados
2. **Cache**: Implementar cache no frontend
3. **Offline**: Suporte para modo offline
4. **PWA**: Transformar em Progressive Web App
5. **Performance**: Otimizações de performance
6. **Segurança**: Melhorias de segurança
7. **Monitoramento**: Logs e métricas

## 🛠️ Desenvolvimento

### Comandos Úteis
```bash
# Verificar status do backend
curl http://localhost:3000/api/v1/health

# Verificar logs do Rails
tail -f log/development.log

# Verificar logs do frontend
cd FrontEnd && npm run dev

# Resetar banco de dados
./bin/db-reset

# Executar testes
bundle exec rspec
```

### Debug
- Backend: `rails console`
- Frontend: DevTools do navegador
- API: Postman ou Insomnia
- Banco: `psql -h localhost -p 9999 -U postgres` 