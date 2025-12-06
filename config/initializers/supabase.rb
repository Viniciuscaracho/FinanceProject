# frozen_string_literal: true

# Supabase Configuration
# Configure as variáveis de ambiente:
# SUPABASE_URL: URL do seu projeto Supabase (ex: https://xxxxx.supabase.co)
# SUPABASE_ANON_KEY: Chave pública anônima do Supabase
# SUPABASE_SERVICE_ROLE_KEY: Chave de serviço (usar apenas no backend, nunca expor no frontend)

Rails.application.config.supabase = {
  url: ENV.fetch('SUPABASE_URL', ''),
  anon_key: ENV.fetch('SUPABASE_ANON_KEY', ''),
  service_role_key: ENV.fetch('SUPABASE_SERVICE_ROLE_KEY', ''),
  jwt_secret: ENV.fetch('SUPABASE_JWT_SECRET', '')
}

# Validar configuração
if Rails.env.production? || Rails.env.staging?
  required_keys = %w[SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY]
  missing_keys = required_keys.reject { |key| ENV[key].present? }
  
  if missing_keys.any?
    Rails.logger.warn "⚠️  Supabase: Variáveis de ambiente faltando: #{missing_keys.join(', ')}"
  end
end

