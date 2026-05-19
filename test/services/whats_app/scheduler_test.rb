# frozen_string_literal: true

require 'test_helper'

module WhatsApp
  class SchedulerTest < ActiveSupport::TestCase
    setup do
      _, @account = register_user
      @contact = create_contact(@account)
      @config = @account.create_whatsapp_config!(
        enabled: true,
        evolution_api_url: 'http://localhost:8080',
        evolution_api_key: 'key',
        allowed_hours_start: 8,
        allowed_hours_end: 20,
        cooldown_minutes: 30
      )
    end

    test "returns current time when no recent messages" do
      travel_to Time.zone.parse('2026-05-18 10:00:00') do
        slot = Scheduler.next_slot(@account, @contact)
        assert slot <= Time.current + 1.second
      end
    end

    test "applies cooldown when message sent recently" do
      travel_to Time.zone.parse('2026-05-18 10:00:00') do
        msg = WhatsappMessage.create!(
          account: @account, contact: @contact,
          event_type: 'appointment_confirmation', channel: 'bot',
          status: 'sent', idempotency_key: "k-#{SecureRandom.hex}",
          body: 'test', scheduled_for: Time.current,
          sent_at: 10.minutes.ago
        )

        slot = Scheduler.next_slot(@account, @contact)
        assert slot >= 20.minutes.from_now - 5.seconds
      end
    end

    test "pushes message to allowed window start when before hours" do
      travel_to Time.zone.parse('2026-05-18 06:00:00 -0300') do
        slot = Scheduler.next_slot(@account, @contact)
        slot_local = slot.in_time_zone('America/Sao_Paulo')
        assert_equal 8, slot_local.hour
      end
    end

    test "pushes message to next day when after allowed hours" do
      travel_to Time.zone.parse('2026-05-18 21:00:00 -0300') do
        slot = Scheduler.next_slot(@account, @contact)
        slot_local = slot.in_time_zone('America/Sao_Paulo')
        assert_equal 8, slot_local.hour
        assert_equal Date.parse('2026-05-19'), slot_local.to_date
      end
    end

    test "does not push when within allowed hours" do
      travel_to Time.zone.parse('2026-05-18 14:00:00 -0300') do
        slot = Scheduler.next_slot(@account, @contact)
        slot_local = slot.in_time_zone('America/Sao_Paulo')
        assert_equal 14, slot_local.hour
      end
    end
  end
end
