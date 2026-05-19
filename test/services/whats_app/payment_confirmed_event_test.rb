# frozen_string_literal: true

require 'test_helper'

class PaymentConfirmedEventTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    @account_user = @account.account_users.first
    @account_user.update!(schedule: {
      'monday'    => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
      'tuesday'   => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
      'wednesday' => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
      'thursday'  => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
      'friday'    => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
      'saturday'  => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 },
      'sunday'    => { 'enabled' => true, 'start_hour' => 9, 'end_hour' => 18 }
    })

    @service = create_service(@account, name: 'Consulta')
    @contact = create_contact(@account)

    start_time = (Time.current + 1.day).change(hour: 10, min: 0, sec: 0)
    @appointment = @account.appointments.create!(
      account_user:    @account_user,
      service:         @service,
      contact:         @contact,
      start_time:      start_time,
      end_time:        start_time + 1.hour,
      price_cents:     10000,
      whatsapp_number: @contact.cell_phone_number,
      status:          :confirmed,
      payment_status:  :pending
    )

    @account.create_whatsapp_config!(
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

  test "creates payment_confirmed WhatsappMessage when payment_status changes to paid" do
    assert_difference 'WhatsappMessage.count', 1 do
      @appointment.update!(payment_status: :paid)
    end

    msg = WhatsappMessage.last
    assert_equal 'payment_confirmed', msg.event_type
    assert_equal 'pending',           msg.status
  end

  test "does not create duplicate payment_confirmed message" do
    @appointment.update!(payment_status: :paid)

    assert_no_difference 'WhatsappMessage.count' do
      @appointment.touch
    end
  end

  test "does not fire when config is disabled" do
    @account.whatsapp_config.update!(enabled: false)

    assert_no_difference 'WhatsappMessage.count' do
      @appointment.update!(payment_status: :paid)
    end
  end

  test "does not fire when contact has no phone" do
    @contact.update_column(:cell_phone_number, nil)

    assert_no_difference 'WhatsappMessage.count' do
      @appointment.update!(payment_status: :paid)
    end
  end

  test "body includes contact name" do
    @appointment.update!(payment_status: :paid)
    assert_includes WhatsappMessage.last.body, @contact.first_name
  end
end
