# Testes E2E - BarberManagement

Este documento descreve os testes E2E (End-to-End) criados para todas as telas do sistema.

## Estrutura dos Testes

Os testes foram criados usando **Rails System Tests** com **Capybara** e **Selenium**, seguindo o padrão do projeto.

### Arquivos Criados

1. **login_e2e_test.rb** - Testes para a tela de Login
2. **dashboard_e2e_test.rb** - Testes para o Dashboard
3. **transactions_e2e_test.rb** - Testes para Transações
4. **contacts_e2e_test.rb** - Testes para Contatos
5. **appointments_e2e_test.rb** - Testes para Agendamentos
6. **professionals_e2e_test.rb** - Testes para Profissionais
7. **services_e2e_test.rb** - Testes para Serviços
8. **working_hours_e2e_test.rb** - Testes para Horários de Trabalho
9. **imports_e2e_test.rb** - Testes para Importações
10. **reports_e2e_test.rb** - Testes para Relatórios (Agendamentos e Financeiros)

## Pré-requisitos

### 1. Frontend em Execução

O frontend React deve estar rodando na porta 5173:

```bash
cd FrontEnd
pnpm dev
```

### 2. Backend em Execução

O backend Rails deve estar rodando na porta 3000:

```bash
bin/dev
# ou
rails server
```

### 3. ChromeDriver

Certifique-se de que o ChromeDriver está instalado e acessível:

```bash
# macOS
brew install chromedriver

# Linux
sudo apt-get install chromium-chromedriver
```

## Executando os Testes

### Executar Todos os Testes E2E

```bash
rails test:system
```

### Executar um Arquivo Específico

```bash
rails test test/system/login_e2e_test.rb
rails test test/system/transactions_e2e_test.rb
```

### Executar um Teste Específico

```bash
rails test test/system/login_e2e_test.rb:8
```

### Executar com Output Detalhado

```bash
rails test:system --verbose
```

## Cobertura dos Testes

### Login (`login_e2e_test.rb`)
- ✅ Visitar página de login
- ✅ Verificar elementos do formulário
- ✅ Toggle de tipo de login
- ✅ Mostrar/ocultar senha
- ✅ Preencher formulário
- ✅ Criar usuário teste
- ✅ Estado de loading
- ✅ Mensagens de erro

### Dashboard (`dashboard_e2e_test.rb`)
- ✅ Visitar dashboard
- ✅ Botões do header
- ✅ Cards de estatísticas
- ✅ Gráficos
- ✅ Transações recentes
- ✅ Cards de ação rápida
- ✅ Navegação entre páginas
- ✅ Botão de atualizar

### Transações (`transactions_e2e_test.rb`)
- ✅ Visitar página
- ✅ Botões do header
- ✅ Cards de resumo
- ✅ Filtros
- ✅ Busca
- ✅ Modal de nova transação
- ✅ Formulário completo
- ✅ Modais rápidos (categoria, contato, centro de custo)
- ✅ Editar transação
- ✅ Excluir transação
- ✅ Paginação
- ✅ Exportar
- ✅ Tabela/Cards (responsivo)

### Contatos (`contacts_e2e_test.rb`)
- ✅ Visitar página
- ✅ Botões do header
- ✅ Cards de resumo
- ✅ Filtros por tipo
- ✅ Busca
- ✅ Modal de novo contato
- ✅ Formulário completo
- ✅ Editar contato
- ✅ Excluir contato
- ✅ Paginação
- ✅ Estado vazio
- ✅ Mensagens de erro

### Agendamentos (`appointments_e2e_test.rb`)
- ✅ Visitar página
- ✅ Botões do header
- ✅ Filtros (status, pagamento, profissional)
- ✅ Cards de estatísticas
- ✅ Modal de novo agendamento
- ✅ Formulário completo
- ✅ Editar agendamento
- ✅ Excluir com confirmação
- ✅ Atualizar status inline
- ✅ Atualizar status de pagamento inline
- ✅ Link de pagamento
- ✅ Exportar
- ✅ Tabela/Cards (responsivo)

### Profissionais (`professionals_e2e_test.rb`)
- ✅ Visitar página
- ✅ Botão de novo profissional
- ✅ Busca
- ✅ Modal de novo profissional
- ✅ Formulário completo
- ✅ Editar profissional
- ✅ Campo de senha opcional na edição
- ✅ Excluir profissional
- ✅ Tabela
- ✅ Estado vazio

### Serviços (`services_e2e_test.rb`)
- ✅ Visitar página
- ✅ Botão de novo serviço
- ✅ Busca
- ✅ Modal de novo serviço
- ✅ Formulário completo
- ✅ Editar serviço
- ✅ Excluir serviço
- ✅ Tabela/Cards (responsivo)
- ✅ Estado vazio

### Horários de Trabalho (`working_hours_e2e_test.rb`)
- ✅ Visitar página
- ✅ Seletor de profissional
- ✅ Botão de salvar
- ✅ Tabela de horários
- ✅ Toggle de dia ativo
- ✅ Preencher horários
- ✅ Toggle de intervalo
- ✅ Preencher horários de intervalo
- ✅ Salvar configuração
- ✅ Cards (mobile)
- ✅ Estado vazio

### Importações (`imports_e2e_test.rb`)
- ✅ Visitar página
- ✅ Botão de nova importação
- ✅ Filtros (estado, fonte)
- ✅ Busca
- ✅ Modal de nova importação
- ✅ Selecionar tipo de importação
- ✅ Tabela
- ✅ Menu de ações (dropdown)
- ✅ Arquivar importação
- ✅ Restaurar importação
- ✅ Excluir importação
- ✅ Paginação
- ✅ Barra de progresso
- ✅ Estado vazio

### Relatórios (`reports_e2e_test.rb`)
- ✅ Visitar relatórios de agendamentos
- ✅ Visitar relatórios financeiros
- ✅ Botões do header
- ✅ Filtros de data
- ✅ Cards de resumo
- ✅ Seleção de tipo de relatório
- ✅ Gráficos
- ✅ Tabelas
- ✅ Paginação (extrato)
- ✅ Exportar
- ✅ Atualizar
- ✅ Estados vazios

## Estrutura de um Teste

```ruby
test 'nome do teste' do
  visit "#{FRONTEND_URL}/rota"
  
  # Verificar elementos
  assert_text 'Texto esperado', wait: 5
  
  # Interagir com elementos
  click_button 'Nome do Botão'
  fill_in 'Campo', with: 'Valor'
  
  # Verificar resultado
  assert_text 'Resultado esperado'
end
```

## Boas Práticas

### 1. Aguardar Elementos

Sempre use `wait:` para aguardar elementos carregarem:

```ruby
assert_text 'Texto', wait: 5
```

### 2. Verificar Existência Antes de Interagir

```ruby
if page.has_button?('Botão', wait: 2)
  click_button 'Botão'
end
```

### 3. Lidar com Elementos Dinâmicos

Para elementos que podem não existir:

```ruby
if page.has_selector?('selector', wait: 2)
  # Interagir com elemento
end
```

### 4. Sleep para Operações Assíncronas

Use `sleep` quando necessário para operações que levam tempo:

```ruby
click_button 'Salvar'
sleep 2  # Aguardar requisição
```

## Troubleshooting

### Teste Falha com Timeout

- Verifique se o frontend está rodando
- Aumente o `wait:` nos asserts
- Adicione `sleep` após ações que disparam requisições

### Elemento Não Encontrado

- Verifique se o seletor está correto
- Use o browser inspector para verificar o HTML real
- Tente seletores alternativos (text, class, data-testid)

### Frontend Não Carrega

- Verifique se `http://localhost:5173` está acessível
- Verifique logs do frontend para erros
- Certifique-se de que não há bloqueios de CORS

### ChromeDriver Issues

- Atualize o ChromeDriver: `brew upgrade chromedriver`
- Verifique versão do Chrome: `google-chrome --version`
- Use ChromeDriver compatível com sua versão do Chrome

## Executando em CI/CD

Para executar em ambiente CI, configure:

```ruby
# test/application_system_test_case.rb
driver = ENV.fetch('CI', false).present? ? :headless_chrome : :chrome
```

E defina a variável de ambiente:

```bash
CI=true rails test:system
```

## Próximos Passos

1. **Adicionar Fixtures**: Criar dados de teste consistentes
2. **Helper Methods**: Criar métodos auxiliares para login, etc.
3. **Page Objects**: Considerar usar Page Objects para melhor organização
4. **Screenshots**: Adicionar capturas de tela em caso de falha
5. **Video Recording**: Gravar vídeos dos testes em execução

## Notas Importantes

- Os testes assumem que o frontend está rodando em `http://localhost:5173`
- Alguns testes podem precisar de dados pré-existentes no banco
- Testes que interagem com modais podem precisar de ajustes nos seletores
- Testes de mobile (viewport pequeno) podem ter comportamentos diferentes

## Contribuindo

Ao adicionar novos testes:

1. Siga o padrão existente
2. Use `data-testid` quando possível para seletores mais estáveis
3. Documente testes complexos
4. Mantenha testes independentes (não dependam de outros testes)
5. Limpe dados de teste após cada teste se necessário

