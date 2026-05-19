# frozen_string_literal: true

# == Schema Information
#
# Table name: whatsapp_messages
#
#  id              :bigint           not null, primary key
#  body            :text
#  channel         :string           default("bot"), not null
#  error_message   :string
#  event_type      :string           not null
#  idempotency_key :string           not null
#  metadata        :json
#  reference_type  :string
#  scheduled_for   :datetime
#  sent_at         :datetime
#  status          :string           default("pending"), not null
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  account_id      :bigint           not null
#  contact_id      :bigint           not null
#  external_id     :string
#  reference_id    :bigint
#
# Indexes
#
#  index_whatsapp_messages_on_account_id                       (account_id)
#  index_whatsapp_messages_on_contact_id                       (contact_id)
#  index_whatsapp_messages_on_contact_id_and_scheduled_for     (contact_id,scheduled_for)
#  index_whatsapp_messages_on_idempotency_key                  (idempotency_key) UNIQUE
#  index_whatsapp_messages_on_reference_type_and_reference_id  (reference_type,reference_id)
#  index_whatsapp_messages_on_status_and_scheduled_for         (status,scheduled_for)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#  fk_rails_...  (contact_id => people.id)
#
require 'test_helper'

class WhatsappMessageTest < ActiveSupport::TestCase
  setup do
    _, @account = register_user
    @contact = create_contact(@account)
  end

  def build_message(overrides = {})
    WhatsappMessage.new(
      {
        account:         @account,
        contact:         @contact,
        event_type:      'appointment_confirmation',
        channel:         'bot',
        status:          'pending',
        idempotency_key: "key-#{SecureRandom.hex(4)}",
        body:            'Olá, teste',
        scheduled_for:   1.hour.from_now
      }.merge(overrides)
    )
  end

  test "valid with required fields" do
    assert build_message.valid?
  end

  test "invalid without idempotency_key" do
    msg = build_message(idempotency_key: nil)
    assert_not msg.valid?
    assert msg.errors[:idempotency_key].any?
  end

  test "invalid with duplicate idempotency_key" do
    key = "unique-key-#{SecureRandom.hex}"
    build_message(idempotency_key: key).save!
    duplicate = build_message(idempotency_key: key)
    assert_not duplicate.valid?
  end

  test "invalid with unknown event_type" do
    msg = build_message(event_type: 'unknown_event')
    assert_not msg.valid?
  end

  test "invalid with unknown channel" do
    msg = build_message(channel: 'telegram')
    assert_not msg.valid?
  end

  test "mark_sent! updates status and sent_at" do
    msg = build_message.tap(&:save!)
    msg.mark_sent!(external_id: 'ext-123')
    assert_equal 'sent', msg.reload.status
    assert_not_nil msg.sent_at
    assert_equal 'ext-123', msg.external_id
  end

  test "mark_failed! updates status and error_message" do
    msg = build_message.tap(&:save!)
    msg.mark_failed!('timeout error')
    assert_equal 'failed', msg.reload.status
    assert_includes msg.error_message, 'timeout error'
  end

  test "mark_skipped! updates status" do
    msg = build_message.tap(&:save!)
    msg.mark_skipped!('appointment cancelled')
    assert_equal 'skipped', msg.reload.status
  end

  test "scope due returns pending messages with scheduled_for in the past" do
    past_msg = build_message(scheduled_for: 5.minutes.ago).tap(&:save!)
    future_msg = build_message(
      idempotency_key: "future-#{SecureRandom.hex}",
      scheduled_for: 1.hour.from_now
    ).tap(&:save!)

    due = WhatsappMessage.due
    assert_includes due, past_msg
    assert_not_includes due, future_msg
  end

  test "scope recently_sent_to returns sent messages within window" do
    msg = build_message.tap(&:save!)
    msg.mark_sent!

    within = WhatsappMessage.recently_sent_to(@contact, 30)
    assert_includes within, msg.reload
  end
end
