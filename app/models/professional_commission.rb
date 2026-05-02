# frozen_string_literal: true

# == Schema Information
#
# Table name: professional_commissions
#
#  id               :bigint           not null, primary key
#  commission_type  :integer          default(0)
#  commission_value :decimal(8, 2)    not null
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  account_user_id  :bigint           not null
#  service_id       :bigint           not null
#
# Indexes
#
#  index_professional_commissions_on_account_user_id  (account_user_id)
#  index_professional_commissions_on_service_id       (service_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_user_id => account_users.id)
#  fk_rails_...  (service_id => services.id)
#
class ProfessionalCommission < ApplicationRecord
  COMMISSION_TYPES = {
    percentage: 0,
    fixed: 1
  }.freeze

  as_enum :commission_type, COMMISSION_TYPES, source: :commission_type

  belongs_to :account_user
  belongs_to :service

  validates :commission_value, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :account_user_id, uniqueness: { scope: :service_id, message: 'já possui configuração de comissão para este serviço' }

  def amount_cents_for(price_cents)
    if percentage?
      (price_cents * commission_value / 100).round
    else
      (commission_value * 100).round
    end
  end
end
