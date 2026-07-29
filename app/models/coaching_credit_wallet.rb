# frozen_string_literal: true

# == Schema Information
#
# Table name: coaching_credit_wallets
#
#  id                :bigint           not null, primary key
#  balance           :integer          default(0), not null
#  monthly_allowance :integer          default(200), not null
#  renews_at         :datetime
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  account_id        :bigint           not null
#
# Indexes
#
#  index_coaching_credit_wallets_on_account_id  (account_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
# Carteira de créditos de áudio do coaching — uma por conta (Account).
#
# 1 crédito = 1 áudio transcrito e estruturado pela IA. O plano inclui
# `monthly_allowance` créditos por ciclo (padrão 200), que renovam em
# `renews_at`. Recargas avulsas (+100) somam ao saldo sem alterar a franquia.
# Resumos pré-atendimento e alertas NÃO consomem créditos.
#
# Toda alteração de saldo passa por debit!/recharge!/grant_monthly!, que gravam
# uma linha imutável em CoachingCreditTransaction (livro-razão) dentro de um
# lock pessimista — garantindo consistência sob concorrência (dois áudios
# processados ao mesmo tempo não debitam em cima de um saldo desatualizado).
class CoachingCreditWallet < ApplicationRecord
  belongs_to :account
  has_many :transactions,
           class_name: 'CoachingCreditTransaction',
           dependent: :destroy

  DEFAULT_MONTHLY_ALLOWANCE = 200
  RECHARGE_PACK_SIZE        = 100
  DEFAULT_CYCLE             = 1.month

  validates :balance, :monthly_allowance,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  # Saldo suficiente para debitar `amount` créditos?
  def enough?(amount = 1)
    balance >= amount
  end

  # Debita créditos (uso de áudio). Levanta InsufficientCredits se faltar saldo.
  def debit!(amount: 1, source: nil, description: nil, metadata: {})
    raise ArgumentError, 'amount deve ser positivo' unless amount.positive?

    apply!(-amount, kind: 'debit', source: source, description: description, metadata: metadata)
  end

  # Credita uma recarga avulsa (pacote comprado e pago).
  def recharge!(amount: RECHARGE_PACK_SIZE, source: nil, description: nil, metadata: {})
    raise ArgumentError, 'amount deve ser positivo' unless amount.positive?

    apply!(amount, kind: 'recharge', source: source,
           description: description || "Recarga de #{amount} créditos", metadata: metadata)
  end

  # Concede a franquia mensal e agenda a próxima renovação. Idempotente por
  # ciclo: só concede quando `renews_at` já passou (ou ainda não foi definido).
  #
  # A franquia não acumula, mas as recargas sim: o saldo é elevado para pelo
  # menos `monthly_allowance`, preservando qualquer excedente comprado
  # (ex.: saldo 250 permanece 250; saldo 30 vira 200).
  def grant_monthly!(now: Time.current, cycle: DEFAULT_CYCLE)
    with_lock do
      return self if renews_at.present? && renews_at > now

      delta = [monthly_allowance - balance, 0].max
      self.balance   += delta
      self.renews_at  = (renews_at && renews_at > now ? renews_at : now) + cycle
      save!

      if delta.positive?
        transactions.create!(
          account:       account,
          amount:        delta,
          balance_after: balance,
          kind:          'monthly_grant',
          description:   "Franquia mensal de #{monthly_allowance} créditos"
        )
      end
      self
    end
  end

  private

  # Aplica uma variação de saldo (+/-) de forma atômica e registra no razão.
  def apply!(delta, kind:, source: nil, description: nil, metadata: {})
    with_lock do
      new_balance = balance + delta
      if new_balance.negative?
        raise Coaching::CreditsService::InsufficientCredits,
              "Saldo insuficiente (#{balance}) para debitar #{-delta} crédito(s)"
      end

      self.balance = new_balance
      save!

      transactions.create!(
        account:       account,
        amount:        delta,
        balance_after: new_balance,
        kind:          kind,
        source:        source,
        description:   description,
        metadata:      metadata || {}
      )
    end
  end
end
