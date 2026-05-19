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
class WhatsappMessage < ApplicationRecord
  acts_as_tenant :account

  belongs_to :account
  belongs_to :contact, foreign_key: :contact_id, class_name: 'Contact'
  belongs_to :reference, polymorphic: true, optional: true

  STATUSES    = %w[pending sent failed cancelled skipped].freeze
  CHANNELS    = %w[bot professional].freeze
  EVENT_TYPES = %w[
    appointment_confirmation
    appointment_reminder_24h
    appointment_reminder_1h
    payment_link
    payment_confirmed
    meal_plan_updated
    form_pending
    return_reminder
  ].freeze

  validates :event_type,      inclusion: { in: EVENT_TYPES }
  validates :channel,         inclusion: { in: CHANNELS }
  validates :status,          inclusion: { in: STATUSES }
  validates :idempotency_key, presence: true, uniqueness: true

  scope :pending,   -> { where(status: 'pending') }
  scope :sent,      -> { where(status: 'sent') }
  scope :failed,    -> { where(status: 'failed') }
  scope :due,       -> { pending.where('scheduled_for <= ?', Time.current) }
  scope :for_contact, ->(contact) { where(contact: contact) }
  scope :recently_sent_to, ->(contact, minutes) {
    sent.where(contact: contact).where('sent_at >= ?', minutes.minutes.ago)
  }

  def mark_sent!(external_id: nil)
    update!(status: 'sent', sent_at: Time.current, external_id: external_id)
  end

  def mark_failed!(error)
    update!(status: 'failed', error_message: error.to_s.truncate(500))
  end

  def mark_skipped!(reason = nil)
    update!(status: 'skipped', error_message: reason)
  end
end
