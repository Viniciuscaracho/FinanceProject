# 📊 Base de Dados de Demonstração

## 🚀 Como Criar os Dados

Execute um dos comandos abaixo:

### Opção 1: Rake Task (Recomendado)
```bash
rails db:demo_data
```

### Opção 2: Runner Direto
```bash
rails runner db/seeds/demo_data.rb
```

### Opção 3: Reset Completo + Dados Demo
```bash
rails db:reset_with_demo
```

## 📋 Dados que serão criados:

### 👥 4 Profissionais
- **Carlos Silva** - carlos.silva@salon.com
- **Ana Santos** - ana.santos@salon.com  
- **Roberto Oliveira** - roberto.oliveira@salon.com
- **Mariana Costa** - mariana.costa@salon.com

**Senha padrão:** `password123`

### ✂️ 8 Serviços
1. Corte de Cabelo Masculino - **R$ 50,00**
2. Corte de Cabelo Feminino - **R$ 80,00**
3. Coloração Completa - **R$ 150,00**
4. Mechas - **R$ 200,00**
5. Barba - **R$ 30,00**
6. Sobrancelha - **R$ 25,00**
7. Hidratação - **R$ 60,00**
8. Escova Progressiva - **R$ 250,00**

### 👤 8 Clientes/Contatos
- João Pereira
- Maria Ferreira
- Pedro Almeida
- Julia Rodrigues
- Lucas Martins
- Fernanda Lima
- Rafael Souza
- Camila Barbosa

### 📅 ~120-180 Agendamentos
- **Últimos 30 dias** (histórico)
- **Próximos 30 dias** (futuros)
- Diferentes status:
  - ⏳ Pendentes (aguardando pagamento)
  - ✅ Confirmados (pagos)
  - ✨ Completos (serviço realizado)
  - ❌ Cancelados
- Comissões calculadas automaticamente (50% para agendamentos confirmados/completos)

## 🎯 O que você poderá testar:

### ✅ Página de Profissionais (`/professionals`)
- Ver 4 profissionais cadastrados
- Editar informações
- Criar novos profissionais

### ✅ Página de Serviços (`/services`)
- Ver 8 serviços com preços
- Editar serviços
- Criar novos serviços

### ✅ Página de Agendamentos (`/appointments`)
- Ver lista completa de agendamentos
- Filtrar por status, pagamento, profissional
- Ver estatísticas (total, confirmados, pendentes, receita)
- Atualizar status de agendamentos

### ✅ Página de Relatórios (`/appointment-reports`)
- Ver resumo financeiro
- Gráficos de receita por profissional
- Distribuição de receita
- Relatório detalhado por profissional com:
  - Receita bruta
  - Comissões
  - Repasses pendentes
  - Receita líquida

### ✅ Página de Horários (`/working-hours`)
- Configurar horários para cada profissional
- Definir dias da semana ativos
- Configurar intervalos

## 🔄 Recriar Dados

Se quiser limpar e recriar tudo:

```bash
# Limpar tudo e recriar
rails db:reset_with_demo
```

Ou manualmente:

```bash
rails db:reset
rails db:seed
rails db:demo_data
```

## ⚠️ Importante

- Os dados são criados de forma **idempotente** - pode executar múltiplas vezes sem criar duplicatas
- Os agendamentos são gerados **aleatoriamente** nos últimos e próximos 30 dias
- **Domingos são pulados** automaticamente
- Comissões são calculadas como **50%** do valor do serviço

## 🧪 Testar Agora

1. Execute: `rails db:demo_data`
2. Acesse o sistema e faça login
3. Navegue pelas páginas e veja os dados!

---

**Criado em:** $(date)
**Versão:** 1.0

