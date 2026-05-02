# frozen_string_literal: true

require 'test_helper'

class AppointmentReminderJobTest < ActiveJob::TestCase
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
  end

  test "should send reminders for appointments in next 24 hours" do
    # Criar agendamento confirmado para amanhã (dentro de 24h) às 10h
    tomorrow = Time.current + 1.day
    start_time = tomorrow.beginning_of_day + 10.hours
    
    appointment = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: start_time,
      end_time: start_time + 1.hour,
      price_cents: 3000,
      whatsapp_number: "5511999999999",
      status: :confirmed,
      payment_status: :paid,
      whatsapp_reminder_sent: false
    )
    
    # Mock do serviço de envio
    Appointments::SendWhatsappReminder.expects(:call).once.with(appointment: appointment).returns(
      OpenStruct.new(success?: true)
    )
    
    AppointmentReminderJob.perform_now
  end

  test "should not send reminders for appointments already sent" do
    tomorrow = Time.current + 1.day
    start_time = tomorrow.beginning_of_day + 10.hours
    
    appointment = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: start_time,
      end_time: start_time + 1.hour,
      price_cents: 3000,
      whatsapp_number: "5511999999999",
      status: :confirmed,
      payment_status: :paid,
      whatsapp_reminder_sent: true,
      whatsapp_reminder_sent_at: Time.current - 1.hour
    )
    
    Appointments::SendWhatsappReminder.expects(:call).never
    
    AppointmentReminderJob.perform_now
  end

  test "should not send reminders for appointments more than 24 hours away" do
    # Criar agendamento para mais de 24h no futuro (2 dias, às 10h)
    future_date = Time.current + 2.days
    start_time = future_date.beginning_of_day + 10.hours
    
    appointment = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: start_time,
      end_time: start_time + 1.hour,
      price_cents: 3000,
      whatsapp_number: "5511999999999",
      status: :confirmed,
      payment_status: :paid,
      whatsapp_reminder_sent: false
    )
    
    Appointments::SendWhatsappReminder.expects(:call).never
    
    AppointmentReminderJob.perform_now
  end

  test "should not send reminders for past appointments" do
    # Criar agendamento no passado (ontem às 10h)
    yesterday = Time.current - 1.day
    start_time = yesterday.beginning_of_day + 10.hours
    
    appointment = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: start_time,
      end_time: start_time + 1.hour,
      price_cents: 3000,
      whatsapp_number: "5511999999999",
      status: :confirmed,
      payment_status: :paid,
      whatsapp_reminder_sent: false
    )
    
    Appointments::SendWhatsappReminder.expects(:call).never
    
    AppointmentReminderJob.perform_now
  end

  test "should not send reminders for non-confirmed appointments" do
    tomorrow = Time.current + 1.day
    start_time = tomorrow.beginning_of_day + 10.hours
    
    appointment = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: start_time,
      end_time: start_time + 1.hour,
      price_cents: 3000,
      whatsapp_number: "5511999999999",
      status: :pending,
      payment_status: :pending,
      whatsapp_reminder_sent: false
    )
    
    Appointments::SendWhatsappReminder.expects(:call).never
    
    AppointmentReminderJob.perform_now
  end

  test "should handle errors gracefully" do
    tomorrow = Time.current + 1.day
    start_time = tomorrow.beginning_of_day + 10.hours
    
    appointment = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: start_time,
      end_time: start_time + 1.hour,
      price_cents: 3000,
      whatsapp_number: "5511999999999",
      status: :confirmed,
      payment_status: :paid,
      whatsapp_reminder_sent: false
    )
    
    Appointments::SendWhatsappReminder.expects(:call).once.raises(StandardError.new('API Error'))
    
    # Não deve lançar exceção
    assert_nothing_raised do
      AppointmentReminderJob.perform_now
    end
  end

  test "should process multiple appointments" do
    # Criar múltiplos agendamentos (amanhã às diferentes horas dentro de 24h)
    appointments = []
    3.times do |i|
      # Amanhã às 10h, 11h, 12h (todos dentro de 24h)
      tomorrow = Time.current + 1.day
      start_time = tomorrow.beginning_of_day + (10 + i).hours
      
      appointments << @account.appointments.create!(
        account_user: @account_user,
        service: @service,
        contact: @contact,
        start_time: start_time,
        end_time: start_time + 1.hour,
        price_cents: 3000,
        whatsapp_number: "551199999999#{i}",
        status: :confirmed,
        payment_status: :paid,
        whatsapp_reminder_sent: false
      )
    end
    
    # Apenas os que estão dentro de 24h devem receber lembrete
    # O job busca agendamentos que acontecem nas próximas 24 horas
    appointments_in_24h = appointments.select { |apt| apt.start_time <= 24.hours.from_now }
    
    Appointments::SendWhatsappReminder.expects(:call).times(appointments_in_24h.count)
    
    AppointmentReminderJob.perform_now
  end

  test "should exclude canceled and no_show appointments" do
    tomorrow = Time.current + 1.day
    start_time = tomorrow.beginning_of_day + 10.hours
    
    # Agendamento cancelado (criar como confirmed primeiro, depois cancelar)
    canceled = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: start_time,
      end_time: start_time + 1.hour,
      price_cents: 3000,
      whatsapp_number: "5511999999999",
      status: :confirmed,
      payment_status: :paid,
      whatsapp_reminder_sent: false
    )
    canceled.update!(status: :canceled, payment_status: :refunded)
    
    # Agendamento no_show (criar como confirmed primeiro, depois marcar como no_show)
    no_show = @account.appointments.create!(
      account_user: @account_user,
      service: @service,
      contact: @contact,
      start_time: start_time + 1.hour,
      end_time: start_time + 2.hours,
      price_cents: 3000,
      whatsapp_number: "5511888888888",
      status: :confirmed,
      payment_status: :paid,
      whatsapp_reminder_sent: false
    )
    no_show.update!(status: :no_show)
    
    Appointments::SendWhatsappReminder.expects(:call).never
    
    AppointmentReminderJob.perform_now
  end
end

