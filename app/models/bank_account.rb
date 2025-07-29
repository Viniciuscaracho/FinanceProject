# frozen_string_literal: true

# == Schema Information
#
# Table name: bank_accounts
#
#  id                       :bigint           not null, primary key
#  account_number           :string
#  account_type_cd          :integer          default(0), not null
#  agency                   :string
#  balance_cents            :bigint           default(0), not null
#  balance_currency         :string(3)        default("BRL"), not null
#  default                  :boolean          default(FALSE), not null
#  discarded_at             :datetime
#  initial_balance_cents    :bigint           default(0), not null
#  initial_balance_currency :string(3)        default("BRL"), not null
#  name                     :string           not null
#  created_at               :datetime         not null
#  updated_at               :datetime         not null
#  account_id               :bigint           not null
#  bank_id                  :bigint
#  created_by_id            :bigint
#  updated_by_id            :bigint
#
# Indexes
#
#  index_bank_accounts_on_account_id           (account_id)
#  index_bank_accounts_on_account_id_and_id    (account_id,id)
#  index_bank_accounts_on_account_type_cd      (account_type_cd)
#  index_bank_accounts_on_bank_id              (bank_id)
#  index_bank_accounts_on_created_by_id        (created_by_id)
#  index_bank_accounts_on_discarded_at         (discarded_at)
#  index_bank_accounts_on_multisearch_columns  (account_id,discarded_at NULLS FIRST)
#  index_bank_accounts_on_updated_by_id        (updated_by_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (bank_id => banks.id)
#  fk_rails_...  (created_by_id => users.id)
#  fk_rails_...  (updated_by_id => users.id)
#
class BankAccount < ApplicationRecord
  ACCOUNT_TYPES = {
    current_account: 0, # conta corrente
    savings_account: 1, # conta poupança
    salary_account: 2, # conta salário
    investing_account: 3, # conta investimento
    cash_account: 4, # caixa
    wallet: 5, # carteira
    other: 6
  }.freeze

  as_enum :account_type, ACCOUNT_TYPES

  include BankAccounts::Searchable
  include BankAccounts::BalanceControl
  include BankAccounts::Validations
  include UserChanges
  include Discard::Model

  audited associated_with: :account

  monetize :initial_balance_cents
  monetize :balance_cents

  # acts_as_tenant :account, counter_cache: true
  belongs_to :account, counter_cache: true
  belongs_to :bank, optional: true

  has_many :transactions, dependent: :restrict_with_error
  has_many :transactions_as_recipient,
           class_name: 'Transaction',
           inverse_of: :transfer_to,
           foreign_key: :transfer_to_id,
           dependent: :restrict_with_error
  has_many :statements, dependent: :delete_all
  has_many :statement_items, through: :statements
  has_many :statement_items_as_source,
           class_name: 'StatementItem',
           inverse_of: :bank_account_source,
           foreign_key: :bank_account_source_id,
           dependent: :delete_all
  has_many :statement_items_as_target,
           class_name: 'StatementItem',
           foreign_key: :bank_account_source_id,
           inverse_of: :bank_account_target,
           dependent: :delete_all

  validates :name, presence: true
  validates :initial_balance_cents,
            presence: true,
            numericality: {
              greater_than_or_equal_to: -999_999_999_999,
              less_than_or_equal_to: 999_999_999_999
            }

  before_validation on: :update do
    without_auditing { other_bank_accounts.update!(default: false) if default_changed? && default? }
  end

  after_update_commit :reload_frames_after_commit

  after_update_commit do
    publish 'bank_account_updated', record: self
  end

  after_create_commit do
    publish 'bank_account_created', record: self
  end

  after_destroy_commit do
    publish 'bank_account_deleted', record: self
  end

  def event_attributes
    super.slice(:id, :account_id, :name, :balance_cents, :discarded_at)
  end

  def reload_frames_after_commit
    return if account.blank?
    return unless balance_cents_previously_changed?

    broadcast_action_to account, :bank_account_balance,
                        action: :turbo_frame_reload,
                        target: :bank_account_balance,
                        html: '', locals: {}
  end

  def initial_balance_cents=(value)
    super(TransactionsHelper.parse_str_to_cents(value:))
  end

  def balance_cents=(value)
    super(TransactionsHelper.parse_str_to_cents(value:))
  end

  def other_bank_accounts
    account.bank_accounts.where.not(id: self)
  end

  def self.default
    find_by(default: true)
  end

  def in_use?
    default? ||
      transactions.exists? ||
      transactions_as_recipient.exists? ||
      statements.exists? ||
      statement_items_as_source.exists? ||
      statement_items_as_target.exists?
  end

  def not_in_use?
    !in_use?
  end

  def archive_or_destroy!
    if default?
      errors.add(:base, I18n.t('activerecord.errors.models.bank_account.default'))
      raise ActiveRecord::RecordInvalid, self
    elsif in_use?
      discard
    else
      destroy!
    end

  end

  def toggle_archived
    discarded? ? undiscard : discard
  end

  def archived?
    discarded?
  end

  def event_name
    return 'contact_deleted' if discarded?

    'contact_updated'
  end
end
