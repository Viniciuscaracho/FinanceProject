# frozen_string_literal: true

# == Schema Information
#
# Table name: appointment_commissions
#
#  id                      :bigint           not null, primary key
#  commission_amount_cents :integer          not null
#  commission_type         :integer          not null
#  commission_value        :decimal(8, 2)    not null
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#  account_user_id         :bigint           not null
#  appointment_id          :bigint           not null
#
# Indexes
#
#  index_appointment_commissions_on_account_user_id  (account_user_id)
#  index_appointment_commissions_on_appointment_id   (appointment_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_user_id => account_users.id)
#  fk_rails_...  (appointment_id => appointments.id)
#
class AppointmentCommission < ApplicationRecord
  COMMISSION_TYPES = {
    percentage: 0,
    fixed: 1
  }.freeze

  as_enum :commission_type, COMMISSION_TYPES, source: :commission_type

  belongs_to :appointment
  belongs_to :account_user # Profissional que receberá a comissão

  validates :commission_value, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :commission_amount_cents, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :appointment_id, uniqueness: { scope: :account_user_id, message: 'já possui uma comissão para este profissional' }

  # Usar monetize com currency fixa para evitar problemas
  monetize :commission_amount_cents, with_currency: 'BRL'
end

