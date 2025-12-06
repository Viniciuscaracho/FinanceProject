# Integração com Chatbot do WhatsApp

Este documento descreve a integração do sistema com chatbot do WhatsApp para criar transações e agendamentos automaticamente a partir de conversas com clientes.

## 📋 Funcionalidades

- ✅ **Agendamento automático**: Clientes podem agendar serviços via WhatsApp
- ✅ **Criação de transações**: Transações financeiras são criadas automaticamente
- ✅ **Processamento de linguagem natural**: O sistema entende mensagens em português
- ✅ **Extração de informações**: Extrai serviço, valor, data, horário e nome do cliente
- ✅ **Respostas automáticas**: Responde automaticamente ao cliente

## 🏗️ Arquitetura

### Componentes Principais

1. **MessageParser** (`app/services/whatsapp/message_parser.rb`)
   - Analisa mensagens do WhatsApp
   - Extrai informações: serviço, preço, data, horário, nome
   - Identifica a intenção do cliente (agendar, cancelar, consultar, etc.)

2. **AppointmentCreator** (`app/services/whatsapp/appointment_creator.rb`)
   - Cria agendamentos automaticamente
   - Cria transações financeiras associadas
   - Valida conflitos de horário
   - Cria ou encontra contatos

3. **ResponseBuilder** (`app/services/whatsapp/response_builder.rb`)
   - Gera respostas personalizadas
   - Lista serviços disponíveis
   - Confirma agendamentos
   - Informa horários disponíveis

4. **ProcessMessageJob** (`app/jobs/whatsapp/process_message_job.rb`)
   - Processa mensagens assincronamente
   - Coordena o fluxo de criação de agendamentos
   - Envia respostas via WhatsApp

5. **WhatsAppWebhookController** (`app/controllers/api/v1/whatsapp_webhook_controller.rb`)
   - Recebe webhooks do WhatsApp
   - Valida requisições
   - Dispara processamento de mensagens

## 🔌 Endpoints

### Webhook do WhatsApp

```
POST /api/v1/whatsapp/webhook
GET  /api/v1/whatsapp/webhook (verificação)
```

### Parâmetros

#### POST (Webhook)
```json
{
  "message": "Agendar corte de cabelo para amanhã às 14h",
  "from": "+5511999999999",
  "message_id": "unique_id"
}
```

Ou para testes diretos:
```
POST /api/v1/whatsapp/webhook?account_token=ACCOUNT_ID
Body: {
  "message": "Agendar corte de cabelo para amanhã às 14h",
  "from": "+5511999999999"
}
```

## 💬 Exemplos de Mensagens

### Agendamento

**Cliente:**
```
Agendar corte de cabelo para amanhã às 14h
```

**Sistema:**
```
✅ Agendamento confirmado!

📅 Data: 15/01/2024
⏰ Horário: 14:00
💇 Serviço: Corte de Cabelo
💰 Valor: R$ 50,00

Aguardamos você!
```

### Listar Serviços

**Cliente:**
```
Quais serviços vocês têm?
```

**Sistema:**
```
📋 Serviços Disponíveis:

1. Corte de Cabelo - R$ 50,00
2. Corte de Barba - R$ 30,00
3. Design de Sobrancelha - R$ 25,00
...

Para agendar, envie: Agendar [nome do serviço] para [data] às [horário]
```

### Consultar Horários

**Cliente:**
```
Quais horários vocês têm disponíveis amanhã?
```

**Sistema:**
```
📅 Horários disponíveis para 15/01/2024:

⏰ 09:00
⏰ 10:00
⏰ 11:00
...
```

## 🧠 Processamento de Linguagem Natural

O sistema reconhece:

### Intenções
- **Agendar**: "agendar", "marcar", "horário"
- **Cancelar**: "cancelar", "desmarcar"
- **Listar**: "serviços", "preços", "lista"
- **Consultar**: "quando", "quanto", "disponível"

### Datas
- Hoje, amanhã
- Dias da semana (segunda, terça, etc.)
- Datas no formato dd/mm/yyyy ou dd/mm
- "Próxima semana"

### Horários
- Formato 24h: "14h", "14:00"
- Formato 12h: "2pm", "10am"
- "Às 14h", "14 horas"

### Valores
- "R$ 50"
- "50 reais"
- "50,00"
- "50.00"

### Serviços
- Nomes exatos dos serviços cadastrados
- Palavras-chave: "corte", "barba", "sobrancelha", etc.

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione ao `.env`:

```bash
WHATSAPP_VERIFY_TOKEN=seu_token_secreto
```

### 2. Configurar Webhook no WhatsApp

1. Acesse o painel do seu provedor de WhatsApp (Twilio, WhatsApp Business API, etc.)
2. Configure o webhook para apontar para:
   ```
   https://seu-dominio.com/api/v1/whatsapp/webhook
   ```
3. Use o token de verificação configurado

### 3. Testar Localmente

Use o ngrok para expor seu servidor local:

```bash
ngrok http 3000
```

Configure o webhook para apontar para a URL do ngrok.

## 🧪 Testes

### Teste Manual via cURL

```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/webhook?account_token=1 \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Agendar corte de cabelo para amanhã às 14h",
    "from": "+5511999999999"
  }'
```

### Teste via Rails Console

```ruby
account = Account.first
message = "Agendar corte de cabelo para amanhã às 14h"
whatsapp_number = "+5511999999999"

WhatsApp::ProcessMessageJob.perform_now(
  account_id: account.id,
  message: message,
  whatsapp_number: whatsapp_number
)
```

## 📊 Fluxo de Dados

```
1. Cliente envia mensagem no WhatsApp
   ↓
2. Provedor (Twilio/WhatsApp) envia webhook
   ↓
3. WhatsAppWebhookController recebe e valida
   ↓
4. ProcessMessageJob é enfileirado
   ↓
5. MessageParser analisa a mensagem
   ↓
6. AppointmentCreator cria agendamento e transação
   ↓
7. ResponseBuilder gera resposta
   ↓
8. Resposta é enviada ao cliente via WhatsApp
```

## 🔐 Segurança

⚠️ **IMPORTANTE**: Em produção, implemente:

1. **Validação de assinatura do webhook**
   - Verifique a assinatura do provedor (Twilio, WhatsApp Business API)
   - Valide tokens e secrets

2. **Autenticação do Account**
   - Use tokens seguros para identificar accounts
   - Não use IDs simples em produção

3. **Rate Limiting**
   - Limite requisições por número de telefone
   - Prevenha spam e abuso

4. **Logs e Monitoramento**
   - Monitore todas as mensagens processadas
   - Alerte sobre erros e falhas

## 🚀 Próximos Passos

- [ ] Integração com API real do WhatsApp (Twilio/WhatsApp Business API)
- [ ] Suporte a múltiplos idiomas
- [ ] Confirmação de pagamento via WhatsApp
- [ ] Lembretes automáticos de agendamentos
- [ ] Cancelamento via WhatsApp
- [ ] Histórico de conversas
- [ ] Dashboard de mensagens

## 📝 Notas

- O sistema cria transações automaticamente quando um agendamento é criado
- Contatos são criados automaticamente se não existirem
- O sistema valida conflitos de horário antes de criar agendamentos
- Por padrão, usa o primeiro profissional disponível (pode ser customizado)

## 🐛 Troubleshooting

### Mensagens não são processadas
- Verifique os logs: `tail -f log/development.log`
- Confirme que o job está sendo executado
- Verifique se o account existe e tem serviços cadastrados

### Agendamentos não são criados
- Verifique se há serviços cadastrados no account
- Confirme que há profissionais disponíveis
- Verifique se a data/horário são válidos

### Transações não são criadas
- Confirme que há uma conta bancária padrão configurada
- Verifique os logs para erros específicos

