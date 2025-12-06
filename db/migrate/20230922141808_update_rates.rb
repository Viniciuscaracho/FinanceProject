# frozen_string_literal: true

class UpdateRates < ActiveRecord::Migration[7.0]
  def change
    # Só atualizar taxas se o app_id do Open Exchange Rates estiver configurado
    app_id = Rails.application.credentials.dig(:open_exchange_rates, :app_id)
    if app_id.present?
      begin
        Money.default_bank.update_rates
      rescue => e
        Rails.logger.warn "Não foi possível atualizar taxas de câmbio: #{e.message}"
        # Continuar mesmo se falhar - não é crítico para a migração
      end
    else
      Rails.logger.info "Open Exchange Rates app_id não configurado, pulando atualização de taxas"
    end
  end
end
