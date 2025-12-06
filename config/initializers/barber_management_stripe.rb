# frozen_string_literal: true

# Configuração específica do Stripe para o BarberManagement
# Esta configuração garante que todas as operações sejam identificadas
# e separadas de outras integrações (como Procfy)

# Validar configuração após o carregamento completo da aplicação
Rails.application.config.after_initialize do
  if Rails.env.development? || Rails.env.staging?
    begin
      # Verificar se a classe existe e se está configurada
      if defined?(BarberManagement::Stripe::Client)
        unless BarberManagement::Stripe::Client.configured?
          Rails.logger.warn <<~WARNING
            ⚠️  BarberManagement::Stripe não está configurado!
            
            Para configurar, execute:
            rails credentials:edit --environment development
            
            E adicione:
            barber_management:
              stripe:
                api_key: sk_test_...
                webhook_secret: whsec_...
            
            Ou use as credenciais genéricas em:
            stripe:
              private_key: sk_test_...
              webhook_secret: whsec_...
          WARNING
        else
          Rails.logger.info "✅ BarberManagement::Stripe configurado corretamente"
        end
      end
    rescue NameError => e
      Rails.logger.warn "⚠️  BarberManagement::Stripe::Client não encontrado: #{e.message}"
    end
  end
end

