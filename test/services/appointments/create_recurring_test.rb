# frozen_string_literal: true

require 'test_helper'

module Appointments
  class CreateRecurringTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    @bank_account = create_bank_account(@account)
    @account_user = @account.account_users.first
    
    # Configurar horário de trabalho (segunda a sexta, 9h-18h)
    @account_user.update!(
      schedule: {
        'monday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
        'tuesday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
        'wednesday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
        'thursday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
        'friday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 }
      }
    )
    
    @service = create_service(@account, selling_price_cents: 3000)
    @contact = create_contact(@account)
    
    # Criar agendamento pai em uma segunda-feira às 10h (dentro do horário de trabalho)
    next_monday = (Time.current + 1.week).beginning_of_week + 1.day
    start_time = next_monday.beginning_of_day + 10.hours
    
    @parent_appointment = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: start_time,
      end_time: start_time + 1.hour,
      price_cents: 3000,
      whatsapp_number: "5511999999999",
      status: :pending,
      payment_status: :pending
    )
  end

    test "should create recurring appointments with weekly frequency" do
      recurrence_pattern = {
        'frequency' => 'weekly',
        'occurrences' => 4
      }

      result = Appointments::CreateRecurring.call(
        parent_appointment: @parent_appointment,
        recurrence_pattern: recurrence_pattern
      )

      assert result.success?
      assert_equal 3, result.count # 4 ocorrências - 1 (parent) = 3 novos
      
      # Verificar que o parent tem o padrão salvo
      @parent_appointment.reload
      assert_equal 'weekly', @parent_appointment.recurrence_pattern['frequency']
      assert_equal 4, @parent_appointment.recurrence_pattern['occurrences']
      
      # Verificar que foram criados 3 agendamentos filhos
      recurring_appointments = @parent_appointment.recurring_appointments.order(:start_time)
      assert_equal 3, recurring_appointments.count
      
      # Verificar que os agendamentos estão espaçados de 1 semana
      first_child = recurring_appointments.first
      assert_equal @parent_appointment.start_time + 1.week, first_child.start_time
      assert_equal @parent_appointment.end_time + 1.week, first_child.end_time
      
      second_child = recurring_appointments.second
      assert_equal @parent_appointment.start_time + 2.weeks, second_child.start_time
    end

    test "should create recurring appointments with daily frequency" do
      recurrence_pattern = {
        'frequency' => 'daily',
        'occurrences' => 5
      }

      result = Appointments::CreateRecurring.call(
        parent_appointment: @parent_appointment,
        recurrence_pattern: recurrence_pattern
      )

      assert result.success?
      assert_equal 4, result.count
      
      recurring_appointments = @parent_appointment.recurring_appointments.order(:start_time)
      assert_equal 4, recurring_appointments.count
      
      # Verificar espaçamento diário
      first_child = recurring_appointments.first
      assert_equal @parent_appointment.start_time + 1.day, first_child.start_time
    end

    test "should create recurring appointments with monthly frequency" do
      recurrence_pattern = {
        'frequency' => 'monthly',
        'occurrences' => 3
      }

      result = Appointments::CreateRecurring.call(
        parent_appointment: @parent_appointment,
        recurrence_pattern: recurrence_pattern
      )

      assert result.success?
      assert_equal 2, result.count
      
      recurring_appointments = @parent_appointment.recurring_appointments.order(:start_time)
      assert_equal 2, recurring_appointments.count
      
      first_child = recurring_appointments.first
      assert_equal @parent_appointment.start_time + 1.month, first_child.start_time
    end

    test "should respect end_date when creating recurring appointments" do
      end_date = (Time.current + 3.weeks).to_date
      recurrence_pattern = {
        'frequency' => 'weekly',
        'occurrences' => 10, # Mais ocorrências do que cabem até end_date
        'end_date' => end_date.iso8601
      }

      result = Appointments::CreateRecurring.call(
        parent_appointment: @parent_appointment,
        recurrence_pattern: recurrence_pattern
      )

      assert result.success?
      
      # Deve criar apenas até a end_date
      recurring_appointments = @parent_appointment.recurring_appointments.order(:start_time)
      last_appointment = recurring_appointments.last
      
      assert last_appointment.start_time.to_date <= end_date
    end

    test "should fail without parent appointment" do
      result = Appointments::CreateRecurring.call(
        parent_appointment: nil,
        recurrence_pattern: { 'frequency' => 'weekly', 'occurrences' => 4 }
      )

      assert_not result.success?
      assert_includes result.error, 'Parent appointment is required'
    end

    test "should fail with invalid frequency" do
      recurrence_pattern = {
        'frequency' => 'invalid',
        'occurrences' => 4
      }

      result = Appointments::CreateRecurring.call(
        parent_appointment: @parent_appointment,
        recurrence_pattern: recurrence_pattern
      )

      assert_not result.success?
      assert_includes result.error, 'Invalid frequency'
    end

    test "should use default occurrences when not specified" do
      recurrence_pattern = {
        'frequency' => 'weekly'
      }

      result = Appointments::CreateRecurring.call(
        parent_appointment: @parent_appointment,
        recurrence_pattern: recurrence_pattern
      )

      assert result.success?
      assert_equal 9, result.count # 10 - 1 (parent) = 9
    end

    test "should copy all attributes from parent to recurring appointments" do
      recurrence_pattern = {
        'frequency' => 'weekly',
        'occurrences' => 2
      }

      result = Appointments::CreateRecurring.call(
        parent_appointment: @parent_appointment,
        recurrence_pattern: recurrence_pattern
      )

      assert result.success?
      
      child = @parent_appointment.recurring_appointments.first
      assert_equal @parent_appointment.account, child.account
      assert_equal @parent_appointment.account_user, child.account_user
      assert_equal @parent_appointment.service, child.service
      assert_equal @parent_appointment.contact, child.contact
      assert_equal @parent_appointment.price_cents, child.price_cents
      assert_equal @parent_appointment.whatsapp_number, child.whatsapp_number
      assert_equal @parent_appointment.status, child.status
      assert_equal @parent_appointment.payment_status, child.payment_status
      assert_equal @parent_appointment.id, child.parent_appointment_id
    end

    test "should generate google meet links for recurring appointments if parent has one" do
      @parent_appointment.update!(google_meet_link: 'https://meet.google.com/abc-defg-hij')
      
      Appointments::GenerateGoogleMeetLink.expects(:call).twice
      
      recurrence_pattern = {
        'frequency' => 'weekly',
        'occurrences' => 3
      }

      result = Appointments::CreateRecurring.call(
        parent_appointment: @parent_appointment,
        recurrence_pattern: recurrence_pattern
      )

      assert result.success?
    end

    test "should not generate google meet links if parent does not have one" do
      Appointments::GenerateGoogleMeetLink.expects(:call).never
      
      recurrence_pattern = {
        'frequency' => 'weekly',
        'occurrences' => 2
      }

      result = Appointments::CreateRecurring.call(
        parent_appointment: @parent_appointment,
        recurrence_pattern: recurrence_pattern
      )

      assert result.success?
    end

    test "should calculate end_time correctly based on parent duration" do
      # Parent com duração de 2 horas (dentro do horário de trabalho)
      next_monday = (Time.current + 1.week).beginning_of_week + 1.day
      start_time = next_monday.beginning_of_day + 9.hours # 9h da manhã
      
      @parent_appointment.update!(
        start_time: start_time,
        end_time: start_time + 2.hours # 11h da manhã
      )

      recurrence_pattern = {
        'frequency' => 'weekly',
        'occurrences' => 2
      }

      result = Appointments::CreateRecurring.call(
        parent_appointment: @parent_appointment,
        recurrence_pattern: recurrence_pattern
      )

      assert result.success?
      
      child = @parent_appointment.recurring_appointments.first
      duration = child.end_time - child.start_time
      parent_duration = @parent_appointment.end_time - @parent_appointment.start_time
      
      assert_equal parent_duration, duration
    end
  end
end

