# frozen_string_literal: true

module Coaching
  # Aplica uma recarga de créditos após a confirmação de pagamento de um pacote
  # de áudios (compra avulsa). Deve ser chamado pelo webhook do processador
  # (Stripe ou AbacatePay) quando a cobrança do pacote é paga:
  #
  #   Coaching::ApplyRechargeJob.perform_later(
  #     account_id: account.id,
  #     amount:     100,
  #     reference:  charge_or_payment_id
  #   )
  #
  # `reference` é o id da cobrança no processador — guardado no metadata da
  # transação para conciliação e idempotência futura.
  class ApplyRechargeJob < ApplicationJob
    queue_as :default

    def perform(account_id:, amount: CoachingCreditWallet::RECHARGE_PACK_SIZE, reference: nil)
      account = Account.find_by(id: account_id)
      return unless account

      ::Coaching::CreditsService.for(account).recharge!(
        amount:      amount,
        description: "Recarga de #{amount} créditos",
        metadata:    { reference: reference }.compact
      )

      Rails.logger.info "[Coaching::ApplyRechargeJob] +#{amount} créditos na conta ##{account_id} (ref: #{reference})"
    end
  end
end
