# frozen_string_literal: true

# == Schema Information
#
# Table name: anamnese_responses
#
#  id                   :bigint           not null, primary key
#  filled_at            :datetime
#  responses            :jsonb            not null
#  created_at           :datetime         not null
#  updated_at           :datetime         not null
#  account_id           :bigint           not null
#  anamnese_template_id :bigint
#  appointment_id       :bigint
#  contact_id           :bigint
#
# Indexes
#
#  idx_anamnese_responses_unique_appointment         (account_id,appointment_id) UNIQUE WHERE (appointment_id IS NOT NULL)
#  index_anamnese_responses_on_account_id            (account_id)
#  index_anamnese_responses_on_anamnese_template_id  (anamnese_template_id)
#  index_anamnese_responses_on_appointment_id        (appointment_id)
#  index_anamnese_responses_on_contact_id            (contact_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (anamnese_template_id => anamnese_templates.id)
#  fk_rails_...  (appointment_id => appointments.id)
#  fk_rails_...  (contact_id => people.id)
#
class AnamneseResponse < ApplicationRecord
  acts_as_tenant :account

  belongs_to :appointment,       optional: true
  belongs_to :anamnese_template, optional: true
  belongs_to :contact,           optional: true, class_name: 'Contact', foreign_key: 'contact_id'

  validates :appointment_id, uniqueness: { scope: :account_id, message: 'já possui uma anamnese' },
                             allow_nil: true

  before_save :set_filled_at

  private

  def set_filled_at
    self.filled_at = Time.current if responses.present? && filled_at.blank?
  end
end
