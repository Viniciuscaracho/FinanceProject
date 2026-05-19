# frozen_string_literal: true

require 'test_helper'

class AppointmentReminderJobTest < ActiveJob::TestCase
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

    @service = create_service(@account)
    @contact = create_contact(@account)

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

  # Amanhã às 10h — sempre dentro de 24h e dentro do horário de trabalho.
  def tomorrow_10h
    (Time.current + 1.day).change(hour: 10, min: 0, sec: 0)
  end

  def make_appointment(overrides = {})
    defaults = {
      account_user:           @account_user,
      service:                @service,
      contact:                @contact,
      start_time:             tomorrow_10h,
      end_time:               tomorrow_10h + 1.hour,
      price_cents:            3000,
      whatsapp_number:        @contact.cell_phone_number,
      status:                 :confirmed,
      payment_status:         :pending,
      whatsapp_reminder_sent: false
    }
    @account.appointments.create!(defaults.merge(overrides))
  end

  test "enqueues WhatsappMessage for confirmed appointment in next 24h" do
    make_appointment

    assert_difference 'WhatsappMessage.count', 1 do
      AppointmentReminderJob.perform_now
    end

    assert_equal 'appointment_reminder_24h', WhatsappMessage.last.event_type
  end

  test "marks whatsapp_reminder_sent after enqueuing" do
    apt = make_appointment
    AppointmentReminderJob.perform_now
    assert apt.reload.whatsapp_reminder_sent?
  end

  test "does not re-enqueue for the same appointment" do
    make_appointment
    AppointmentReminderJob.perform_now

    assert_no_difference 'WhatsappMessage.count' do
      AppointmentReminderJob.perform_now
    end
  end

  test "skips appointments more than 24h away" do
    t = (Time.current + 2.days).change(hour: 10, min: 0, sec: 0)
    make_appointment(start_time: t, end_time: t + 1.hour)

    assert_no_difference 'WhatsappMessage.count' do
      AppointmentReminderJob.perform_now
    end
  end

  test "skips non-confirmed appointments" do
    make_appointment(status: :pending)

    assert_no_difference 'WhatsappMessage.count' do
      AppointmentReminderJob.perform_now
    end
  end

  test "skips canceled appointments" do
    apt = make_appointment
    apt.update_columns(status: Appointment::APPOINTMENT_STATUS[:canceled])

    assert_no_difference 'WhatsappMessage.count' do
      AppointmentReminderJob.perform_now
    end
  end

  test "handles errors per appointment gracefully without stopping the job" do
    make_appointment
    WhatsApp::EventHandler.stubs(:call).raises(StandardError.new('API Error'))

    assert_nothing_raised { AppointmentReminderJob.perform_now }
  end

  test "processes multiple appointments" do
    contact2 = create_contact(@account)
    make_appointment
    t = tomorrow_10h + 1.hour
    @account.appointments.create!(
      account_user: @account_user, service: @service, contact: contact2,
      start_time: t, end_time: t + 1.hour,
      price_cents: 3000, whatsapp_number: contact2.cell_phone_number,
      status: :confirmed, payment_status: :pending, whatsapp_reminder_sent: false
    )

    assert_difference 'WhatsappMessage.count', 2 do
      AppointmentReminderJob.perform_now
    end
  end
end
