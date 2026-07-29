# frozen_string_literal: true

# Livro-razão de créditos de áudio do coaching. Cada linha é imutável e registra
# a variação de saldo (`amount`, + crédito / - débito) e o `balance_after`
# resultante. `source` referencia a origem quando existe: o TimelineEvent no
# débito, a cobrança do pacote na recarga.
class CoachingCreditTransaction < ApplicationRecord
  KINDS = %w[monthly_grant debit recharge adjustment refund].freeze

  belongs_to :coaching_credit_wallet
  belongs_to :account
  belongs_to :source, polymorphic: true, optional: true

  validates :amount, :balance_after, presence: true, numericality: { only_integer: true }
  validates :kind, inclusion: { in: KINDS }

  scope :debits,  -> { where(kind: 'debit') }
  scope :credits, -> { where.not(kind: 'debit') }
  scope :recent,  -> { order(created_at: :desc) }
end
