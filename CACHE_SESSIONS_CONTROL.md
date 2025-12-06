# Controle de Sessões, Contas e Cache para Produção

## Visão Geral

Foi implementado um sistema completo de controle de sessões, isolamento de contas e cache independente por endpoint, pensado para produção.

## Componentes Implementados

### 1. SessionManagement (app/controllers/concerns/session_management.rb)

Gerencia sessões de usuários usando Redis com as seguintes funcionalidades:

- **Validação de Sessão**: Verifica se a sessão é válida e não expirou
- **Criação de Sessão**: Cria novas sessões com TTL configurável
- **Atualização Automática**: Atualiza a sessão após cada requisição bem-sucedida
- **Invalidação**: Permite invalidar sessões específicas ou todas as sessões de um usuário/conta
- **Isolamento**: Cada sessão é isolada por usuário e conta

**Configuração**:
- TTL padrão: 24 horas (configurável via `SESSION_TTL_SECONDS`)
- Chave de sessão: `session:user:{user_id}:account:{account_id}`

**Uso**:
```ruby
# Criar sessão (automático após autenticação)
create_session(user, account)

# Invalidar sessão atual
invalidate_session

# Invalidar todas as sessões de um usuário
invalidate_all_user_sessions(user_id)

# Invalidar todas as sessões de uma conta
invalidate_all_account_sessions(account_id)
```

### 2. AccountCache (app/controllers/concerns/account_cache.rb)

Sistema de cache isolado por conta e endpoint:

- **Isolamento por Conta**: Cada conta tem seu próprio namespace de cache
- **Isolamento por Endpoint**: Cada endpoint pode ter seu próprio namespace
- **Cache Independente**: Endpoints não interferem uns nos outros
- **Invalidação Seletiva**: Permite limpar cache por endpoint ou por conta

**Uso**:
```ruby
# Cache com namespace automático por conta e endpoint
fetch_from_cache("chave", { expires_in: 15.minutes }, endpoint_namespace: 'meu_endpoint') do
  # Código que gera os dados
end

# Limpar cache de um endpoint específico
clear_endpoint_cache('meu_endpoint')

# Limpar todo o cache de uma conta
clear_account_cache

# Invalidar por tags
invalidate_cache_by_tags('transactions', 'reports', endpoint_namespace: 'reports')
```

### 3. Configuração de Cache Redis

**Produção** (`config/environments/production.rb`):
- Cache store: Redis
- Namespace: `barber_management_production_cache`
- TTL padrão: 1 hora
- Reconexão automática: 3 tentativas

**Staging** (`config/environments/staging.rb`):
- Cache store: Redis
- Namespace: `barber_management_staging_cache`
- Mesmas configurações de produção

### 4. ApplicationController da API v1

Atualizado para incluir:
- `SessionManagement`: Validação e gerenciamento de sessões
- `AccountCache`: Sistema de cache isolado
- Criação automática de sessão após autenticação

### 5. ReportsController

Todos os endpoints de relatórios foram atualizados para usar cache independente:

- `income_expense`: Cache de 15 minutos
- `category_analysis`: Cache de 15 minutos
- `monthly_summary`: Cache de 15 minutos
- `cash_flow`: Cache de 15 minutos
- `appointments_integrated`: Cache de 10 minutos
- `financial_with_appointments`: Cache de 10 minutos
- `dre`: Cache de 15 minutos
- `extract`: Cache de 5 minutos (devido à paginação)
- `per_category`: Cache de 15 minutos
- `per_description`: Cache de 15 minutos
- `per_period`: Cache de 15 minutos
- `financial_history`: Cache de 15 minutos

Cada endpoint tem seu próprio namespace de cache, garantindo independência total.

## Estrutura de Chaves de Cache

```
{namespace}:account:{account_id}:{endpoint_namespace}:{chave}
```

Exemplo:
```
barber_management_production_cache:account:123:income_expense:income_expense:2024-01-01:2024-01-31:due_date
```

## Estrutura de Chaves de Sessão

```
session:user:{user_id}:account:{account_id}
```

## Variáveis de Ambiente

- `REDIS_URL`: URL do Redis (padrão: `redis://localhost:6379/0`)
- `SESSION_TTL_SECONDS`: TTL da sessão em segundos (padrão: 86400 = 24 horas)

## Benefícios

1. **Isolamento Total**: Cada conta tem seus próprios dados em cache e sessão
2. **Independência de Endpoints**: Cada endpoint gerencia seu próprio cache
3. **Performance**: Cache reduz carga no banco de dados
4. **Escalabilidade**: Sistema preparado para múltiplos servidores
5. **Segurança**: Sessões isoladas por usuário e conta
6. **Manutenibilidade**: Fácil invalidação seletiva de cache

## Exemplo de Uso em Novos Controllers

```ruby
module Api
  module V1
    class MeuController < ApplicationController
      # Já inclui SessionManagement e AccountCache
      
      def index
        # Cache automático isolado por conta e endpoint
        dados = fetch_from_cache(
          "meus_dados:#{params[:filtro]}",
          { expires_in: 30.minutes },
          endpoint_namespace: 'index'
        ) do
          # Lógica que gera os dados
          MeuModel.where(account: Current.account).where(filtro: params[:filtro])
        end
        
        render json: { data: dados }
      end
      
      def create
        # Após criar, limpar cache do endpoint
        MeuModel.create!(params)
        clear_endpoint_cache('index')
        render json: { success: true }
      end
    end
  end
end
```

## Notas Importantes

1. **Cache é isolado por conta**: Não há risco de vazamento de dados entre contas
2. **Sessões expiram automaticamente**: TTL configurável via variável de ambiente
3. **Cache pode ser invalidado seletivamente**: Por endpoint, por conta ou por tags
4. **Redis é obrigatório**: O sistema requer Redis configurado
5. **Endpoints são independentes**: Limpar cache de um endpoint não afeta outros

