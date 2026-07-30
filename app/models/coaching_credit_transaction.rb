# frozen_string_literal: true

# == Schema Information
#
# Table name: coaching_credit_transactions
#
#  id                        :bigint           not null, primary key
#  amount                    :integer          not null
#  balance_after             :integer          not null
#  description               :string
#  kind                      :string           not null
#  metadata                  :jsonb            not null
#  source_type               :string
#  created_at                :datetime         not null
#  updated_at                :datetime         not null
#  account_id                :bigint           not null
#  coaching_credit_wallet_id :bigint           not null
#  source_id                 :bigint
#
# Indexes
#
#  idx_coaching_credit_tx_account          (account_id)
#  idx_coaching_credit_tx_account_created  (account_id,created_at)
#  idx_coaching_credit_tx_kind_created     (kind,created_at)
#  idx_coaching_credit_tx_source           (source_type,source_id)
#  idx_coaching_credit_tx_wallet           (coaching_credit_wallet_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (coaching_credit_wallet_id => coaching_credit_wallets.id)
#
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
