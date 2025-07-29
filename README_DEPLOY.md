# 🚀 Guia de Deploy - FinancialProject

Este guia explica como fazer o deploy do FinancialProject de forma simples e confiável.

## 📋 Pré-requisitos

- Ruby 3.2.3
- Node.js 18+ 
- Yarn
- PostgreSQL
- Redis

## 🔧 Configuração Local

### 1. Instalar dependências
```bash
# Ruby gems
bundle install

# Node.js packages
yarn install
```

### 2. Configurar banco de dados
```bash
# Criar banco de dados
bundle exec rails db:create

# Executar migrações
bundle exec rails db:migrate

# Popular dados iniciais (opcional)
bundle exec rails db:seed
```

### 3. Build dos assets
```bash
# Build CSS e JS
yarn build:assets
```

### 4. Rodar em desenvolvimento
```bash
# Iniciar todos os serviços
bin/dev

# Ou apenas o servidor Rails
bundle exec rails server
```

## 🚀 Deploy em Produção

### Opção 1: Deploy Automatizado
```bash
# Executar script de deploy
./bin/deploy
```

### Opção 2: Deploy Manual
```bash
# 1. Instalar dependências
bundle install --deployment
yarn install --frozen-lockfile

# 2. Build dos assets
yarn build:assets

# 3. Executar migrações
bundle exec rails db:migrate

# 4. Precompilar assets
bundle exec rails assets:precompile

# 5. Iniciar servidor
bundle exec rails server -p $PORT -b '0.0.0.0'
```

## 🔧 Variáveis de Ambiente

Configure as seguintes variáveis de ambiente:

```bash
# Obrigatórias
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://host:port
SECRET_KEY_BASE=your_secret_key_here
RAILS_ENV=production
RAILS_SERVE_STATIC_FILES=true

# Opcionais
RAILS_LOG_TO_STDOUT=true
```

## 📦 Estrutura de Deploy

### Arquivos importantes:
- `Procfile` - Define os processos para produção
- `bin/deploy` - Script automatizado de deploy
- `config/deploy.rb` - Configurações de deploy
- `package.json` - Scripts de build

### Comandos úteis:
```bash
# Verificar se tudo está funcionando
bundle exec rails about

# Verificar rotas
bundle exec rails routes

# Verificar logs
tail -f log/production.log

# Reiniciar servidor
touch tmp/restart.txt
```

## 🐛 Troubleshooting

### Erro de assets não encontrados:
```bash
# Rebuild dos assets
yarn build:assets
bundle exec rails assets:precompile
```

### Erro de dependências:
```bash
# Limpar e reinstalar
rm -rf node_modules yarn.lock
yarn install
```

### Erro de banco de dados:
```bash
# Verificar conexão
bundle exec rails db:version
bundle exec rails db:migrate:status
```

## ✅ Checklist de Deploy

- [ ] Dependências Ruby instaladas
- [ ] Dependências Node.js instaladas
- [ ] Assets compilados
- [ ] Migrações executadas
- [ ] Variáveis de ambiente configuradas
- [ ] Servidor iniciado
- [ ] Aplicação respondendo

## 📞 Suporte

Se encontrar problemas durante o deploy:

1. Verifique os logs: `tail -f log/production.log`
2. Teste localmente: `bin/dev`
3. Verifique as variáveis de ambiente
4. Execute o script de deploy: `./bin/deploy`

---

**🎉 Deploy concluído com sucesso!** 