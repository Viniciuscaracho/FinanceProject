# frozen_string_literal: true

# == Schema Information
#
# Table name: invoices
#
#  id                     :bigint           not null, primary key
#  amount_cents           :bigint           default(0), not null
#  canceled_at            :datetime
#  currency               :string           default("BRL"), not null
#  description            :text
#  discount_cents         :bigint           default(0), not null
#  discount_description   :string
#  discount_percentage    :decimal(10, 2)   default(0.0), not null
#  drafted_at             :datetime
#  due_date               :date
#  issue_date             :date
#  metadata               :jsonb            not null
#  name                   :string
#  number                 :integer
#  opened_at              :datetime
#  paid_at                :datetime
#  record_type            :string
#  sent_at                :datetime
#  status                 :string           default("draft"), not null
#  subtotal_cents         :bigint           default(0), not null
#  sync_with_transaction  :boolean          default(TRUE), not null
#  tax_already_applied    :boolean          default(TRUE), not null
#  tax_cents              :bigint           default(0), not null
#  tax_description        :string
#  tax_percentage         :decimal(10, 2)   default(0.0), not null
#  total_before_tax_cents :bigint           default(0), not null
#  total_cents            :bigint           default(0), not null
#  tsv_body               :tsvector
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  account_id             :bigint           not null
#  bank_account_id        :bigint           not null
#  provider_id            :bigint           not null
#  recipient_id           :bigint           not null
#  record_id              :bigint
#
# Indexes
#
#  index_invoices_on_account_id                 (account_id)
#  index_invoices_on_account_id_and_due_date    (account_id,due_date)
#  index_invoices_on_account_id_and_issue_date  (account_id,issue_date)
#  index_invoices_on_account_id_and_number      (account_id,number)
#  index_invoices_on_account_id_and_status      (account_id,status)
#  index_invoices_on_bank_account_id            (bank_account_id)
#  index_invoices_on_provider_id                (provider_id)
#  index_invoices_on_recipient_id               (recipient_id)
#  index_invoices_on_record                     (record_type,record_id)
#  index_invoices_on_tsv_body                   (tsv_body) USING gin
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (bank_account_id => bank_accounts.id)
#  fk_rails_...  (provider_id => people.id)
#  fk_rails_...  (recipient_id => people.id)
#
class Invoice < ApplicationRecord
  include Invoices::Searchable
  include Invoices::Workflow
  include Attachable

  acts_as_tenant :account
  acts_as_sequenced scope: :account_id, column: :number, start_at: ->(invoice) { invoice.number_start_at }
  has_prefix_id :inv, override_find: false, override_param: false

  audited associated_with: :account

  monetize :total_before_tax_cents, with_model_currency: :currency
  monetize :subtotal_cents, with_model_currency: :currency
  monetize :tax_cents,      with_model_currency: :currency
  monetize :discount_cents, with_model_currency: :currency
  monetize :total_cents,    with_model_currency: :currency

  validates :due_date, :issue_date, :bank_account_id, :provider_id, :recipient_id, :lines, presence: true
  validates :subtotal_cents, :tax_cents, :discount_cents, :total_cents, numericality: { greater_than_or_equal_to: 0 }

  validates_associated :lines

  belongs_to :bank_account
  belongs_to :provider,  class_name: 'Company'
  belongs_to :recipient, -> { with_discarded }, class_name: 'Contact'
  belongs_to :record, polymorphic: true, optional: true

  has_many :lines, class_name: 'InvoiceLine', inverse_of: :invoice, dependent: :delete_all

  accepts_nested_attributes_for :lines, allow_destroy: true, reject_if: :all_blank
  accepts_nested_attributes_for :recipient, reject_if: :all_blank
  accepts_nested_attributes_for :provider, reject_if: :all_blank

  before_save :calculate_all, :update_name

  after_create_commit -> { publish 'invoice_created', record: self }
  after_update_commit do
    publish('invoice_updated', invoice: self)
    broadcast_replace_later_to [account, :invoices]
  end
  after_destroy_commit -> { publish 'invoice_deleted', record: self }

  def self.sortable_columns
    %w[number due_date total_cents status name recipient_name]
  end

  def amount_cents=(value)
    super(TransactionsHelper.parse_str_to_cents(value:))
  end

  def calculate_all
    calculate_lines_total_price
    calculate_subtotal
    calculate_discount
    calculate_tax
    calculate_total
  end

  def calculate_subtotal
    self.subtotal = (lines || []).reject(&:_destroy).map(&:total_price).inject(Money.new(0, currency), :+)
  end

  def calculate_discount
    return self.discount = Money.new(0, currency) if discount_percentage.blank? || discount_percentage.to_i.zero?

    self.discount = subtotal * (discount_percentage.to_f / 100)
  end

  def calculate_tax
    return self.tax = Money.new(0, currency) if tax_percentage.blank? || tax_percentage.to_i.zero?

    self.tax = (subtotal - discount) * (tax_percentage.to_f / 100)
  end

  def calculate_total
    self.total = if tax_already_applied?
                   (subtotal - discount)
                 else
                   (subtotal - discount + tax)
                 end

    self.total_before_tax = (total - tax)
  end

  def calculate_lines_total_price
    (lines || []).each(&:calculate_total_price)
  end

  def formatted_due_date
    I18n.l(due_date, format: :default)
  end

  def recipient_name
    recipient&.name
  end

  def bank_account_name
    bank_account&.name
  end

  def formatted_total
    total.format
  end

  def disabled?
    persisted? && (canceled? || paid?)
  end

  def sent?
    sent_at.present?
  end

  def not_sent?
    !sent?
  end

  def number_start_at
    account.invoice_number_starts_at || 1
  end

  def overdue?
    !paid? && due_date < Date.current
  end

  def overdue_days
    (Date.current - due_date).to_i
  end

  def due_today?
    !paid? && due_date == Date.current
  end

  def on_time?
    !paid? && due_date > Date.current
  end

  def paid_overdue?
    paid? && paid_at > due_date
  end

  private

  def update_name
    self.name = lines.map(&:description).join(' + ')
  end
end
