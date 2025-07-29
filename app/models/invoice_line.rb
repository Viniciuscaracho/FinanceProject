# frozen_string_literal: true

# == Schema Information
#
# Table name: invoice_lines
#
#  id                :bigint           not null, primary key
#  currency          :string           default("BRL"), not null
#  description       :text
#  metadata          :jsonb            not null
#  quantity          :decimal(10, 2)   default(0.0), not null
#  record_type       :string
#  total_price_cents :bigint           default(0), not null
#  unit              :string
#  unit_price_cents  :bigint           default(0), not null
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  invoice_id        :bigint           not null
#  offer_id          :bigint
#  record_id         :bigint
#  sequential_id     :integer
#
# Indexes
#
#  index_invoice_lines_on_invoice_id  (invoice_id)
#  index_invoice_lines_on_offer_id    (offer_id)
#  index_invoice_lines_on_record      (record_type,record_id)
#
# Foreign Keys
#
#  fk_rails_...  (invoice_id => invoices.id)
#  fk_rails_...  (offer_id => offers.id)
#
class InvoiceLine < ApplicationRecord
  acts_as_sequenced scope: :invoice_id, start_at: 1

  monetize :unit_price_cents, with_model_currency: :currency
  monetize :total_price_cents, with_model_currency: :currency

  validates :quantity, numericality: { greater_than_or_equal_to: 0.0 }
  validates :unit_price_cents,
            numericality: {
              greater_than_or_equal_to: 0,
              less_than_or_equal_to: 999_999_999_999
            }
  validates :total_price_cents,
            numericality: {
              greater_than_or_equal_to: 0,
              less_than_or_equal_to: 999_999_999_999
            }
  validates :description, presence: true

  belongs_to :invoice, inverse_of: :lines
  belongs_to :offer, optional: true
  belongs_to :record, polymorphic: true, optional: true

  before_validation :set_description

  def unit_price_cents=(value)
    super(TransactionsHelper.parse_str_to_cents(value: value.presence || 0))
  end

  def total_price_cents=(value)
    super(TransactionsHelper.parse_str_to_cents(value: value.presence || 0))
  end

  def quantity=(value)
    super(value.presence || 0)
  end

  def calculate_total_price
    self.total_price = unit_price * quantity
  end

  private

  def set_description
    return if offer.blank?

    self.description = offer&.name
  end
end
