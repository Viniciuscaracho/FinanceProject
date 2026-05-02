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
require 'test_helper'

class AppointmentNoteTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    @bank_account = create_bank_account(@account)
    @account_user = @account.account_users.first
    
    # Configurar horário de trabalho
    @account_user.update!(
      schedule: {
        'monday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
        'tuesday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
        'wednesday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
        'thursday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
        'friday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 }
      }
    )
    
    @service = create_service(@account)
    @contact = create_contact(@account)
    
    # Criar agendamento amanhã às 10h
    tomorrow = Time.current + 1.day
    start_time = tomorrow.beginning_of_day + 10.hours
    
    @appointment = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: start_time,
      end_time: start_time + 1.hour,
      price_cents: 3000,
      whatsapp_number: "5511999999999",
      status: :confirmed,
      payment_status: :paid
    )
  end

  test "should create appointment note" do
    note = @account.appointment_notes.create!(
      appointment: @appointment,
      notes: 'Paciente apresentou melhora significativa'
    )
    
    assert_not_nil note.id
    assert_equal @appointment, note.appointment
    assert_equal @account, note.account
  end

  test "should require notes" do
    note = @account.appointment_notes.new(
      appointment: @appointment
    )
    
    assert_not note.valid?
    assert_includes note.errors[:notes], "can't be blank"
  end

  test "should require minimum length for notes" do
    note = @account.appointment_notes.new(
      appointment: @appointment,
      notes: 'AB'
    )
    
    assert_not note.valid?
    assert note.errors[:notes].any? { |msg| msg.include?('too short') && msg.include?('3') }
  end

  test "should not allow duplicate notes for same appointment" do
    @account.appointment_notes.create!(
      appointment: @appointment,
      notes: 'Primeira anotação'
    )
    
    duplicate = @account.appointment_notes.new(
      appointment: @appointment,
      notes: 'Segunda anotação'
    )
    
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:appointment_id], 'já possui uma anotação'
  end

  test "should allow notes for different appointments" do
    # Próxima segunda-feira às 10h
    next_monday = (Time.current + 1.week).beginning_of_week + 1.day
    start_time2 = next_monday.beginning_of_day + 10.hours
    
    appointment2 = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: start_time2,
      end_time: start_time2 + 1.hour,
      price_cents: 3000,
      whatsapp_number: "5511888888888",
      status: :confirmed,
      payment_status: :paid
    )
    
    note1 = @account.appointment_notes.create!(
      appointment: @appointment,
      notes: 'Anotação 1'
    )
    
    note2 = @account.appointment_notes.create!(
      appointment: appointment2,
      notes: 'Anotação 2'
    )
    
    assert note1.valid?
    assert note2.valid?
  end

  test "should add patient task" do
    note = @account.appointment_notes.create!(
      appointment: @appointment,
      notes: 'Anotação com tarefa'
    )
    
    note.add_patient_task('Fazer exercícios diários')
    
    note.reload
    assert_equal 1, note.patient_tasks.length
    assert_equal 'pending', note.patient_tasks.first['status']
    assert_equal 'Fazer exercícios diários', note.patient_tasks.first['description']
  end

  test "should complete patient task" do
    note = @account.appointment_notes.create!(
      appointment: @appointment,
      notes: 'Anotação com tarefa'
    )
    
    note.add_patient_task('Tarefa para completar')
    task_id = note.patient_tasks.first['id']
    
    result = note.complete_task(task_id)
    
    assert result
    note.reload
    task = note.patient_tasks.find { |t| t['id'] == task_id }
    assert_equal 'completed', task['status']
    assert_not_nil task['completed_at']
  end

  test "should return false when completing non-existent task" do
    note = @account.appointment_notes.create!(
      appointment: @appointment,
      notes: 'Anotação'
    )
    
    result = note.complete_task('non-existent-id')
    
    assert_not result
  end

  test "should return pending tasks" do
    note = @account.appointment_notes.create!(
      appointment: @appointment,
      notes: 'Anotação com múltiplas tarefas'
    )
    
    note.add_patient_task('Tarefa 1')
    note.add_patient_task('Tarefa 2')
    task_id = note.patient_tasks.first['id']
    note.complete_task(task_id)
    
    pending = note.pending_tasks
    assert_equal 1, pending.length
    assert_equal 'pending', pending.first['status']
  end

  test "should return completed tasks" do
    note = @account.appointment_notes.create!(
      appointment: @appointment,
      notes: 'Anotação'
    )
    
    note.add_patient_task('Tarefa')
    task_id = note.patient_tasks.first['id']
    note.complete_task(task_id)
    
    completed = note.completed_tasks
    assert_equal 1, completed.length
    assert_equal 'completed', completed.first['status']
  end

  test "should remove patient task" do
    note = @account.appointment_notes.create!(
      appointment: @appointment,
      notes: 'Anotação'
    )
    
    note.add_patient_task('Tarefa para remover')
    task_id = note.patient_tasks.first['id']
    
    note.remove_task(task_id)
    
    note.reload
    assert_equal 0, note.patient_tasks.length
  end

  test "should initialize patient_tasks as empty array" do
    note = @account.appointment_notes.create!(
      appointment: @appointment,
      notes: 'Anotação'
    )
    
    assert_equal [], note.patient_tasks
  end

  test "should scope by appointment" do
    # Próxima segunda-feira às 11h
    next_monday = (Time.current + 1.week).beginning_of_week + 1.day
    start_time2 = next_monday.beginning_of_day + 11.hours
    
    appointment2 = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: start_time2,
      end_time: start_time2 + 1.hour,
      price_cents: 3000,
      whatsapp_number: "5511777777777",
      status: :confirmed,
      payment_status: :paid
    )
    
    note1 = @account.appointment_notes.create!(
      appointment: @appointment,
      notes: 'Nota 1'
    )
    
    note2 = @account.appointment_notes.create!(
      appointment: appointment2,
      notes: 'Nota 2'
    )
    
    notes = AppointmentNote.by_appointment(@appointment.id)
    assert_includes notes, note1
    assert_not_includes notes, note2
  end

  test "should scope recent notes" do
    # Criar primeiro appointment com nota
    next_monday1 = (Time.current + 1.week).beginning_of_week + 1.day
    start_time1 = next_monday1.beginning_of_day + 10.hours
    
    appointment1 = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: start_time1,
      end_time: start_time1 + 1.hour,
      price_cents: 3000,
      whatsapp_number: "5511999999999",
      status: :confirmed,
      payment_status: :paid
    )
    
    note1 = @account.appointment_notes.create!(
      appointment: appointment1,
      notes: 'Nota antiga',
      created_at: 2.days.ago
    )
    
    # Criar segundo appointment com nota mais recente
    next_monday2 = (Time.current + 1.week).beginning_of_week + 1.day + 1.week
    start_time2 = next_monday2.beginning_of_day + 10.hours
    
    appointment2 = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: start_time2,
      end_time: start_time2 + 1.hour,
      price_cents: 3000,
      whatsapp_number: "5511666666666",
      status: :confirmed,
      payment_status: :paid
    )
    
    note2 = @account.appointment_notes.create!(
      appointment: appointment2,
      notes: 'Nota recente'
    )
    
    recent = AppointmentNote.recent.limit(2)
    assert_equal note2.id, recent.first.id
  end
end

