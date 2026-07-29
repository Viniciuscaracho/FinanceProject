# frozen_string_literal: true

module Coaching
  # Fachada para a carteira de créditos de áudio de uma conta. É o ponto único
  # que controllers e jobs usam para checar e mexer no saldo.
  #
  #   credits = Coaching::CreditsService.for(account)
  #   credits.enough?                    # => true/false (há crédito para 1 áudio?)
  #   credits.debit_audio!(source: ev)   # consome 1 crédito (o áudio processado)
  #   credits.recharge!(source: charge)  # soma um pacote de +100 (pagamento confirmado)
  #
  # Um débito sem saldo levanta InsufficientCredits, tratado como HTTP 402 na
  # Api::V1::ApplicationController. A carteira é criada sob demanda na primeira
  # vez, já concedendo a franquia inicial (registrada no razão).
  class CreditsService
    class InsufficientCredits < StandardError; end

    AUDIO_COST = 1

    def self.for(account)
      new(account)
    end

    def initialize(account)
      @account = account
    end

    attr_reader :account

    def wallet
      @wallet ||= account.coaching_credit_wallet || bootstrap_wallet
    end

    delegate :balance, :renews_at, :monthly_allowance, to: :wallet

    def enough?(amount = AUDIO_COST)
      wallet.enough?(amount)
    end

    # Debita o custo de um áudio processado. `source` costuma ser o TimelineEvent
    # gerado, para rastrear qual registro consumiu o crédito.
    def debit_audio!(source: nil, description: 'Áudio transcrito e estruturado')
      wallet.debit!(amount: AUDIO_COST, source: source, description: description)
    end

    # Aplica uma recarga (pacote pago). Chamado pelo webhook do processador via
    # Coaching::ApplyRechargeJob.
    def recharge!(amount: CoachingCreditWallet::RECHARGE_PACK_SIZE, source: nil, description: nil, metadata: {})
      wallet.recharge!(amount: amount, source: source, description: description, metadata: metadata)
    end

    def grant_monthly!(**opts)
      wallet.grant_monthly!(**opts)
    end

    private

    def bootstrap_wallet
      wallet = account.create_coaching_credit_wallet!(
        balance:           0,
        monthly_allowance: CoachingCreditWallet::DEFAULT_MONTHLY_ALLOWANCE,
        renews_at:         nil
      )
      wallet.grant_monthly! # concede a franquia inicial e agenda a renovação
      wallet
    rescue ActiveRecord::RecordNotUnique
      # Corrida na criação: outra requisição já criou a carteira.
      account.reload.coaching_credit_wallet
    end
  end
end
