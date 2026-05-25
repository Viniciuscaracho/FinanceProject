# frozen_string_literal: true

# Configuração específica do Stripe para o Orbi
Rails.application.config.after_initialize do
  if Rails.env.development? || Rails.env.staging?
    begin
      if defined?(BarberManagement::Stripe::Client)
        unless BarberManagement::Stripe::Client.configured?
          Rails.logger.warn <<~WARNING
            ⚠️  Stripe não está configurado!

            Configure via ENV:
              STRIPE_API_KEY=sk_live_...
              STRIPE_WEBHOOK_SECRET=whsec_...

            Ou em credentials (rails credentials:edit --environment staging):
              orbi:
                stripe:
                  api_key: sk_live_...
                  webhook_secret: whsec_...
          WARNING
        else
          Rails.logger.info "✅ Stripe configurado corretamente"
        end
      end
    rescue NameError => e
      Rails.logger.warn "⚠️  Stripe::Client não encontrado: #{e.message}"
    end
  end
end
