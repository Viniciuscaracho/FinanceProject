# Configuração de Deploy - FinancialProject
# Este arquivo define as configurações necessárias para deploy

# Variáveis de ambiente necessárias
ENV_VARS = %w[
  DATABASE_URL
  REDIS_URL
  SECRET_KEY_BASE
  RAILS_ENV
  RAILS_SERVE_STATIC_FILES
]

# Configurações de produção
PRODUCTION_CONFIG = {
  'RAILS_ENV' => 'production',
  'RAILS_SERVE_STATIC_FILES' => 'true',
  'RAILS_LOG_TO_STDOUT' => 'true'
}

# Comandos de build
BUILD_COMMANDS = [
  'bundle install --deployment',
  'yarn install --frozen-lockfile',
  'yarn build:assets',
  'bundle exec rails db:migrate',
  'bundle exec rails assets:precompile'
]

# Comandos de verificação
VERIFY_COMMANDS = [
  'bundle exec rails about',
  'bundle exec rails routes | head -10'
]

puts "✅ Configuração de deploy carregada"
puts "📋 Variáveis de ambiente necessárias: #{ENV_VARS.join(', ')}"
puts "🔧 Comandos de build: #{BUILD_COMMANDS.length} comandos"
puts "🔍 Comandos de verificação: #{VERIFY_COMMANDS.length} comandos" 