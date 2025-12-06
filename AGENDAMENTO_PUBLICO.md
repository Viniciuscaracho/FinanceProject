# Sistema de Agendamento Público Estilo Calendly

## Visão Geral

Foi implementado um sistema completo de agendamento público no estilo Calendly, permitindo que estabelecimentos gerem links únicos que podem ser compartilhados com clientes. Os clientes podem selecionar serviços, profissionais, datas e horários disponíveis através de uma interface moderna e intuitiva.

## Componentes Implementados

### 1. Modelo `AppointmentLink`

**Arquivo:** `app/models/appointment_link.rb`

- Armazena links únicos de agendamento por estabelecimento (account)
- Cada link possui um token único de 32 caracteres
- Permite pré-selecionar serviço e/ou profissional
- Possui configurações customizáveis (horários, duração, etc.)
- Método `public_url` para gerar URL pública do link

**Campos principais:**
- `token`: Token único para acesso público
- `name`: Nome do link de agendamento
- `description`: Descrição opcional
- `active`: Status ativo/inativo
- `service_id`: ID do serviço pré-selecionado (opcional)
- `account_user_id`: ID do profissional pré-selecionado (opcional)
- `settings`: JSONB com configurações customizáveis

### 2. Controller Público de Agendamento

**Arquivo:** `app/controllers/public/appointment_booking_controller.rb`

- `GET /agendar/:token`: Redireciona para o frontend React
- `POST /agendar/:token/book`: Cria novo agendamento
- `GET /agendamento/sucesso`: Página de sucesso após agendamento

**Funcionalidades:**
- Não requer autenticação (skip_before_action)
- Busca ou cria contato automaticamente pelo WhatsApp
- Calcula preço e duração do serviço automaticamente
- Integra com Stripe para pagamento (se configurado)

### 3. API Pública de Dados

**Arquivo:** `app/controllers/api/v1/public/appointment_data_controller.rb`

Endpoints públicos (sem autenticação):

- `GET /api/v1/public/appointment_data/:token/services`
  - Lista serviços disponíveis para o link
  
- `GET /api/v1/public/appointment_data/:token/professionals`
  - Lista profissionais disponíveis para o link
  
- `GET /api/v1/public/appointment_data/:token/available_slots`
  - Retorna horários disponíveis
  - Parâmetros: `professional_id`, `date`, `service_id` (opcional)
  - Considera configurações de horário de funcionamento e duração

### 4. Página React de Agendamento

**Arquivo:** `FrontEnd/src/pages/PublicAppointmentBooking.jsx`

Interface completa em 4 passos:

1. **Seleção de Serviço**: Lista todos os serviços disponíveis
2. **Seleção de Profissional**: Lista profissionais disponíveis
3. **Seleção de Data e Horário**: Calendário interativo + slots de horário
4. **Informações do Cliente**: Nome, WhatsApp e e-mail

**Recursos:**
- Design moderno e responsivo
- Indicador de progresso visual
- Validação de formulários
- Tratamento de erros
- Redirecionamento para pagamento após agendamento

### 5. Rotas

**Rotas Web (`config/routes/web.rb`):**
```ruby
get '/agendar/:token', to: 'public/appointment_booking#show'
post '/agendar/:token/book', to: 'public/appointment_booking#create'
get '/agendamento/sucesso', to: 'public/appointment_booking#success'
```

**Rotas API (`config/routes/api.rb`):**
```ruby
namespace :public do
  get 'appointment_data/:token/services', to: 'appointment_data#services'
  get 'appointment_data/:token/professionals', to: 'appointment_data#professionals'
  get 'appointment_data/:token/available_slots', to: 'appointment_data#available_slots'
end
```

**Rotas React (`FrontEnd/src/App.jsx`):**
```jsx
<Route path="/agendar/:token" element={<PublicAppointmentBooking />} />
```

## Como Usar

### 1. Criar um Link de Agendamento

```ruby
# No console Rails ou através de um controller/admin
account = Account.find(1)  # Seu estabelecimento

appointment_link = account.appointment_links.create!(
  name: "Agendamento Online",
  description: "Agende seu horário conosco",
  service_id: 1,  # Opcional: pré-selecionar serviço
  account_user_id: 2,  # Opcional: pré-selecionar profissional
  settings: {
    start_hour: 9,
    end_hour: 18,
    slot_interval_minutes: 30,
    default_duration_minutes: 60
  }
)

# Obter URL pública
puts appointment_link.public_url
# => http://localhost:3000/agendar/ABC123XYZ...
```

### 2. Compartilhar o Link

O link gerado pode ser compartilhado via:
- WhatsApp
- E-mail
- Site
- Redes sociais
- QR Code

### 3. Fluxo do Cliente

1. Cliente acessa o link: `http://seu-site.com/agendar/TOKEN123`
2. Seleciona o serviço desejado
3. Escolhe o profissional
4. Seleciona data e horário disponível
5. Preenche informações (nome, WhatsApp, e-mail)
6. Confirma o agendamento
7. É redirecionado para pagamento (se Stripe configurado)

## Configurações

### Horário de Funcionamento

As configurações podem ser definidas no campo `settings` do `AppointmentLink`:

```ruby
settings: {
  start_hour: 9,              # Hora de início
  end_hour: 18,               # Hora de término
  slot_interval_minutes: 30,  # Intervalo entre slots
  default_duration_minutes: 60 # Duração padrão (pode ser sobrescrita pelo serviço)
}
```

### Integração com Stripe

O sistema está preparado para integração com Stripe. Quando um agendamento é criado:
- Um Payment Link é gerado automaticamente
- O cliente é redirecionado para pagamento
- Após pagamento, o agendamento é confirmado automaticamente

## Próximos Passos Sugeridos

1. **Interface de Administração**: Criar interface no sistema para gerenciar links de agendamento
2. **Notificações**: Enviar e-mail/SMS de confirmação ao cliente
3. **Lembretes**: Sistema de lembretes automáticos antes do agendamento
4. **Cancelamento**: Permitir cancelamento pelo link público
5. **Reagendamento**: Opção de reagendar pelo link
6. **Horários Customizados**: Permitir diferentes horários por dia da semana
7. **Bloqueios**: Sistema para bloquear dias/horários específicos

## Estrutura de Dados

### AppointmentLink
- Token único por link
- Vinculado a um Account (estabelecimento)
- Pode ter serviço e profissional pré-selecionados
- Configurações customizáveis em JSONB

### Appointment (já existente)
- Vinculado ao AppointmentLink através do token
- Contém todas as informações do agendamento
- Integrado com sistema de pagamentos

## Segurança

- Tokens únicos e aleatórios (32 caracteres)
- Validação de token ativo antes de permitir agendamento
- Verificação de conflitos de horário
- Criação automática de contatos quando necessário
- Validação de dados do cliente

## Notas Técnicas

- O sistema usa multi-tenancy (acts_as_tenant)
- Todos os endpoints públicos não requerem autenticação
- A página React é servida pelo frontend separado
- Os dados são buscados via API pública
- O cálculo de disponibilidade considera agendamentos existentes

## Testes

Para testar o sistema:

1. Criar um link de agendamento no console Rails
2. Acessar a URL pública no navegador
3. Seguir o fluxo completo de agendamento
4. Verificar se o agendamento foi criado corretamente

## Migration

Execute a migration para criar a tabela:

```bash
rails db:migrate
```

A migration criará a tabela `appointment_links` com todos os campos necessários.

