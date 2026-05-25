# Configuração do Stripe
# Prioridade: barber_management > stripe (para compatibilidade)
stripe_api_key = Rails.application.credentials.dig(:barber_management, :stripe, :api_key) ||
                 Rails.application.credentials.dig(:stripe, :private_key) ||
                 ENV['STRIPE_API_KEY']

Stripe.api_key = stripe_api_key if stripe_api_key.present?

# Log de configuração (apenas em desenvolvimento)
if Rails.env.development?
  if stripe_api_key.present?
    Rails.logger.info "✅ Stripe configurado para BarberManagement"
  else
    Rails.logger.warn "⚠️  Stripe API key não encontrada. Configure em credentials: barber_management.stripe.api_key"
  end
end
