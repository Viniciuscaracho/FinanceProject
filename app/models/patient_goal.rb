# frozen_string_literal: true

# == Schema Information
#
# Table name: patient_goals
#
#  id               :bigint           not null, primary key
#  current_value    :decimal(10, 2)
#  deadline         :date
#  notes            :text
#  progress_history :jsonb            not null
#  status           :integer          default(0), not null
#  target_value     :decimal(10, 2)
#  title            :string           not null
#  unit             :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  account_id       :bigint           not null
#  contact_id       :bigint           not null
#
# Indexes
#
#  index_patient_goals_on_account_id                 (account_id)
#  index_patient_goals_on_account_id_and_contact_id  (account_id,contact_id)
#  index_patient_goals_on_contact_id                 (contact_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (contact_id => people.id)
#
class PatientGoal < ApplicationRecord
  acts_as_tenant :account

  belongs_to :contact, class_name: 'Contact', foreign_key: 'contact_id'

  STATUSES = { active: 0, completed: 1, abandoned: 2 }.freeze
  as_enum :status, STATUSES, source: :status

  validates :title, presence: true, length: { maximum: 200 }
  validates :contact_id, presence: true

  scope :active,    -> { where(status: STATUSES[:active]) }
  scope :recent,    -> { order(created_at: :desc) }
  scope :for_contact, ->(contact_id) { where(contact_id: contact_id) }

  def add_progress(value, note = nil, date = Date.current)
    entry = {
      value:       value.to_f,
      note:        note.presence,
      date:        date.iso8601,
      recorded_at: Time.current.iso8601
    }
    self.current_value    = value.to_f
    self.progress_history = (progress_history || []) + [entry]
    save
  end

  def progress_percentage
    return nil unless target_value.present? && current_value.present? && target_value != 0

    # For weight-loss goals: progress toward target (lower = better)
    # For simple numeric goals: progress toward target (higher = better)
    # We just show absolute distance as percentage of target
    ((current_value / target_value) * 100).round(1)
  end
end
