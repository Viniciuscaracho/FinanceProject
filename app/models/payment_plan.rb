# == Schema Information
#
# Table name: payment_plans
#
#  id                     :bigint           not null, primary key
#  amount_cents           :bigint           default(0), not null
#  amount_currency        :string(3)        default("BRL"), not null
#  amount_type_cd         :integer          default(0), not null
#  discarded_at           :datetime
#  frequency_cd           :integer          default(3), not null
#  number_of_installments :integer          default(3), not null
#  type_cd                :integer          default(0), not null
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  account_id             :bigint           not null
#
# Indexes
#
#  index_payment_plans_on_account_id              (account_id)
#  index_payment_plans_on_account_id_and_type_cd  (account_id,type_cd)
#  index_payment_plans_on_amount_type_cd          (amount_type_cd)
#  index_payment_plans_on_discarded_at            (discarded_at)
#  index_payment_plans_on_frequency_cd            (frequency_cd)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#

# Indexes
#
#  index_payment_plans_on_account_id              (account_id)
#  index_payment_plans_on_account_id_and_type_cd  (account_id,type_cd)
#  index_payment_plans_on_amount_type_cd          (amount_type_cd)
#  index_payment_plans_on_discarded_at            (discarded_at)
#  index_payment_plans_on_frequency_cd            (frequency_cd)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
class PaymentPlan < ApplicationRecord
  MIN_NUMBER_OF_INSTALLMENTS = 2
  MAX_NUMBER_OF_INSTALLMENTS = 120
  TYPES = {
    installment: 0, # parcelado (padrão)
    recurring: 1    # recorrente
  }.freeze

  AMOUNT_TYPES = {
    total_amount: 0,        # valor total (padrão)
    installment_amount: 1   # valor da parcela
  }.freeze

  FREQUENCIES = {
    daily: 0,
    weekly: 1,
    biweekly: 2,
    monthly: 3,   # padrão
    bimonthly: 4,
    quarterly: 5,
    semiannual: 6,
    annual: 7
  }.freeze

  as_enum :type, TYPES
  as_enum :amount_type, AMOUNT_TYPES
  as_enum :frequency, Transaction::FREQUENCIES

  monetize :amount_cents

  acts_as_tenant :account

  include Discardable

  has_many :transactions, dependent: :restrict_with_error

  validates :frequency, :number_of_installments, presence: true, if: :recurring?
  validates :amount_cents, :frequency, :number_of_installments, presence: true, if: :installment?
  validates :number_of_installments, numericality: { greater_than_or_equal_to: MIN_NUMBER_OF_INSTALLMENTS, less_than: MAX_NUMBER_OF_INSTALLMENTS }

  accepts_nested_attributes_for :transactions, allow_destroy: true

  after_save :sum_amount_cents

  def amount_cents=(value)
    super(TransactionsHelper.parse_str_to_cents(value:))
  end

  private

  def sum_amount_cents
    return unless installment?

    transactions.reload
    update_columns(amount_cents: transactions.sum(&:amount_cents))
  end
end
