# frozen_string_literal: true

require 'test_helper'

module WhatsApp
  class EventHandlerTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @contact = create_contact(@account)
      @account_user = @account.account_users.first
      @service = create_service(@account, name: 'Consulta')

      # Appointment criado ANTES do config para que o after_commit
      # dispare sem config ativo e não consuma a idempotency_key.
      @appointment = @account.appointments.create!(
        account_user: @account_user,
        service: @service,
        contact: @contact,
        start_time: 1.day.from_now.change(hour: 10, min: 0, sec: 0),
        end_time: 1.day.from_now.change(hour: 11, min: 0, sec: 0),
        price_cents: 10000,
        whatsapp_number: @contact.cell_phone_number,
        status: :confirmed,
        payment_status: :pending
      )

      @config = @account.create_whatsapp_config!(
        enabled: true,
        evolution_api_url: 'http://localhost:8080',
        evolution_api_key: 'key',
        evolution_instance_name: 'test',
        allowed_hours_start: 0,
        allowed_hours_end: 23,
        cooldown_minutes: 0
      )

      @configured_job = mock('configured_job')
      @configured_job.stubs(:perform_later)
      WhatsApp::SenderJob.stubs(:set).returns(@configured_job)
    end

    test "creates WhatsappMessage for valid event" do
      assert_difference 'WhatsappMessage.count', 1 do
        EventHandler.call(
          account:  @account,
          contact:  @contact,
          event:    :appointment_confirmation,
          resource: @appointment
        )
      end

      msg = WhatsappMessage.last
      assert_equal 'pending',                  msg.status
      assert_equal 'appointment_confirmation', msg.event_type
      assert_equal 'bot',                      msg.channel
    end

    test "skips when whatsapp not enabled" do
      @config.update!(enabled: false)

      assert_no_difference 'WhatsappMessage.count' do
        EventHandler.call(account: @account, contact: @contact, event: :appointment_confirmation, resource: @appointment)
      end
    end

    test "skips when automation disabled for event" do
      @config.update!(automations: { 'appointment_confirmation' => false })

      assert_no_difference 'WhatsappMessage.count' do
        EventHandler.call(account: @account, contact: @contact, event: :appointment_confirmation, resource: @appointment)
      end
    end

    test "skips when contact has no phone" do
      @contact.update_column(:cell_phone_number, nil)

      assert_no_difference 'WhatsappMessage.count' do
        EventHandler.call(account: @account, contact: @contact, event: :appointment_confirmation, resource: @appointment)
      end
    end

    test "idempotency: second call with same key does not create duplicate" do
      EventHandler.call(account: @account, contact: @contact, event: :appointment_confirmation, resource: @appointment)

      assert_no_difference 'WhatsappMessage.count' do
        EventHandler.call(account: @account, contact: @contact, event: :appointment_confirmation, resource: @appointment)
      end
    end

    test "skips when resource state invalid" do
      @appointment.update_column(:status, Appointment::APPOINTMENT_STATUS[:canceled])

      assert_no_difference 'WhatsappMessage.count' do
        EventHandler.call(account: @account, contact: @contact, event: :appointment_confirmation, resource: @appointment)
      end
    end

    test "body is rendered with contact name" do
      EventHandler.call(account: @account, contact: @contact, event: :appointment_confirmation, resource: @appointment)

      msg = WhatsappMessage.last
      assert_includes msg.body, @contact.first_name
    end

    test "enqueues SenderJob after creating message" do
      @configured_job.expects(:perform_later).once

      EventHandler.call(account: @account, contact: @contact, event: :appointment_confirmation, resource: @appointment)
    end
  end
end
