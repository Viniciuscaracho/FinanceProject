# 📊 Como Criar Dados de Demonstração

Este guia explica como popular o banco de dados com dados de exemplo para testar todas as funcionalidades do sistema.

## 🚀 Método 1: Executar o Seed de Demonstração

Execute o comando abaixo no terminal:

```bash
cd /home/baby/Documents/BarberManagement
rails runner db/seeds/demo_data.rb
```

## 🚀 Método 2: Usar o Rake Task (Recomendado)

Crie um arquivo `lib/tasks/demo_data.rake`:

```ruby
namespace :db do
  desc "Cria dados de demonstração para todas as funcionalidades"
  task demo_data: :environment do
    load Rails.root.join('db', 'seeds', 'demo_data.rb')
  end
end
```

Depois execute:

```bash
rails db:demo_data
```

## 📋 O que será criado:

### ✅ Profissionais (4)
- Carlos Silva
- Ana Santos
- Roberto Oliveira
- Mariana Costa

### ✅ Serviços (8)
- Corte de Cabelo Masculino - R$ 50,00
- Corte de Cabelo Feminino - R$ 80,00
- Coloração Completa - R$ 150,00
- Mechas - R$ 200,00
- Barba - R$ 30,00
- Sobrancelha - R$ 25,00
- Hidratação - R$ 60,00
- Escova Progressiva - R$ 250,00

### ✅ Contatos/Clientes (8)
- João Pereira
- Maria Ferreira
- Pedro Almeida
- Julia Rodrigues
- Lucas Martins
- Fernanda Lima
- Rafael Souza
- Camila Barbosa

### ✅ Agendamentos (~120-180)
- Últimos 30 dias
- Próximos 30 dias
- Diferentes status (pendente, confirmado, completo, cancelado)
- Comissões calculadas para agendamentos confirmados/completos

## 🔄 Resetar e Recriar

Para limpar e recriar todos os dados:

```bash
# 1. Resetar banco de dados
rails db:reset

# 2. Criar dados básicos
rails db:seed

# 3. Criar dados de demonstração
rails runner db/seeds/demo_data.rb
```

## ⚠️ Avisos

- Os dados são criados apenas se não existirem (usando `find_or_create_by`)
- Execute múltiplas vezes sem problemas - não criará duplicatas
- Os agendamentos são gerados aleatoriamente nos últimos e próximos 30 dias
- Senhas padrão dos profissionais: `password123`

## 🧪 Testar após criar dados

1. **Login**: Use o usuário admin criado no seed principal
2. **Profissionais**: Acesse `/professionals` - deve ver 4 profissionais
3. **Serviços**: Acesse `/services` - deve ver 8 serviços
4. **Agendamentos**: Acesse `/appointments` - deve ver vários agendamentos
5. **Relatórios**: Acesse `/appointment-reports` - deve ver dados nos gráficos

## 📝 Credenciais de Acesso

**Admin Principal:**
- Email: `admin@exemplo.com` (do seeds.rb principal)
- Senha: `password`

**Profissionais (para login se necessário):**
- Email: `carlos.silva@salon.com`
- Senha: `password123`
- (Mesmo padrão para os outros profissionais)

