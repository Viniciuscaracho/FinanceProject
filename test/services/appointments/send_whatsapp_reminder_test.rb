# frozen_string_literal: true

require 'test_helper'

module Appointments
  class SendWhatsappReminderTest < ActiveSupport::TestCase
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
    
    @service = create_service(@account, name: 'Corte de Cabelo')
    @contact = create_contact(@account)
    
    # Criar agendamento amanhã às 10h (dentro do horário de trabalho)
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
      payment_status: :paid,
      whatsapp_reminder_sent: false
    )
  end

    test "should send whatsapp reminder successfully" do
      # Mock do WhatsApp::EvolutionApiClient
      WhatsApp::EvolutionApiClient.stubs(:configured?).returns(true)
      WhatsApp::EvolutionApiClient.stubs(:send_message).returns({ success: true })
      
      result = Appointments::SendWhatsappReminder.call(appointment: @appointment)
      
      assert result.success?
      assert result.sent
      assert_equal 'api', result.sent_via
      assert_not_nil result.message
      
      @appointment.reload
      assert @appointment.whatsapp_reminder_sent?
      assert_not_nil @appointment.whatsapp_reminder_sent_at
    end

    test "should build correct reminder message" do
      WhatsApp::EvolutionApiClient.stubs(:configured?).returns(true)
      WhatsApp::EvolutionApiClient.stubs(:send_message).returns({ success: true })
      
      result = Appointments::SendWhatsappReminder.call(appointment: @appointment)
      
      message = result.message
      assert_includes message, 'Lembrete de Agendamento'
      assert_includes message, @service.name
      assert_includes message, @appointment.start_time.strftime('%d/%m/%Y')
    end

    test "should include google meet link in message if available" do
      @appointment.update!(google_meet_link: 'https://meet.google.com/abc-defg-hij')
      
      WhatsApp::EvolutionApiClient.stubs(:configured?).returns(true)
      WhatsApp::EvolutionApiClient.stubs(:send_message).returns({ success: true })
      
      result = Appointments::SendWhatsappReminder.call(appointment: @appointment)
      
      assert_includes result.message, @appointment.google_meet_link
    end

    test "should not send reminder if already sent" do
      @appointment.update!(
        whatsapp_reminder_sent: true,
        whatsapp_reminder_sent_at: Time.current - 1.hour
      )
      
      WhatsApp::EvolutionApiClient.expects(:send_message).never
      
      result = Appointments::SendWhatsappReminder.call(appointment: @appointment)
      
      assert_not result.success?
      assert_includes result.error, 'Reminder already sent'
    end

    test "should not send reminder if appointment is not confirmed" do
      @appointment.update_column(:status, Appointment::APPOINTMENT_STATUS[:pending])
      
      WhatsApp::EvolutionApiClient.expects(:send_message).never
      
      result = Appointments::SendWhatsappReminder.call(appointment: @appointment)
      
      assert_not result.success?
      assert_includes result.error, 'Appointment must be confirmed'
    end

    test "should create whatsapp link if API is not configured" do
      WhatsApp::EvolutionApiClient.stubs(:configured?).returns(false)
      
      result = Appointments::SendWhatsappReminder.call(appointment: @appointment)
      
      assert_not result.sent
      assert_not_nil result.whatsapp_link
      assert_includes result.whatsapp_link, 'wa.me'
      assert_includes result.whatsapp_link, '5511999999999'
    end

    test "should create whatsapp link if API send fails" do
      WhatsApp::EvolutionApiClient.stubs(:configured?).returns(true)
      WhatsApp::EvolutionApiClient.stubs(:send_message).returns({ 
        success: false, 
        error: 'API Error' 
      })
      
      result = Appointments::SendWhatsappReminder.call(appointment: @appointment)
      
      assert_not result.sent
      assert_not_nil result.whatsapp_link
      assert_not_nil result.error
    end

    test "should normalize phone number in whatsapp link" do
      @appointment.update!(whatsapp_number: '(11) 99999-9999')
      
      WhatsApp::EvolutionApiClient.stubs(:configured?).returns(false)
      
      result = Appointments::SendWhatsappReminder.call(appointment: @appointment)
      
      # Deve normalizar removendo caracteres não numéricos
      assert_includes result.whatsapp_link, '5511999999999'
    end

    test "should add country code if missing in whatsapp link" do
      @appointment.update!(whatsapp_number: '11999999999')
      
      WhatsApp::EvolutionApiClient.stubs(:configured?).returns(false)
      
      result = Appointments::SendWhatsappReminder.call(appointment: @appointment)
      
      # Deve adicionar código do país (55 para Brasil)
      assert_includes result.whatsapp_link, '5511999999999'
    end

    test "should fail without appointment" do
      result = Appointments::SendWhatsappReminder.call(appointment: nil)
      
      assert_not result.success?
      assert_includes result.error, 'Appointment is required'
    end

    test "should include professional name in message" do
      WhatsApp::EvolutionApiClient.stubs(:configured?).returns(true)
      WhatsApp::EvolutionApiClient.stubs(:send_message).returns({ success: true })
      
      result = Appointments::SendWhatsappReminder.call(appointment: @appointment)
      
      professional_name = @account_user.user.first_name
      assert_includes result.message, professional_name
    end
  end
end

