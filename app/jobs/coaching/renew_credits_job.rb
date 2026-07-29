# frozen_string_literal: true

module Coaching
  # Renova a franquia mensal das carteiras cujo ciclo venceu. Roda diariamente
  # (config/sidekiq_scheduler.yml) e é idempotente: grant_monthly! só concede
  # quando renews_at já passou, então rodar mais de uma vez no dia não duplica.
  #
  # A renovação fica ancorada na data de assinatura de cada conta (renews_at foi
  # definido no bootstrap da carteira). Quando o billing por assinatura estiver
  # ligado, dá para disparar a renovação também pelo webhook de invoice paga,
  # mantendo este cron como rede de segurança.
  class RenewCreditsJob < ApplicationJob
    queue_as :default

    def perform(now: Time.current)
      due   = CoachingCreditWallet.where(renews_at: ..now)
      count = 0

      due.find_each do |wallet|
        wallet.grant_monthly!(now: now)
        count += 1
      rescue StandardError => e
        Rails.logger.error "[Coaching::RenewCreditsJob] wallet ##{wallet.id}: #{e.class}: #{e.message}"
      end

      Rails.logger.info "[Coaching::RenewCreditsJob] #{count} carteira(s) renovada(s)"
    end
  end
end
