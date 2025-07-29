# frozen_string_literal: true

# == Schema Information
#
# Table name: statements
#
#  id              :bigint           not null, primary key
#  discarded_at    :datetime
#  ends_at         :date
#  starts_at       :date
#  type_cd         :integer          not null
#  workflow_state  :string           not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  account_id      :bigint           not null
#  bank_account_id :bigint           not null
#
# Indexes
#
#  index_statements_on_account_id       (account_id)
#  index_statements_on_bank_account_id  (bank_account_id)
#  index_statements_on_discarded_at     (discarded_at)
#  index_statements_on_type_cd          (type_cd)
#  index_statements_on_workflow_state   (workflow_state)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (bank_account_id => bank_accounts.id)
#
class Statement < ApplicationRecord
  include Discardable

  STATEMENT_TYPES = { ofx: 0 }.freeze
  STATEMENT_STATES = %w[pending done].freeze

  as_enum :type, STATEMENT_TYPES
  as_enum :state, STATEMENT_STATES, source: :workflow_state, map: :string

  acts_as_tenant :account
  belongs_to :bank_account

  has_many :statement_items, dependent: :delete_all
  has_many :bank_account_targets, through: :statement_items
  has_many :bank_account_sources, through: :statement_items
  has_one_attached :file, dependent: :destroy

  accepts_nested_attributes_for :statement_items

  validates :bank_account_id, presence: true
  validates :file, presence: true

  def confirmed_count
    statement_items.confirmeds.count
  end

  def ignored_count
    statement_items.ignoreds.count
  end

  def pending_count
    statement_items.pendings.count
  end

  def reconciled_count
    statement_items.reconcileds.count
  end

  def unreconciled_count
    statement_items.unreconcileds.count
  end
end
