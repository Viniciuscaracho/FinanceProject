# 🧪 Bateria de Testes - Funcionalidades do Sistema

## Checklist de Testes

### ✅ 1. Autenticação e Login
- [ ] Login com email e senha funciona
- [ ] Token de autenticação é gerado corretamente
- [ ] Token é salvo no localStorage
- [ ] Requisições autenticadas funcionam
- [ ] Logout limpa o token

### ✅ 2. Página de Profissionais
- [ ] Lista profissionais corretamente
- [ ] Busca por nome/email funciona
- [ ] Criar novo profissional funciona
- [ ] Editar profissional funciona
- [ ] Excluir profissional funciona
- [ ] Validações de campos obrigatórios funcionam
- [ ] Senha é gerada automaticamente se não informada

### ✅ 3. Página de Serviços
- [ ] Lista serviços corretamente
- [ ] Busca por nome funciona
- [ ] Criar novo serviço funciona
- [ ] Editar serviço funciona
- [ ] Excluir serviço funciona
- [ ] Preços são formatados corretamente
- [ ] Validações de campos obrigatórios funcionam

### ✅ 4. Página de Horários
- [ ] Lista profissionais disponíveis
- [ ] Seleção de profissional funciona
- [ ] Configuração de horários por dia funciona
- [ ] Ativar/desativar dia funciona
- [ ] Configuração de intervalo funciona
- [ ] Salvar horários funciona

### ✅ 5. Página de Agendamentos
- [ ] Lista agendamentos corretamente
- [ ] Filtros por status funcionam
- [ ] Filtros por pagamento funcionam
- [ ] Filtros por profissional funcionam
- [ ] Busca funciona
- [ ] Estatísticas são exibidas corretamente
- [ ] Atualizar status funciona
- [ ] Link de pagamento é exibido quando disponível

### ✅ 6. Página de Relatórios Financeiros
- [ ] Filtros por período funcionam
- [ ] Filtro por profissional funciona
- [ ] Resumo é exibido corretamente
- [ ] Gráficos são renderizados
- [ ] Relatório por profissional é exibido
- [ ] Valores são formatados corretamente

### ✅ 7. API Endpoints

#### Profissionais
- [ ] GET /api/v1/professionals - Lista profissionais
- [ ] GET /api/v1/professionals/:id - Mostra profissional
- [ ] POST /api/v1/professionals - Cria profissional
- [ ] PATCH /api/v1/professionals/:id - Atualiza profissional
- [ ] DELETE /api/v1/professionals/:id - Exclui profissional

#### Serviços
- [ ] GET /api/v1/services - Lista serviços
- [ ] GET /api/v1/services/:id - Mostra serviço
- [ ] POST /api/v1/services - Cria serviço
- [ ] PATCH /api/v1/services/:id - Atualiza serviço
- [ ] DELETE /api/v1/services/:id - Exclui serviço

#### Agendamentos
- [ ] GET /api/v1/appointments - Lista agendamentos
- [ ] GET /api/v1/appointments/:id - Mostra agendamento
- [ ] POST /api/v1/appointments - Cria agendamento
- [ ] GET /api/v1/appointments/services - Lista serviços
- [ ] GET /api/v1/appointments/professionals - Lista profissionais
- [ ] GET /api/v1/appointments/available_slots - Lista horários disponíveis

#### Relatórios
- [ ] GET /api/v1/appointment_reports/summary - Resumo
- [ ] GET /api/v1/appointment_reports/by_professional - Por profissional

## Problemas Encontrados e Corrigidos

### 1. ✅ Corrigido: `current_account` não definido
**Problema:** Controllers de Professionals e Services não tinham método `current_account`
**Solução:** Adicionado método `current_account` que retorna `Current.account`

### 2. ✅ Corrigido: `enabled` usado como scope
**Problema:** `enabled` é um campo string ('t'/'f'), não um scope
**Solução:** Alterado para `.where(enabled: 't')` em vez de `.enabled` nos controllers:
- `app/controllers/api/v1/services_controller.rb`
- `app/controllers/api/v1/appointments_controller.rb`

### 3. ✅ Corrigido: Valor de `enabled` no create
**Problema:** Tentando definir `enabled = true` quando deveria ser string
**Solução:** Alterado para `enabled = 't'` no create de serviços

### 4. ✅ Corrigido: Retorno de `enabled` no JSON
**Problema:** Retornando string 't'/'f' em vez de boolean
**Solução:** Alterado para `service.enabled == 't'` no JSON de serviços

### 5. ✅ Corrigido: `phone_number` não sendo salvo
**Problema:** Campo `phone_number` não estava sendo incluído no create e update
**Solução:** Adicionado `phone_number` nos parâmetros permitidos e no create/update

### 6. ✅ Corrigido: Account pode ser nil
**Problema:** `@current_user.account` pode ser nil se usuário não tiver account direta
**Solução:** Alterado `set_current_account` para usar `@current_user.account || @current_user.accounts.first` e adicionar validação

## Testes Manuais Recomendados

### Teste 1: Criar Profissional
1. Acessar `/professionals`
2. Clicar em "Novo Profissional"
3. Preencher: Nome, Sobrenome, Email
4. Deixar senha em branco (deve gerar automaticamente)
5. Salvar
6. Verificar se aparece na lista

### Teste 2: Criar Serviço
1. Acessar `/services`
2. Clicar em "Novo Serviço"
3. Preencher: Nome, Preço de Venda
4. Salvar
5. Verificar se aparece na lista com preço formatado

### Teste 3: Configurar Horários
1. Acessar `/working-hours`
2. Selecionar um profissional
3. Ativar segunda-feira
4. Definir horário 09:00 - 18:00
5. Ativar intervalo 12:00 - 13:00
6. Salvar
7. Recarregar página e verificar se salvou

### Teste 4: Listar Agendamentos
1. Acessar `/appointments`
2. Verificar se lista carrega
3. Testar filtros
4. Verificar estatísticas

### Teste 5: Relatórios
1. Acessar `/appointment-reports`
2. Selecionar período
3. Verificar se resumo carrega
4. Verificar gráficos

## Comandos para Testar API

```bash
# Testar listagem de profissionais
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/v1/professionals

# Testar criação de profissional
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"professional":{"first_name":"João","last_name":"Silva","email":"joao@test.com"}}' \
  http://localhost:3000/api/v1/professionals

# Testar listagem de serviços
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/v1/services

# Testar criação de serviço
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"service":{"name":"Corte de Cabelo","selling_price_cents":5000}}' \
  http://localhost:3000/api/v1/services
```

## Próximos Passos

1. Executar testes manuais em cada funcionalidade
2. Verificar logs do Rails para erros
3. Testar com dados reais
4. Verificar validações
5. Testar casos de erro (dados inválidos, etc.)

