# frozen_string_literal: true

# == Schema Information
#
# Table name: pix_billings
#
#  id          :bigint           not null, primary key
#  amount      :integer          not null
#  billing_url :string
#  expires_at  :datetime
#  frequency   :string           default("MONTHLY"), not null
#  metadata    :jsonb            not null
#  paid_at     :datetime
#  plan_name   :string
#  status      :string           default("PENDING"), not null
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  account_id  :bigint           not null
#  billing_id  :string           not null
#  plan_id     :string
#
# Indexes
#
#  index_pix_billings_on_account_id             (account_id)
#  index_pix_billings_on_account_id_and_status  (account_id,status)
#  index_pix_billings_on_billing_id             (billing_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
class PixBilling < ApplicationRecord
  STATUSES = %w[PENDING PAID EXPIRED CANCELLED].freeze

  belongs_to :account

  validates :billing_id, presence: true, uniqueness: true
  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :status, inclusion: { in: STATUSES }

  scope :pending, -> { where(status: 'PENDING') }
  scope :paid, -> { where(status: 'PAID') }

  def paid?
    status == 'PAID'
  end

  def pending?
    status == 'PENDING'
  end
end
