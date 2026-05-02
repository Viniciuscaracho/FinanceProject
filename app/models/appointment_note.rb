# frozen_string_literal: true

# == Schema Information
#
# Table name: appointment_notes
#
#  id             :bigint           not null, primary key
#  notes          :text
#  patient_tasks  :jsonb            not null
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  account_id     :bigint           not null
#  appointment_id :bigint           not null
#
# Indexes
#
#  index_appointment_notes_on_account_id                     (account_id)
#  index_appointment_notes_on_account_id_and_appointment_id  (account_id,appointment_id)
#  index_appointment_notes_on_appointment_id                 (appointment_id)
#  index_appointment_notes_on_patient_tasks                  (patient_tasks) USING gin
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (appointment_id => appointments.id)
#
class AppointmentNote < ApplicationRecord
  acts_as_tenant :account

  belongs_to :appointment
  belongs_to :account

  validates :notes, presence: true, length: { minimum: 3 }
  validates :appointment_id, uniqueness: { scope: :account_id, message: 'já possui uma anotação' }, on: :create

  scope :recent, -> { order(created_at: :desc) }
  scope :by_appointment, ->(appointment_id) { where(appointment_id: appointment_id) }

  # Tarefas do paciente (homework/tarefas de casa)
  # Formato: [{ id: uuid, description: string, status: 'pending'|'completed', created_at: datetime, completed_at: datetime }]
  def add_patient_task(description)
    task = {
      id: SecureRandom.uuid,
      description: description,
      status: 'pending',
      created_at: Time.current.iso8601
    }
    self.patient_tasks = (patient_tasks || []) + [task]
    save
  end

  def complete_task(task_id)
    tasks = patient_tasks || []
    task = tasks.find { |t| t['id'] == task_id }
    return false unless task

    task['status'] = 'completed'
    task['completed_at'] = Time.current.iso8601
    self.patient_tasks = tasks
    save
  end

  def pending_tasks
    (patient_tasks || []).select { |task| task['status'] == 'pending' }
  end

  def completed_tasks
    (patient_tasks || []).select { |task| task['status'] == 'completed' }
  end

  def remove_task(task_id)
    tasks = (patient_tasks || []).reject { |t| t['id'] == task_id }
    self.patient_tasks = tasks
    save
  end
end


