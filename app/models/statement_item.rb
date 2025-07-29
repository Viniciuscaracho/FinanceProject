# frozen_string_literal: true

# == Schema Information
#
# Table name: statement_items
#
#  id                     :bigint           not null, primary key
#  amount_cents           :bigint           default(0), not null
#  amount_currency        :string(3)        default("BRL"), not null
#  confirmed_at           :datetime
#  discarded_at           :datetime
#  document_number        :string           not null
#  due_date               :date             not null
#  ignored_at             :datetime
#  memo                   :string           not null
#  name                   :string           not null
#  posted_at              :date             not null
#  reconciled_at          :datetime
#  status_cd              :integer          default(0), not null
#  transaction_type_cd    :integer
#  type_cd                :integer          not null
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  bank_account_source_id :bigint
#  bank_account_target_id :bigint
#  category_id            :bigint
#  contact_id             :bigint
#  related_transaction_id :bigint
#  statement_id           :bigint           not null
#
# Indexes
#
#  index_statement_items_on_bank_account_source_id  (bank_account_source_id)
#  index_statement_items_on_bank_account_target_id  (bank_account_target_id)
#  index_statement_items_on_category_id             (category_id)
#  index_statement_items_on_contact_id              (contact_id)
#  index_statement_items_on_discarded_at            (discarded_at)
#  index_statement_items_on_related_transaction_id  (related_transaction_id)
#  index_statement_items_on_statement_id            (statement_id)
#  index_statement_items_on_status_cd               (status_cd)
#  index_statement_items_on_transaction_type_cd     (transaction_type_cd)
#  index_statement_items_on_type_cd                 (type_cd)
#
# Foreign Keys
#
#  fk_rails_...  (bank_account_source_id => bank_accounts.id)
#  fk_rails_...  (bank_account_target_id => bank_accounts.id)
#  fk_rails_...  (category_id => domains.id)
#  fk_rails_...  (contact_id => people.id)
#  fk_rails_...  (related_transaction_id => transactions.id)
#  fk_rails_...  (statement_id => statements.id)
#
class StatementItem < ApplicationRecord
  include Discardable

  STATEMENT_ITEM_TYPES = {
    credit: 0,
    debit: 1
  }.freeze

  STATUSES = {
    new: 0,
    suggested: 1,
    confirmed: 2,
    ignored: 3,
    reconciled: 4,
    unreconciled: 5
  }.freeze

  as_enum :transaction_type, Transaction::TRANSACTION_TYPES
  as_enum :type, STATEMENT_ITEM_TYPES
  as_enum :status, STATUSES

  monetize :amount_cents

  scope :credit,        -> { where(credit_cd: 0) }
  scope :debit,         -> { where(credit_cd: 1) }
  scope :pendings,      -> { where(status_cd: [0, 1]) }
  scope :confirmeds,    -> { where(status_cd: 2) }
  scope :ignoreds,      -> { where(status_cd: 3) }
  scope :reconcileds,   -> { where(status_cd: 4) }
  scope :unreconcileds, -> { where(status_cd: 5) }

  belongs_to :statement
  belongs_to :contact,  -> { with_discarded }, optional: true, inverse_of: :statement_items
  belongs_to :category, -> { with_discarded }, optional: true, inverse_of: :statement_items
  belongs_to :bank_account_source, class_name: 'BankAccount', optional: true
  belongs_to :bank_account_target, class_name: 'BankAccount', optional: true
  belongs_to :related_transaction, class_name: 'Transaction',
                                   inverse_of: :statement_items,
                                   optional: true

  validates :transaction_type, presence: true, if: :confirmed?

  def amount_cents=(value)
    super(TransactionsHelper.parse_str_to_cents(value:))
  end

  def transaction_found?
    related_transaction.present?
  end

  def transaction_not_found?
    !transaction_found?
  end

  def reconcile
    return update(status: :unreconciled) unless confirmed?
    return if transaction_type.blank?

    if transaction_found?
      update_existing_transaction
    else
      created_transaction = case transaction_type.to_sym
                            when :transfer
                              credit? ? create_new_transfer_in : create_new_transfer_out
                            else
                              create_new_transaction(transaction_type:)
                            end

      self.related_transaction = created_transaction
    end

    self.status = :reconciled
    self.reconciled_at = Time.current
    save
  end

  private

  def confirmed_or_ignored?
    confirmed? || ignored?
  end

  def create_new_transaction(transaction_type:)
    statement.account.transactions.create(
      bank_account: statement.bank_account,
      transaction_type:,
      due_date: posted_at,
      name:,
      contact:,
      category:,
      paid: true,
      paid_at: posted_at,
      amount_cents:,
      amount_currency:
    )
  end

  def create_new_transfer_in
    statement.account.transactions.create(
      bank_account: bank_account_source,
      transfer_to: statement.bank_account,
      transaction_type:,
      due_date: posted_at,
      name:,
      contact:,
      category:,
      paid: true,
      paid_at: posted_at,
      amount_cents:,
      amount_currency:
    )
  end

  def create_new_transfer_out
    statement.account.transactions.create(
      bank_account: statement.bank_account,
      transfer_to: bank_account_target,
      transaction_type:,
      due_date: posted_at,
      name:,
      contact:,
      category:,
      paid: true,
      paid_at: posted_at,
      amount_cents:,
      amount_currency:
    )
  end

  def update_existing_transaction
    related_transaction.update(
      due_date: posted_at,
      amount_cents:,
      paid: true,
      paid_at: posted_at
    )
  end
end
