# 📊 Resumo da Base de Dados de Demonstração

## ✅ Status Atual

A base de dados de demonstração foi criada com sucesso! Os seguintes dados estão disponíveis:

### 👥 Profissionais: 5
- Administrador Principal (do seed básico)
- Carlos Silva
- Ana Santos  
- Roberto Oliveira
- Mariana Costa

### ✂️ Serviços: 8
1. Corte de Cabelo Masculino - R$ 50,00
2. Corte de Cabelo Feminino - R$ 80,00
3. Coloração Completa - R$ 150,00
4. Mechas - R$ 200,00
5. Barba - R$ 30,00
6. Sobrancelha - R$ 25,00
7. Hidratação - R$ 60,00
8. Escova Progressiva - R$ 250,00

### 👤 Contatos/Clientes: 8
- João Pereira
- Maria Ferreira
- Pedro Almeida
- Julia Rodrigues
- Lucas Martins
- Fernanda Lima
- Rafael Souza
- Camila Barbosa

### 📅 Agendamentos: 0
Os agendamentos ainda não foram criados devido a um problema no script. Você pode criar manualmente através da interface ou corrigir o script.

## 🚀 Como Usar

### Verificar dados existentes:
```bash
rails runner "puts 'Profissionais: ' + AccountUser.where(account_id: 1).count.to_s; puts 'Serviços: ' + Service.where(account_id: 1).kept.count.to_s; puts 'Contatos: ' + Contact.where(account_id: 1).count.to_s"
```

### Recriar dados:
```bash
rails db:demo_data
```

### Limpar e recriar tudo:
```bash
rails db:reset_with_demo
```

## 📝 Credenciais

**Admin Principal:**
- Email: `admin@exemplo.com`
- Senha: `password`

**Profissionais:**
- Email: `carlos.silva@salon.com` (e outros)
- Senha: `password123`

## 🎯 Próximos Passos

1. Acesse o sistema e faça login
2. Navegue pelas páginas:
   - `/professionals` - Ver profissionais
   - `/services` - Ver serviços
   - `/appointments` - Criar agendamentos manualmente
   - `/appointment-reports` - Ver relatórios (após criar agendamentos)

## ⚠️ Nota sobre Agendamentos

O script de criação de agendamentos está com um problema de performance/validação. Você pode:
1. Criar agendamentos manualmente pela interface
2. Ou aguardar a correção do script

Os dados de profissionais, serviços e contatos estão prontos para uso!

