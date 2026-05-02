# frozen_string_literal: true

# == Schema Information
#
# Table name: transactions
#
#  id                        :bigint           not null, primary key
#  amount                    :decimal(, )
#  amount_cents              :bigint           default(0), not null
#  amount_currency           :string(3)        default("BRL"), not null
#  competency_date           :date
#  description               :text
#  document_number           :string
#  due_date                  :date             not null
#  exchanged_amount_cents    :bigint           default(0), not null
#  exchanged_amount_currency :string(3)        default("BRL"), not null
#  installment_number        :integer
#  installment_total         :integer
#  installment_type_cd       :integer
#  kind_cd                   :integer          default(0), not null
#  name                      :string
#  paid                      :boolean          default(FALSE), not null
#  paid_amount_cents         :bigint           default(0), not null
#  paid_amount_currency      :string(3)        default("BRL"), not null
#  paid_at                   :datetime
#  payment_method_cd         :integer          default(0), not null
#  payment_type_cd           :integer          default(0), not null
#  transaction_type_cd       :integer          default(0), not null
#  tsv_body                  :tsvector
#  created_at                :datetime         not null
#  updated_at                :datetime         not null
#  account_id                :bigint           not null
#  appointment_id            :bigint
#  bank_account_id           :bigint
#  category_id               :bigint
#  contact_id                :bigint
#  cost_center_id            :bigint
#  created_by_id             :bigint
#  import_id                 :bigint
#  installment_source_id     :bigint
#  parent_id                 :bigint
#  payment_plan_id           :bigint
#  service_id                :bigint
#  transfer_to_id            :bigint
#  updated_by_id             :bigint
#
# Indexes
#
#  index_transactions_on_account_due_date                    (account_id,due_date)
#  index_transactions_on_account_id                          (account_id)
#  index_transactions_on_account_id_and_category_id          (account_id,category_id)
#  index_transactions_on_account_id_and_contact_id           (account_id,contact_id)
#  index_transactions_on_account_id_and_cost_center_id       (account_id,cost_center_id)
#  index_transactions_on_account_id_and_due_date             (account_id,due_date DESC)
#  index_transactions_on_account_id_and_id                   (account_id,id DESC)
#  index_transactions_on_account_id_and_transaction_type_cd  (account_id,transaction_type_cd)
#  index_transactions_on_account_paid                        (account_id,paid)
#  index_transactions_on_appointment_id                      (appointment_id)
#  index_transactions_on_bank_acccount_balance               (paid DESC,kind_cd,transaction_type_cd,account_id,bank_account_id)
#  index_transactions_on_bank_account_id                     (bank_account_id)
#  index_transactions_on_category_id                         (category_id)
#  index_transactions_on_contact_id                          (contact_id)
#  index_transactions_on_cost_center_id                      (cost_center_id)
#  index_transactions_on_created_by_id                       (created_by_id)
#  index_transactions_on_credit_balance                      (paid DESC,kind_cd,transaction_type_cd,account_id,transfer_to_id)
#  index_transactions_on_delayed_transactions_filter         (account_id,paid,due_date)
#  index_transactions_on_import_id                           (import_id)
#  index_transactions_on_installment_source_id               (installment_source_id)
#  index_transactions_on_installment_type_cd                 (installment_type_cd)
#  index_transactions_on_kind_cd                             (account_id,kind_cd)
#  index_transactions_on_multisearch_columns                 (kind_cd,account_id,bank_account_id,due_date DESC)
#  index_transactions_on_paid                                (account_id,paid)
#  index_transactions_on_parent_id                           (parent_id)
#  index_transactions_on_payment_method_cd                   (payment_method_cd)
#  index_transactions_on_payment_plan_id                     (payment_plan_id)
#  index_transactions_on_payment_type_cd                     (payment_type_cd)
#  index_transactions_on_search                              (kind_cd,transaction_type_cd,account_id,due_date DESC)
#  index_transactions_on_search_bank_account                 (kind_cd,transaction_type_cd,account_id,bank_account_id,due_date DESC)
#  index_transactions_on_search_transfer_to                  (kind_cd,transaction_type_cd,account_id,transfer_to_id,due_date DESC)
#  index_transactions_on_search_without_due_date             (kind_cd,transaction_type_cd,account_id)
#  index_transactions_on_service_id                          (service_id)
#  index_transactions_on_transfer_to_id                      (transfer_to_id)
#  index_transactions_on_tsv_body                            (tsv_body) USING gin
#  index_transactions_on_updated_by_id                       (updated_by_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (appointment_id => appointments.id)
#  fk_rails_...  (bank_account_id => bank_accounts.id)
#  fk_rails_...  (category_id => domains.id)
#  fk_rails_...  (contact_id => people.id)
#  fk_rails_...  (cost_center_id => domains.id)
#  fk_rails_...  (created_by_id => users.id)
#  fk_rails_...  (import_id => imports.id)
#  fk_rails_...  (installment_source_id => transactions.id)
#  fk_rails_...  (parent_id => transactions.id)
#  fk_rails_...  (payment_plan_id => payment_plans.id)
#  fk_rails_...  (service_id => offers.id)
#  fk_rails_...  (transfer_to_id => bank_accounts.id)
#  fk_rails_...  (updated_by_id => users.id)
#
class Transaction < ApplicationRecord
  include Transactions::Constants
  include Transactions::ApiFilterable

  as_enum :kind, KINDS
  as_enum :transaction_type, TRANSACTION_TYPES
  as_enum :payment_method, PAYMENT_METHOD
  as_enum :payment_type, PAYMENT_TYPE
  as_enum :installment_type, FREQUENCIES

  AUDITED_ATTRS = %w[amount_cents competency_date document_number due_date installment_number name paid
                     payment_method_cd payment_type_cd transaction_type_cd bank_account_id contact_id category_id
                     cost_center_id transfer_to_id].freeze

  audited only: AUDITED_ATTRS, associated_with: :account, on: %i[create update destroy], if: lambda { |t| t.simple? || t.child? }

  has_prefix_id :trx, override_find: false, override_param: false

  acts_as_taggable
  acts_as_taggable_tenant :account_id


  monetize :amount_cents, :exchanged_amount_cents, :paid_amount_cents

  has_noticed_notifications

  # Associations
  acts_as_tenant :account, counter_cache: true

  include Transactions::Searchable
  include Transactions::Installments
  include Transactions::Validations
  include Transactions::Filterable
  include Transactions::ReportsMethods
  include Attachable
  include UserChanges


  # Belongs To Associations
  belongs_to :bank_account
  belongs_to :parent,       class_name: 'Transaction', optional: true
  belongs_to :transfer_to,  class_name: 'BankAccount', optional: true
  belongs_to :contact,      -> { with_discarded }, optional: true, inverse_of: :transactions
  belongs_to :category,     -> { with_discarded }, optional: true, inverse_of: :transactions
  belongs_to :cost_center,  -> { with_discarded }, optional: true, inverse_of: :transactions
  belongs_to :service,      -> { with_discarded }, optional: true, inverse_of: :transactions
  belongs_to :import,       -> { with_discarded }, optional: true, inverse_of: :transactions
  belongs_to :payment_plan, optional: true
  belongs_to :appointment,  optional: true

  # Has Many Associations
  has_many :statement_items, inverse_of: :related_transaction, foreign_key: :related_transaction_id, dependent: :delete_all
  has_many :children, class_name: 'Transaction', inverse_of: :parent, foreign_key: :parent_id, dependent: :delete_all
  has_one :invoice, class_name: 'Invoice', as: :record, dependent: :nullify

  # Nested Attributes
  accepts_nested_attributes_for :payment_plan, reject_if: :all_blank
  accepts_nested_attributes_for :children, reject_if: :all_blank, allow_destroy: true

  # Delegates
  delegate :name,     to: :contact,      allow_nil: true, prefix: true
  delegate :name,     to: :category,     allow_nil: true, prefix: true
  delegate :name,     to: :bank_account, allow_nil: true, prefix: true
  delegate :name,     to: :transfer_to,  allow_nil: true, prefix: true
  delegate :name,     to: :service,      allow_nil: true, prefix: true
  delegate :present?, to: :invoice,      prefix: true

  scope :only_paid,          -> { where(paid: true) }
  scope :only_unpaid,        -> { where(paid: false) }
  scope :revenues,           -> { where(transaction_type_cd: 0) }
  scope :expenses,           -> { where(transaction_type_cd: 1..4) }
  scope :fixed_expenses,     -> { where(transaction_type_cd: 1) }
  scope :variable_expenses,  -> { where(transaction_type_cd: 2) }
  scope :personnel_expenses, -> { where(transaction_type_cd: 3) }
  scope :taxes,              -> { where(transaction_type_cd: 4) }
  scope :transfers,          -> { where(transaction_type_cd: 5) }
  scope :ignore_transfers,   -> { where.not(transaction_type_cd: 5) }
  scope :paid_revenues,      -> { revenues.only_paid }
  scope :unpaid_revenues,    -> { revenues.only_unpaid }
  scope :paid_expenses,      -> { expenses.only_paid }
  scope :unpaid_expenses,    -> { expenses.only_unpaid }
  scope :paid_transfers,     -> { transfers.only_paid }
  scope :unpaid_transfers,   -> { transfers.only_unpaid }
  scope :reject_transfers,   -> { where(transaction_type_cd: 0..4) }

  scope :by_bank_account,           ->(bank_account_id:) { where(bank_account_id:) }
  scope :by_start_date,             ->(start_date:) { where(due_date: start_date..) }
  scope :by_end_date,               ->(end_date:) { where(due_date: ..end_date) }
  scope :by_competency_start_date,  ->(start_date:) { where(competency_date: start_date..) }
  scope :by_competency_end_date,    ->(end_date:) { where(competency_date: ..end_date) }
  scope :by_due_date,               ->(start_date:, end_date:) { where(due_date: start_date..end_date) }
  scope :by_cost_center,            ->(cost_center_id:) { where(cost_center_id:) }
  scope :by_paid,                   ->(paid:) { where(paid:) }
  scope :by_transaction_type,       ->(transaction_type:) { where(transaction_type_cd: transaction_type) }
  scope :by_type,                   ->(type:) { where(transaction_type_cd: type == :credit ? [0, 5] : 1..5) }
  scope :by_payment_method,         ->(payment_method:) { where(payment_method_cd: payment_method) }
  scope :by_category,               ->(category_id:) { where(category_id:) }
  scope :by_value,                  ->(min_value:, max_value:) { where(exchanged_amount_cents: min_value..max_value) }

  # Queries due date
  scope :delayed,          -> { only_unpaid.where(due_date: ...Current.date) }
  scope :last_day,         -> { only_unpaid.where(due_date: Current.date) }
  scope :presently,        -> { where(due_date: Current.date) }
  scope :on_time,          -> { only_unpaid.where(due_date: Current.date...) }
  scope :this_month,       -> { where(due_date: Current.date.beginning_of_month..Current.date.end_of_month) }

  scope :before_today,     -> { delayed }

  scope :this_month,       -> { where(due_date: Current.date.beginning_of_month..Current.date.end_of_month) }
  scope :last_month,       lambda {
    where(due_date: Current.date.last_month.beginning_of_month..Current.date.last_month.end_of_month)
  }
  scope :next_month,       lambda {
    where(due_date: Current.date.next_month.beginning_of_month..Current.date.next_month.end_of_month)
  }
  scope :this_year,        -> { where(due_date: Current.date.beginning_of_year..Current.date.end_of_year) }
  scope :last_year,        lambda {
    where(due_date: Current.date.last_year.beginning_of_year..Current.date.last_year.end_of_year)
  }
  scope :next_year,        lambda {
    where(due_date: Current.date.next_year.beginning_of_year..Current.date.next_year.end_of_year)
  }
  scope :this_quarter,     -> { where(due_date: Current.date.beginning_of_quarter..Current.date.end_of_quarter) }
  scope :last_quarter,     lambda {
    where(due_date: Current.date.last_quarter.beginning_of_quarter..Current.date.last_quarter.end_of_quarter)
  }
  scope :next_quarter,     lambda {
    where(due_date: Current.date.next_quarter.beginning_of_quarter..Current.date.next_quarter.end_of_quarter)
  }

  # Queries competency date
  scope :delayed_competency,          -> { only_unpaid.where(competency_date: ...Current.date) }
  scope :last_day_competency,         -> { only_unpaid.where(competency_date: Current.date) }
  scope :on_time_competency,          -> { only_unpaid.where(competency_date: Current.date...) }

  # Scopes grouped by due_date
  scope :paid_revenues_grouped_by, lambda { |period: :month|
    paid_revenues.group_by_period(period, :due_date, format: I18n.t('time.formats.month'), series: true, default_value: 0)
  }
  scope :unpaid_revenues_grouped_by, lambda { |period: :month|
    unpaid_revenues.group_by_period(period, :due_date, format: I18n.t('time.formats.month'), series: true, default_value: 0)
  }
  scope :paid_expenses_grouped_by, lambda { |period: :month|
    paid_expenses.group_by_period(period, :due_date, format: I18n.t('time.formats.month'), series: true, default_value: 0)
  }
  scope :unpaid_expenses_grouped_by, lambda { |period: :month|
    unpaid_expenses.group_by_period(period, :due_date, format: I18n.t('time.formats.month'), series: true, default_value: 0)
  }

  # Scopes for detailed transactions
  scope :only_parents,             -> { where(kind_cd: [0, 1]) }
  scope :only_simple_and_children, -> { where(kind_cd: [0, 2]) }
  scope :only_children,            -> { where(kind_cd: 2) }

  # Installments and Recurrings
  scope :installments_and_recurrings, -> { installments.or(recurrings) }

  # Scopes for balance calculation
  scope :credit_transfers,        ->(bank_account) { where(transfer_to: bank_account, transaction_type_cd: 5) }
  scope :debit_transfers,         ->(bank_account) { where(bank_account:, transaction_type_cd: 5) }
  scope :credits_by_bank_account, ->(bank_account) { where(bank_account:).revenues.or(credit_transfers(bank_account)) }
  scope :debits_by_bank_account,  ->(bank_account) { where(bank_account:, transaction_type_cd: 1..5) }

  scope :credit_transfers_by_bank_account_ids, lambda { |bank_account_ids|
    where(transfer_to_id: bank_account_ids, transaction_type_cd: 5)
  }
  scope :debit_transfers_by_bank_account_ids, lambda { |bank_account_ids|
    where(bank_account_id: bank_account_ids, transaction_type_cd: 5)
  }
  scope :credits_by_bank_account_ids, lambda { |bank_account_ids|
    where(bank_account_id: bank_account_ids).revenues.or(credit_transfers_by_bank_account_ids(bank_account_ids))
  }
  scope :debits_by_bank_account_ids, lambda { |bank_account_ids|
    where(bank_account_id: bank_account_ids, transaction_type_cd: 1..5)
  }

  # Callbacks
  before_validation :set_exchanged_amount, if: :amount_changed?
  before_save :set_default_name, if: -> { name.blank? && service.present? }
  after_save :update_children, if: :detailed?
  after_commit :update_bank_account_balance, if: -> { saved_change_to_paid? || saved_change_to_amount_cents? || saved_change_to_bank_account_id? || saved_change_to_transfer_to_id? }

  after_update_commit do
    publish 'transaction_updated', record: self
    publish 'transaction_paid', record: self if paid? && paid_previously_changed?
    publish 'transaction_unpaid', record: self if !paid? && paid_previously_changed?
    publish 'transaction_amount_updated', record: self if amount_cents_previously_changed?
  end

  after_create_commit do
    publish 'transaction_created', record: self
    publish 'transaction_paid', record: self if paid?
    # Atualizar saldo da conta bancária após criar transação
    update_bank_account_balance if paid?
  end

  after_destroy_commit do
    publish 'transaction_deleted', record: self
  end

  def amount_cents=(value)
    super(TransactionsHelper.parse_str_to_cents(value:))
  end

  def exchanged_amount_cents=(value)
    super(TransactionsHelper.parse_str_to_cents(value:))
  end

  def due_date=(value)
    super(TransactionsHelper.parse_str_to_date(value:))
  end

  def competency_date=(value)
    super(TransactionsHelper.parse_str_to_date(value:))
  end

  def same_currency?
    exchanged_amount_currency == amount_currency
  end

  def expense?
    %i[fixed_expense variable_expense payroll tax].include?(transaction_type)
  end

  def unpaid?
    !paid?
  end

  def self.duplicatable_attributes
    column_names - %w[id document_number competency_date created_at updated_at installment_number installment_total
                      installment_type_cd installment_source_id payment_type_cd]
  end

  def self.update_installment_attributes(exclude: [])
    %w[due_date name description amount_cents amount_currency category_id contact_id cost_center_id payment_method_cd
       transaction_type_cd bank_account_id tag_list competency_date] - exclude
  end

  def delayed?
    due_date < Current.date && unpaid?
  end

  def delay_in_days
    (due_date - Current.date).to_i
  end

  def due_today?
    due_date == Current.date && unpaid?
  end

  def partially_paid?
    return false if transfer?

    detailed? && unpaid? && paid_amount_cents.positive? && paid_amount_cents < amount_cents
  end

  def sum_children_amount_cents
    children.reject(&:_destroy).sum(&:amount_cents)
  end

  def sum_children_paid_amount_cents
    children.reject(&:_destroy).select(&:paid).sum(&:amount_cents)
  end

  def remaining_amount_cents
    amount_cents - sum_children_amount_cents
  end

  def all_children_paid?
    children.reject(&:_destroy).all?(&:paid)
  end

  def update_balances?
    paid_previously_changed? ||
      (paid? && (
        amount_cents_previously_changed? ||
          transaction_type_cd_previously_changed? ||
          bank_account_id_previously_changed? ||
          transfer_to_id_previously_changed?
      ))
  end

  def reset_installment_attributes
    self.payment_type_cd = 0
    self.installment_type_cd = nil
    self.installment_number = nil
    self.installment_total = nil
    self.payment_plan_id = nil
  end

  def self.columns_that_affects_balance
    %i[amount_cents paid bank_account_id transfer_to_id paid_amount_cents]
  end

  def self.sortable_columns
    @sortable_columns ||= %w[due_date transaction_name contact_name category_name bank_account_name transfer_to_name
                             exchanged_amount_cents paid]
  end

  def update_from_parent
    return if parent.blank?

    self.bank_account_id = parent.bank_account_id
    self.transaction_type = parent.transaction_type
    self.tag_list = parent.tag_list
    self.payment_method_cd = parent.payment_method_cd

    save(validate: false)
  end

  def amount_disabled?
    !simple? || invoice.present?
  end

  def amount_changed?
    amount_cents_changed? || amount_currency_changed?
  end

  # Callback para fazer a conversão do amount para o exchanged_amount (moeda padrão do usuário)
  def set_exchanged_amount
    self.exchanged_amount =
      if same_currency?
        amount
      else
        amount.exchange_to(account.default_currency || Money.default_currency)
      end
  end

  def update_children
    return unless detailed?

    children.includes(:parent, { taggings: :tag }).find_each(&:update_from_parent)
  end

  def set_default_name
    self.name = service.name
    self.description = service.description if description.blank?
  end

  def update_bank_account_balance
    return unless bank_account.present?
    
    # Atualizar saldo apenas se a transação estiver paga
    # O saldo é recalculado baseado em todas as transações pagas
    bank_account.update_balance! if paid?
    
    # Se for transferência, também atualizar a conta de destino
    if transfer? && transfer_to.present?
      transfer_to.update_balance! if paid?
    end
  rescue => e
    Rails.logger.error "Erro ao atualizar saldo da conta bancária: #{e.message}"
    # Não falhar a transação se houver erro ao atualizar saldo
  end

  def payment_method_name
    I18n.t("enums.payment_method.#{Transaction.payment_methods.key(payment_method_cd)}")
  end

  # Métodos auxiliares para API
  def formatted_amount
    amount_cents / 100.0
  end

  def formatted_due_date
    due_date&.strftime('%d/%m/%Y')
  end

  def formatted_paid_at
    paid_at&.strftime('%d/%m/%Y')
  end

  def transaction_type_name
    I18n.t("enums.transaction_type.#{Transaction.transaction_types.key(transaction_type_cd)}")
  end
end
