# Mapeamento de Elementos UI - BarberManagement

Este documento mapeia todos os botões, modais, formulários e tabelas de todas as telas do sistema.

---

## 1. Login (`/login`)

### Botões
- **Login Simples** - Alterna tipo de login
- **Login Completo** - Alterna tipo de login
- **Entrar** - Submete formulário de login (data-testid: "login-button")
- **Criar Usuário Teste** - Cria usuário de teste
- **Mostrar/Ocultar Senha** - Toggle de visibilidade da senha

### Formulários
- **Formulário de Login**
  - Campo: Email (data-testid: "email-input")
  - Campo: Senha (data-testid: "password-input")
  - Botão: Entrar

### Modais
- Nenhum

### Tabelas
- Nenhuma

---

## 2. Dashboard (`/`)

### Botões
- **Seletor de Período** - Seleciona período (Calendar icon)
- **Atualizar** - Recarrega dados do dashboard
- **Ver todas** - Navega para página de transações
- **Nova Transação** (Card clicável) - Navega para transações
- **Novo Contato** (Card clicável) - Navega para contatos
- **Relatórios** (Card clicável) - Navega para relatórios
- **Tentar novamente** - Recarrega dados em caso de erro

### Formulários
- Nenhum

### Modais
- Nenhum

### Tabelas
- Nenhuma (apenas cards de transações recentes)

---

## 3. Transações (`/transactions`)

### Botões
- **Mostrar/Ocultar Filtros** - Toggle de visibilidade dos filtros
- **Exportar** - Exporta transações para CSV
- **Nova Transação** - Abre modal de nova transação
- **Filtros** (Pills):
  - Todos (Wallet icon)
  - Receitas (TrendingUp icon)
  - Despesas (TrendingDown icon)
  - Transferências (ArrowUpDown icon)
- **Editar** (por transação) - Abre modal de edição
- **Excluir** (por transação) - Deleta transação
- **Anterior** (Paginação) - Página anterior
- **Próxima** (Paginação) - Próxima página
- **Cancelar** (Modais) - Fecha modal
- **Criar** (Modal Nova Transação) - Cria transação
- **Atualizar** (Modal Editar Transação) - Atualiza transação
- **Nova Categoria** (Dropdown) - Abre modal de nova categoria
- **Novo Contato** (Dropdown) - Abre modal de novo contato
- **Novo Centro de Custo** (Dropdown) - Abre modal de novo centro de custo

### Formulários

#### Modal: Nova Transação
- **Descrição** (Textarea) - Descrição da transação
- **Valor** (Input number) - Valor em reais
- **Tipo** (Select) - Tipo de transação (Receita, Despesa Fixa, etc.)
- **Data de Vencimento** (Input text com máscara) - dd/mm/aaaa
- **Data de Pagamento** (Input text com máscara) - dd/mm/aaaa
- **Categoria** (DropdownMenu) - Seleciona categoria
- **Centro de Custo** (DropdownMenu) - Seleciona centro de custo
- **Contato** (DropdownMenu) - Seleciona contato
- **Conta Bancária** (Select) - Seleciona conta bancária
- **Método de Pagamento** (Select) - Método de pagamento
- **Status** (Select) - Pendente/Pago

#### Modal: Editar Transação
- Mesmos campos do modal de Nova Transação

#### Modal: Nova Categoria
- **Nome da categoria** (Input) - Nome da categoria

#### Modal: Novo Contato
- **Nome do contato** (Input) - Nome do contato

#### Modal: Novo Centro de Custo
- **Nome do centro de custo** (Input) - Nome do centro de custo

### Modais
- **Nova Transação** - Dialog para criar transação
- **Editar Transação** - Dialog para editar transação
- **Nova Categoria** - Dialog para criar categoria rapidamente
- **Novo Contato** - Dialog para criar contato rapidamente
- **Novo Centro de Custo** - Dialog para criar centro de custo rapidamente

### Tabelas
- **Tabela de Transações (Desktop)**
  - Colunas: Vencimento, Descrição, Categoria, Valor, Tipo, Status, Ações
  - Ações: Editar, Excluir

---

## 4. Contatos (`/contacts`)

### Botões
- **Adicionar Contato** - Abre modal de novo contato
- **Filtros de Tipo** (Pills):
  - Todos
  - Cliente
  - Colaborador
  - Fornecedor
  - Sócio
  - Associado
- **Editar** (por contato) - Abre modal de edição
- **Excluir** (por contato) - Deleta contato
- **Anterior** (Paginação) - Página anterior
- **Próxima** (Paginação) - Próxima página
- **Números de Página** (Paginação) - Navega para página específica
- **Cancelar** (Modais) - Fecha modal
- **Salvar** (Modais) - Salva contato
- **✕** (Erro) - Fecha mensagem de erro

### Formulários

#### Modal: Novo Contato
- **Nome** (Input) - Nome completo (obrigatório)
- **Email** (Input email) - Email do contato
- **Telefone** (Input tel) - Telefone do contato
- **Documento** (Input) - CPF ou CNPJ
- **Tipo de Contato** (Select) - Cliente, Colaborador, Fornecedor, etc.
- **Observações** (Textarea) - Observações adicionais

#### Modal: Editar Contato
- Mesmos campos do modal de Novo Contato

### Modais
- **Novo Contato** - Dialog para criar contato
- **Editar Contato** - Dialog para editar contato

### Tabelas
- Nenhuma (apenas cards em grid)

---

## 5. Agendamentos (`/appointments`)

### Botões
- **Exportar** - Exporta agendamentos para CSV
- **Atualizar** - Recarrega agendamentos
- **Novo Agendamento** - Abre modal de novo agendamento
- **Editar** (por agendamento) - Abre modal de edição
- **Excluir** (por agendamento) - Abre confirmação de exclusão
- **Link de Pagamento** (ExternalLink) - Abre link de pagamento
- **Cancelar** (Modais) - Fecha modal
- **Salvar** (Modais) - Salva agendamento
- **Cancelar** (AlertDialog) - Cancela exclusão
- **Excluir** (AlertDialog) - Confirma exclusão

### Formulários

#### Modal: Novo Agendamento
- **Profissional** (Select) - Seleciona profissional (obrigatório)
- **Serviço** (Select) - Seleciona serviço (obrigatório)
- **Data/Hora Início** (Input datetime-local) - Data e hora de início (obrigatório)
- **Data/Hora Fim** (Input datetime-local) - Data e hora de fim (obrigatório)
- **WhatsApp do Cliente** (Input tel) - Número do WhatsApp (obrigatório)
- **Valor (R$)** (Input number) - Valor do agendamento (obrigatório)
- **Status** (Select) - Status do agendamento

#### Modal: Editar Agendamento
- Mesmos campos do modal de Novo Agendamento
- **Status Pagamento** (Select) - Status de pagamento adicional

### Modais
- **Novo Agendamento** - Dialog para criar agendamento
- **Editar Agendamento** - Dialog para editar agendamento
- **Confirmar Exclusão** (AlertDialog) - Confirmação de exclusão

### Tabelas
- **Tabela de Agendamentos (Desktop)**
  - Colunas: Cliente, Serviço, Profissional, Data/Hora, Valor, Status, Pagamento, Ações
  - Status e Pagamento são Selects editáveis inline
  - Ações: Link de Pagamento, Editar, Excluir

---

## 6. Relatórios de Agendamentos (`/appointment-reports`)

### Botões
- **Atualizar** - Recarrega relatórios
- **Exportar** - Exporta relatório para CSV

### Formulários

#### Filtros
- **Data Inicial** (Input date) - Data inicial do período
- **Data Final** (Input date) - Data final do período
- **Profissional** (Select) - Filtra por profissional

### Modais
- Nenhum

### Tabelas
- **Tabela de Relatório por Profissional (Desktop)**
  - Colunas: Data, Serviço, Cliente, Valor, Comissão
  - Agrupada por profissional

---

## 7. Relatórios Financeiros (`/financial-reports`)

### Botões
- **Atualizar** - Recarrega relatório
- **Exportar** - Exporta relatório
- **Cards de Seleção de Relatório** - Seleciona tipo de relatório:
  - DRE
  - Extrato
  - Histórico Financeiro
  - Por Categoria
  - Por Descrição
  - Por Período
  - Receitas vs Despesas
  - Análise por Categoria
  - Resumo Mensal
  - Fluxo de Caixa
  - Agendamentos Integrado
  - Financeiro Completo
- **Anterior** (Paginação Extrato) - Página anterior
- **Próxima** (Paginação Extrato) - Próxima página

### Formulários

#### Filtros
- **Data Inicial** (Input date) - Data inicial do período
- **Data Final** (Input date) - Data final do período
- **Conta Bancária** (Select) - Filtra por conta (apenas para Extrato)

### Modais
- Nenhum

### Tabelas
- **Tabela de Extrato (Desktop)**
  - Colunas: Data, Descrição, Categoria, Contato, Valor, Saldo, Status
- **Tabela de Despesas por Categoria**
  - Colunas: Categoria, Valor, Percentual
- **Tabela de Despesas por Descrição**
  - Colunas: Descrição, Valor
- **Tabela de Despesas por Período**
  - Colunas: Período, Valor
- **Tabela de Análise por Categoria**
  - Colunas: Categoria, Valor Total, Quantidade
- **Tabela de Fluxo de Caixa**
  - Colunas: Mês, Receitas, Despesas, Saldo

---

## 8. Profissionais (`/professionals`)

### Botões
- **Novo Profissional** - Abre modal de novo profissional
- **Editar** (por profissional) - Abre modal de edição
- **Excluir** (por profissional) - Deleta profissional
- **Cancelar** (Modal) - Fecha modal
- **Criar/Atualizar** (Modal) - Salva profissional

### Formulários

#### Modal: Novo Profissional
- **Nome** (Input) - Primeiro nome (obrigatório)
- **Sobrenome** (Input) - Sobrenome (obrigatório)
- **Email** (Input email) - Email (obrigatório)
- **Telefone** (Input tel) - Telefone
- **Senha** (Input password) - Senha (obrigatório para novo)
- **Função** (Select) - Profissional ou Administrador

#### Modal: Editar Profissional
- Mesmos campos do modal de Novo Profissional
- **Nova Senha (opcional)** (Input password) - Deixe em branco para não alterar

### Modais
- **Novo/Editar Profissional** - Dialog para criar/editar profissional

### Tabelas
- **Tabela de Profissionais**
  - Colunas: Nome, Email, Telefone, Função, Ações
  - Ações: Editar, Excluir

---

## 9. Serviços (`/services`)

### Botões
- **Novo Serviço** - Abre modal de novo serviço
- **Editar** (por serviço) - Abre modal de edição
- **Excluir** (por serviço) - Deleta serviço
- **Cancelar** (Modal) - Fecha modal
- **Criar/Atualizar** (Modal) - Salva serviço

### Formulários

#### Modal: Novo Serviço
- **Nome do Serviço** (Input) - Nome (obrigatório)
- **Descrição** (Textarea) - Descrição detalhada
- **Preço de Custo (R$)** (Input number) - Preço de custo
- **Preço de Venda (R$)** (Input number) - Preço de venda (obrigatório)
- **Unidade** (Input) - Unidade de medida

#### Modal: Editar Serviço
- Mesmos campos do modal de Novo Serviço

### Modais
- **Novo/Editar Serviço** - Dialog para criar/editar serviço

### Tabelas
- **Tabela de Serviços (Desktop)**
  - Colunas: Nome, Descrição, Preço de Custo, Preço de Venda, Status, Ações
  - Ações: Editar, Excluir

---

## 10. Horários de Trabalho (`/working-hours`)

### Botões
- **Salvar Horários** - Salva configuração de horários
- **Checkbox Ativo** (por dia) - Ativa/desativa dia da semana
- **Checkbox Intervalo** (por dia) - Ativa/desativa intervalo

### Formulários

#### Seletor de Profissional
- **Profissional** (Select) - Seleciona profissional para configurar horários

#### Configuração de Horários (por dia da semana)
- **Ativo** (Checkbox) - Ativa/desativa o dia
- **Horário Início** (Input time) - Horário de início
- **Horário Fim** (Input time) - Horário de fim
- **Tem intervalo?** (Checkbox) - Ativa/desativa intervalo
- **Início Intervalo** (Input time) - Horário de início do intervalo
- **Fim Intervalo** (Input time) - Horário de fim do intervalo

### Modais
- Nenhum

### Tabelas
- **Tabela de Horários (Desktop)**
  - Colunas: Dia da Semana, Ativo, Horário Início, Horário Fim, Intervalo, Início Intervalo, Fim Intervalo
  - 7 linhas (um para cada dia da semana)

---

## 11. Importações (`/imports`)

### Botões
- **Nova Importação** - Abre modal de upload
- **Cancelar** (Modal) - Fecha modal
- **Importar** (Modal) - Faz upload do arquivo
- **Anterior** (Paginação) - Página anterior
- **Próxima** (Paginação) - Próxima página
- **Menu de Ações** (DropdownMenu por importação):
  - **Arquivar** - Arquiva importação
  - **Restaurar** - Restaura importação arquivada
  - **Remover** - Remove importação

### Formulários

#### Modal: Nova Importação
- **Tipo de Importação** (Select) - Planilha Padrão, Planilha de Contatos, Zero Paper
- **Arquivo** (Input file) - Seleciona arquivo (.xlsx, .xls, .csv)

#### Filtros
- **Buscar** (Input) - Busca por nome do arquivo
- **Estado** (Select) - Filtra por estado (Todos, Aguardando, Em progresso, Concluído, Falhou)
- **Fonte** (Select) - Filtra por fonte (Todas, Planilha Padrão, Planilha de Contatos, Zero Paper)

### Modais
- **Nova Importação** - Dialog para fazer upload de arquivo

### Tabelas
- **Tabela de Importações**
  - Colunas: Arquivo, Fonte, Estado, Progresso, Transações, Data, Ações
  - Ações: Menu dropdown com opções (Arquivar/Restaurar/Remover)

---

## Resumo por Tipo de Elemento

### Total de Botões Identificados
- **Login**: 5 botões
- **Dashboard**: 6 botões
- **Transações**: ~20 botões
- **Contatos**: ~15 botões
- **Agendamentos**: ~10 botões
- **Relatórios de Agendamentos**: 2 botões
- **Relatórios Financeiros**: ~15 botões
- **Profissionais**: 5 botões
- **Serviços**: 5 botões
- **Horários de Trabalho**: ~10 botões
- **Importações**: ~10 botões

**Total aproximado: ~103 botões**

### Total de Modais Identificados
- **Login**: 0 modais
- **Dashboard**: 0 modais
- **Transações**: 5 modais
- **Contatos**: 2 modais
- **Agendamentos**: 3 modais
- **Relatórios de Agendamentos**: 0 modais
- **Relatórios Financeiros**: 0 modais
- **Profissionais**: 1 modal
- **Serviços**: 1 modal
- **Horários de Trabalho**: 0 modais
- **Importações**: 1 modal

**Total: 13 modais**

### Total de Formulários Identificados
- **Login**: 1 formulário
- **Dashboard**: 0 formulários
- **Transações**: 6 formulários (1 principal + 5 modais rápidos)
- **Contatos**: 2 formulários
- **Agendamentos**: 2 formulários
- **Relatórios de Agendamentos**: 1 formulário (filtros)
- **Relatórios Financeiros**: 1 formulário (filtros)
- **Profissionais**: 1 formulário
- **Serviços**: 1 formulário
- **Horários de Trabalho**: 1 formulário (configuração)
- **Importações**: 1 formulário

**Total: 17 formulários**

### Total de Tabelas Identificadas
- **Login**: 0 tabelas
- **Dashboard**: 0 tabelas
- **Transações**: 1 tabela (desktop)
- **Contatos**: 0 tabelas (usa cards)
- **Agendamentos**: 1 tabela (desktop)
- **Relatórios de Agendamentos**: 1 tabela
- **Relatórios Financeiros**: 6 tabelas (dependendo do relatório)
- **Profissionais**: 1 tabela
- **Serviços**: 1 tabela (desktop)
- **Horários de Trabalho**: 1 tabela (desktop)
- **Importações**: 1 tabela

**Total: 13 tabelas**

---

## Observações Importantes

1. **Responsividade**: A maioria das telas possui layouts diferentes para mobile (cards) e desktop (tabelas)

2. **Paginação**: Várias telas implementam paginação (Transações, Contatos, Importações, Extrato)

3. **Filtros**: Muitas telas possuem filtros avançados (Transações, Contatos, Agendamentos, Relatórios, Importações)

4. **Validação**: Formulários possuem validação client-side e campos obrigatórios marcados

5. **Estados de Loading**: Botões de ação mostram estados de loading durante operações assíncronas

6. **Confirmações**: Ações destrutivas (excluir) possuem confirmação via AlertDialog ou confirm()

7. **Exportação**: Várias telas permitem exportação de dados (Transações, Agendamentos, Relatórios)

