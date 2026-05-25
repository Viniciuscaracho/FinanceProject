# Configuração do Stripe
# Prioridade: ENV > orbi credentials > stripe credentials
stripe_api_key = ENV['STRIPE_API_KEY'] ||
                 Rails.application.credentials.dig(:orbi, :stripe, :api_key) ||
                 Rails.application.credentials.dig(:stripe, :private_key)

Stripe.api_key = stripe_api_key if stripe_api_key.present?

# Log de configuração (apenas em desenvolvimento)
if Rails.env.development?
  if stripe_api_key.present?
    Rails.logger.info "✅ Stripe configurado para Orbi"
  else
    Rails.logger.warn "⚠️  Stripe API key não encontrada. Configure STRIPE_API_KEY ou em credentials: orbi.stripe.api_key"
  end
end
